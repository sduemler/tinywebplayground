export interface Project {
  slug: string;
  title: string;
  description: string;
  image: string;
  accentColor: string;
  status: "live" | "wip" | "coming-soon";
  /** Day the project first went up on the site (YYYY-MM-DD), shown in the hub index. */
  added: string;
  tags?: string[];
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  titleHtml?: string;
  /** The project lives on its own site: the hub card links there (in a new tab) and says
   *  so, and there is no /projects/<slug> page or manifest for it. */
  externalUrl?: string;
}

export const projects: Project[] = [
  {
    slug: "the-crossword",
    title: "CROSSWORLD",
    description:
      "A collaborative crossword that grows as the world solves it. One clue at a time.",
    image: "/images/projects/the-crossword.png",
    accentColor: "#2a3d5c",
    status: "live",
    added: "2026-05-10",
    tags: ["puzzle", "collaborative", "realtime"],
  },
  {
    slug: "eurorack",
    title: "Tiny Eurorack",
    description: "A simplistic modular synth with oscilloscope visualization.",
    image: "/images/projects/eurorack.webp",
    accentColor: "#8b5e3c",
    status: "live",
    added: "2026-03-26",
    tags: ["audio", "synth", "interactive"],
  },
  {
    slug: "mixtape-mixup",
    title: "Mixtape Mixup",
    description:
      "Name the song from a few seconds of tape. Ten songs a day, three guesses each, three lifelines.",
    image: "/images/projects/mixtape-mixup.webp",
    accentColor: "#e8a93a",
    status: "live",
    added: "2026-04-25",
    tags: ["music", "game", "daily"],
  },
  {
    slug: "howlongtowatch",
    title: "HowLongToWatch",
    description:
      "Search movies & TV shows, build a watchlist, see your total watch time.",
    image: "/images/projects/how-long-to-watch.webp",
    accentColor: "#6b3a2e",
    status: "live",
    added: "2026-03-21",
  },
  {
    slug: "historyofrock",
    title: "History of Rock",
    description:
      "An interactive diagram of rock music's evolution, inspired by School of Rock.",
    image: "/images/projects/history-of-rock.webp",
    accentColor: "#2d5a27",
    status: "live",
    added: "2026-03-22",
  },
  {
    slug: "osrs-pet-chance-guesser",
    title: "OSRS Pet Chance Guesser",
    description:
      "Simulate your RNG luck — click a boss and watch the kill count roll.",
    image: "/images/projects/osrs-pet-chance-guesser.png",
    accentColor: "#2b2118",
    status: "live",
    added: "2026-03-26",
    tags: ["osrs", "simulation", "rng"],
  },
  {
    slug: "who-are-you",
    title: "Who Are You?",
    description:
      "A mysterious dog detective asks 10 questions to figure out who you really are.",
    image: "/images/projects/who-are-you.webp",
    imagePosition: "70% top",
    accentColor: "#4a2d6e",
    status: "live",
    added: "2026-04-11",
    tags: ["game", "security", "humor"],
  },
  {
    slug: "haiku",
    title: "HAIKU",
    titleHtml: 'H<span style="color:#2d8e4a">AI</span>KU',
    description: "The world's most advanced AI haiku generator. Probably.",
    image: "/images/projects/haiku.webp",
    accentColor: "#8b2020",
    status: "live",
    added: "2026-04-12",
    tags: ["ai", "poetry", "humor"],
  },
  {
    slug: "dice-roller",
    title: "Tabletop Dice Roller",
    description:
      "Keyboard-first dice roller — type notation like 2d6 + 3, hit Enter, copy the result.",
    image: "/images/projects/dice-roller.webp",
    accentColor: "#b8860b",
    status: "live",
    added: "2026-04-12",
    tags: ["tabletop", "dice", "rpg"],
  },
  {
    slug: "human-maintenance-guide",
    title: "Human Maintenance Guide",
    description:
      "A reference compendium for how often to do the things that keep life running — health, home, car, finances, and personal care.",
    image: "/images/projects/human-maintenance-guide.webp",
    accentColor: "#2e6b6b",
    status: "live",
    added: "2026-04-19",
    tags: ["reference", "health", "lifestyle"],
  },
  {
    slug: "so-you-want-to-build-a-snowman",
    title: "So You Want to Build a Snowman",
    description:
      "Roll snowballs through real snowfall data, stack them up, and build a snowman.",
    image: "/images/projects/samthensnowman.webp",
    accentColor: "#5BA4CF",
    status: "live",
    added: "2026-05-04",
    tags: ["weather", "game", "interactive"],
  },
  {
    slug: "drum-machine",
    title: "Tiny Drum Machine",
    description:
      "A vertical, scalable drum sequencer inspired by the Linndrum.",
    image: "/images/projects/drum-machine.webp",
    accentColor: "#c97b2e",
    status: "live",
    added: "2026-05-16",
    tags: ["audio", "sequencer", "interactive"],
  },
  {
    slug: "still-here",
    title: "Still Here",
    description:
      "Enter your birth year and see how much of your cohort is still around — and how much pyramid you've got left.",
    image: "/images/projects/still-here.webp",
    accentColor: "#a85e2e",
    status: "live",
    added: "2026-05-23",
    tags: ["data-viz", "demographics"],
    imagePosition: "center 65%",
  },
  {
    slug: "from-akeelah-to-z",
    title: "From Akeelah to Z",
    description:
      "Actors who said at least one word starting with every letter A–Z in a single movie.",
    image: "/images/projects/from-akeelah-to-z.webp",
    accentColor: "#3f72a4",
    status: "live",
    added: "2026-06-27",
    tags: ["movies", "language", "data"],
  },
  {
    slug: "typing-terror",
    title: "Typing Terror",
    description:
      "A typing test that refuses to stay normal — three passages from one book, each stranger than the last.",
    image: "/images/projects/typing-terror.svg",
    accentColor: "#a01b1b",
    status: "live",
    added: "2026-06-27",
    tags: ["typing", "horror", "game"],
  },
  {
    slug: "behind-the-counter",
    title: "Behind the Counter Map",
    description:
      "Every Japanese shop from Paolo fromTOKYO's Behind the Counter series, mapped \u2014 pin to episode.",
    image: "/images/projects/behind-the-counter.webp",
    accentColor: "#b8352d",
    status: "live",
    added: "2026-08-22",
    tags: ["map", "japan", "food"],
  },
  {
    slug: "philosopher-tcg",
    title: "First Principles",
    description:
      "A philosopher trading-card game. Open a grimoire booster pack and build your collection.",
    image: "/images/projects/philosopher-tcg.svg",
    accentColor: "#7a2222",
    status: "live",
    added: "2026-08-29",
    tags: ["game", "cards", "collection"],
  },
  {
    slug: "history-of-the-world",
    title: "History of the World",
    description:
      "4.54 billion years on one parchment scroll. Unroll the folds to feel how much time passed between the big moments.",
    image: "/images/projects/history-of-the-world.webp",
    accentColor: "#a0692e",
    status: "live",
    added: "2026-09-30",
    tags: ["history", "timeline", "science"],
  },
  {
    slug: "song-tournament",
    title: "Song Tournament",
    description:
      "Everyone picks songs from their phone, then the group votes them through a bracket until one is crowned champion.",
    image: "/images/projects/song-tournament.webp",
    imagePosition: "60% center",
    accentColor: "#c026d3",
    status: "live",
    added: "2026-10-17",
    tags: ["music", "party", "multiplayer"],
    externalUrl: "https://song-tournament.netlify.app",
  },
  {
    slug: "morning-rounds",
    title: "Morning Rounds",
    description:
      "Your daily puzzle circuit in one place. Tap through Wordle, Worldle, Framed and friends, or open them all at once.",
    image: "/images/projects/morning-rounds.webp",
    accentColor: "#c0622b",
    status: "live",
    added: "2026-10-17",
    tags: ["games", "daily", "puzzle"],
  },
  {
    slug: "when-to-plant",
    title: "When To Plant",
    description:
      "A map of every US county showing which vegetables and herbs can go in the ground this week. Slide through the year to watch the seasons move.",
    image: "/images/projects/when-to-plant.webp",
    accentColor: "#2e7a1e",
    status: "live",
    added: "2026-10-18",
    tags: ["gardening", "map", "data"],
  },
];
