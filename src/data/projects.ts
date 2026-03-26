export interface Project {
  slug: string;
  title: string;
  description: string;
  image: string;
  accentColor: string;
  status: "live" | "wip" | "coming-soon";
  tags?: string[];
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
];
