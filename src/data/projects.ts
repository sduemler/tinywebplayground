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
    title: "HowLongToWatch.com",
    description:
      "Search movies & TV shows, build a watchlist, see your total watch time.",
    image: "/images/projects/how-long-to-watch.webp",
    accentColor: "#6b3a2e",
    status: "live",
  },
];
