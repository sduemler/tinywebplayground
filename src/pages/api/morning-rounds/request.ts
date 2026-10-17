export const prerender = false;

import type { APIRoute } from "astro";
import { openRequestPr, parseRequest, RequestError } from "../../../server/morning-rounds/gameRequest";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  // Honeypot: the "website" field is hidden from people, so only bots fill it in.
  // Answer as if it worked so they don't learn to skip it.
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return json({ success: true });
  }

  try {
    const req = parseRequest(body);
    const token = import.meta.env.GITHUB_GAME_REQUEST_TOKEN;
    if (!token) throw new RequestError("Game requests aren't switched on yet.", 503);
    const prUrl = await openRequestPr(token, req);
    return json({ success: true, prUrl });
  } catch (err) {
    if (err instanceof RequestError) return json({ success: false, error: err.message }, err.status);
    console.error("morning-rounds request failed", err);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
};
