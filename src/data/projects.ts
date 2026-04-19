export interface Project {
  slug: string;
  title: string;
  description: string;
  image: string;
  accentColor: string;
  status: "live" | "wip" | "coming-soon";
  tags?: string[];
  imagePosition?: string;
  titleHtml?: string;
}

export const projects: Project[] = [
  {
    slug: "howlongtowatch",
    title: "HowLongToWatch",
    description:
      "Search movies & TV shows, build a watchlist, see your total watch time.",
    image: "/images/projects/how-long-to-watch.webp",
    accentColor: "#6b3a2e",
    status: "live",
  },
  {
    slug: "historyofrock",
    title: "History of Rock",
    description:
      "An interactive diagram of rock music's evolution, inspired by School of Rock.",
    image: "/images/projects/history-of-rock.webp",
    accentColor: "#2d5a27",
    status: "live",
  },
  {
    slug: "osrs-pet-chance-guesser",
    title: "OSRS Pet Chance Guesser",
    description:
      "Simulate your RNG luck — click a boss and watch the kill count roll.",
    image: "/images/projects/osrs-pet-chance-guesser.png",
    accentColor: "#2b2118",
    status: "live",
    tags: ["osrs", "simulation", "rng"],
  },
  {
    slug: "eurorack",
    title: "Tiny Eurorack",
    description:
      "A simplistic modular synth with oscilloscope visualization.",
    image: "/images/projects/eurorack.webp",
    accentColor: "#8b5e3c",
    status: "wip",
    tags: ["audio", "synth", "interactive"],
  },
  {
    slug: "who-are-you",
    title: "Who Are You?",
    description:
      "A mysterious dog detective asks 10 questions to figure out who you really are.",
    image: "/images/projects/who-are-you.jpg",
    imagePosition: "70% top",
    accentColor: "#4a2d6e",
    status: "live",
    tags: ["game", "security", "humor"],
  },
  {
    slug: "haiku",
    title: "HAIKU",
    titleHtml: 'H<span style="color:#2d8e4a">AI</span>KU',
    description:
      "The world's most advanced AI haiku generator. Probably.",
    image: "/images/projects/haiku.jpg",
    accentColor: "#8b2020",
    status: "live",
    tags: ["ai", "poetry", "humor"],
  },
  {
    slug: "dice-roller",
    title: "Tabletop Dice Roller",
    description:
      "Keyboard-first dice roller — type notation like 2d6 + 3, hit Enter, copy the result.",
    image: "/images/projects/dice-roller.jpg",
    accentColor: "#b8860b",
    status: "live",
    tags: ["tabletop", "dice", "rpg"],
  },
  {
    slug: "human-maintenance-guide",
    title: "Human Maintenance Guide",
    description:
      "A reference compendium for how often to do the things that keep life running — health, home, car, finances, and personal care.",
    image: "/images/projects/human-maintenance-guide.jpg",
    accentColor: "#2e6b6b",
    status: "live",
    tags: ["reference", "health", "lifestyle"],
  },
];
