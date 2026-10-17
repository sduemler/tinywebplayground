// Turns a "Request a game" submission into a pull request that adds the game to
// src/data/morning-rounds/games.ts. Server-only: it uses GITHUB_GAME_REQUEST_TOKEN.
import { GROUPS, type Group } from "@data/morning-rounds/games";
import { monogramFor, normalizeUrl } from "@components/projects/morning-rounds/utils";

export const REPO = "sduemler/tinywebplayground";
export const BASE_BRANCH = "main";
export const GAMES_PATH = "src/data/morning-rounds/games.ts";
/** Request PRs live on branches with this prefix; that's how open requests are counted. */
export const BRANCH_PREFIX = "game-request/";
/** Stop accepting requests while this many are waiting for review. */
export const MAX_OPEN_REQUESTS = 10;

const DEFAULT_TAGS: Record<Group, string> = {
  Words: "Word",
  Music: "Music",
  Games: "Video games",
  Geography: "Geography",
  Misc: "Misc",
};

export interface GameRequest {
  name: string;
  url: string;
  group: Group;
  blurb: string;
}

export class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Checks and cleans the submitted form fields, or throws a RequestError the user can read. */
export function parseRequest(body: unknown): GameRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

  const name = str(b.name);
  if (name.length < 2 || name.length > 40) throw new RequestError("Give the game a name (up to 40 characters).", 400);

  const url = normalizeUrl(str(b.url));
  if (!url || url.length > 300) throw new RequestError("That doesn't look like a web address.", 400);

  const group = str(b.group) as Group;
  if (!GROUPS.includes(group)) throw new RequestError("Pick a group for the game.", 400);

  const blurb = str(b.blurb);
  if (blurb.length > 120) throw new RequestError("Keep the description to 120 characters.", 400);

  return { name, url, group, blurb };
}

/** "https://www.Example.com/daily/" → "example.com/daily", for spotting duplicates. */
export function urlKey(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "game"
  );
}

/**
 * Inserts the requested game at the end of GAMES in games.ts and returns the new source and id.
 * Every value goes through JSON.stringify, so nothing a requester types can break out of a string.
 */
export function addGameToSource(source: string, req: GameRequest): { source: string; id: string } {
  const existingUrls = [...source.matchAll(/^\s*url: "([^"]+)",$/gm)].map((m) => urlKey(m[1]));
  if (existingUrls.includes(urlKey(req.url))) {
    throw new RequestError("That game is already on the list.", 409);
  }

  const ids = new Set([...source.matchAll(/^\s*id: "([^"]+)",$/gm)].map((m) => m[1]));
  const base = slugify(req.name);
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;

  const start = source.indexOf("export const GAMES: Game[] = [");
  const end = start === -1 ? -1 : source.indexOf("\n];\n", start);
  if (end === -1) throw new RequestError("The game list couldn't be updated right now.", 500);

  const q = JSON.stringify;
  const entry = [
    "  {",
    `    id: ${q(id)},`,
    `    group: ${q(req.group)},`,
    `    name: ${q(req.name)},`,
    `    url: ${q(req.url)},`,
    `    tag: ${q(DEFAULT_TAGS[req.group])},`,
    `    blurb: ${q(req.blurb)},`,
    `    monogram: ${q(monogramFor(req.name))},`,
    "  },",
  ].join("\n");

  return { source: source.slice(0, end) + "\n" + entry + source.slice(end), id };
}

/** Stops "@someone" in a description from pinging people on GitHub. */
const quiet = (s: string) => s.replace(/@/g, "@​").replace(/[<>]/g, "");

async function gh(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tinywebplayground-morning-rounds",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    console.error(`GitHub ${init.method ?? "GET"} ${path} → ${res.status}`, await res.text().catch(() => ""));
    throw new RequestError("Couldn't reach GitHub. Please try again later.", 502);
  }
  return res.json();
}

/** Opens the pull request and returns its URL. */
export async function openRequestPr(token: string, req: GameRequest): Promise<string> {
  const open: { head: { ref: string }; body: string | null }[] = await gh(
    token,
    `/pulls?state=open&base=${BASE_BRANCH}&per_page=100`
  );
  const requests = open.filter((p) => p.head.ref.startsWith(BRANCH_PREFIX));
  if (requests.some((p) => (p.body ?? "").includes(`<!-- url-key: ${urlKey(req.url)} -->`))) {
    throw new RequestError("Someone has already requested that game. It's waiting for review.", 409);
  }
  if (requests.length >= MAX_OPEN_REQUESTS) {
    throw new RequestError("The request queue is full right now. Please try again in a few days.", 429);
  }

  const file: { content: string; sha: string } = await gh(
    token,
    `/contents/${GAMES_PATH}?ref=${BASE_BRANCH}`
  );
  const current = Buffer.from(file.content, "base64").toString("utf8");
  const { source, id } = addGameToSource(current, req);

  const baseRef: { object: { sha: string } } = await gh(token, `/git/ref/heads/${BASE_BRANCH}`);
  const branch = `${BRANCH_PREFIX}${id}-${Date.now().toString(36)}`;
  await gh(token, "/git/refs", {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
  });
  await gh(token, `/contents/${GAMES_PATH}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Morning Rounds: add ${req.name} (requested)`,
      content: Buffer.from(source, "utf8").toString("base64"),
      sha: file.sha,
      branch,
    }),
  });

  const body = [
    "A visitor requested this game from the **Request a game** form on Morning Rounds.",
    "",
    "| | |",
    "|---|---|",
    `| Name | ${quiet(req.name)} |`,
    `| Link | ${quiet(req.url)} |`,
    `| Group | ${req.group} |`,
    `| Description | ${req.blurb ? quiet(req.blurb) : "_none given_"} |`,
    "",
    "Check the link works and is a real daily game, tweak the tag, blurb or monogram if needed, then merge.",
    "The **Morning Rounds request icon** workflow adds the site's favicon to this PR. If it finds none, the game shows its letter.",
    "",
    `<!-- url-key: ${urlKey(req.url)} -->`,
  ].join("\n");

  const pr: { html_url: string } = await gh(token, "/pulls", {
    method: "POST",
    body: JSON.stringify({
      title: `Morning Rounds: add ${req.name}`,
      head: branch,
      base: BASE_BRANCH,
      body,
    }),
  });
  return pr.html_url;
}
