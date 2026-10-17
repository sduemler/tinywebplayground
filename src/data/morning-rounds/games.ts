// The starter list of daily games for Morning Rounds. Each one opens in its own tab,
// so any site works here (embedding isn't needed). To swap a game, edit its url/name.

export interface Game {
  id: string;
  name: string;
  url: string;
  /** Short kind label shown on the card ("Word", "Geography"…); also picks the tile color. */
  tag: string;
  blurb: string;
  /** One or two letters shown on the card's tile. */
  monogram: string;
  /** Set on games the player added themselves. */
  custom?: boolean;
}

export const GAMES: Game[] = [
  {
    id: "wordle",
    name: "Wordle",
    url: "https://www.nytimes.com/games/wordle/index.html",
    tag: "Word",
    blurb: "Guess the five-letter word in six tries.",
    monogram: "W",
  },
  {
    id: "connections",
    name: "Connections",
    url: "https://www.nytimes.com/games/connections",
    tag: "Word",
    blurb: "Sort sixteen words into four hidden groups.",
    monogram: "Co",
  },
  {
    id: "strands",
    name: "Strands",
    url: "https://www.nytimes.com/games/strands",
    tag: "Word",
    blurb: "Find the themed words snaking through a letter grid.",
    monogram: "St",
  },
  {
    id: "the-mini",
    name: "The Mini",
    url: "https://www.nytimes.com/crosswords/game/mini",
    tag: "Crossword",
    blurb: "A five-by-five crossword you can finish with your coffee.",
    monogram: "Mi",
  },
  {
    id: "quordle",
    name: "Quordle",
    url: "https://www.merriam-webster.com/games/quordle/",
    tag: "Word",
    blurb: "Four Wordles at once, nine guesses to crack them all.",
    monogram: "Q",
  },
  {
    id: "waffle",
    name: "Waffle",
    url: "https://wafflegame.net/daily",
    tag: "Word",
    blurb: "Swap letters around a waffle-shaped grid to fix six words.",
    monogram: "Wa",
  },
  {
    id: "squaredle",
    name: "Squaredle",
    url: "https://squaredle.app/",
    tag: "Word",
    blurb: "Chain neighbouring letters to find every word in the square.",
    monogram: "Sq",
  },
  {
    id: "contexto",
    name: "Contexto",
    url: "https://contexto.me/",
    tag: "Word",
    blurb: "Hunt the secret word by how close in meaning your guesses are.",
    monogram: "Cx",
  },
  {
    id: "worldle",
    name: "Worldle",
    url: "https://worldle.teuteuf.fr/",
    tag: "Geography",
    blurb: "Name the country from its silhouette.",
    monogram: "Wo",
  },
  {
    id: "globle",
    name: "Globle",
    url: "https://globle-game.com/",
    tag: "Geography",
    blurb: "Find the mystery country on a globe that runs hot and cold.",
    monogram: "G",
  },
  {
    id: "travle",
    name: "Travle",
    url: "https://travle.earth/",
    tag: "Geography",
    blurb: "Plot the shortest overland route between two countries.",
    monogram: "Tr",
  },
  {
    id: "framed",
    name: "Framed",
    url: "https://framed.wtf/",
    tag: "Movies",
    blurb: "Guess the movie one still frame at a time.",
    monogram: "F",
  },
  {
    id: "bandle",
    name: "Bandle",
    url: "https://www.bandle.app/",
    tag: "Music",
    blurb: "Name the song as the band adds instruments.",
    monogram: "B",
  },
  {
    id: "costcodle",
    name: "Costcodle",
    url: "https://costcodle.com/",
    tag: "Prices",
    blurb: "Guess the price of a Costco item, higher or lower.",
    monogram: "$",
  },
  {
    id: "nerdle",
    name: "Nerdle",
    url: "https://nerdlegame.com/",
    tag: "Math",
    blurb: "Wordle, but the answer is an equation.",
    monogram: "=",
  },
  {
    id: "immaculate-grid",
    name: "Immaculate Grid",
    url: "https://www.immaculategrid.com/",
    tag: "Sports",
    blurb: "Fill a baseball grid with players who match both clues.",
    monogram: "IG",
  },
];

/** Tile colors by tag, all from the site's warm palette. Unknown tags (custom games) use the fallback. */
export const TAG_COLORS: Record<string, string> = {
  Word: "#b5562f",
  Crossword: "#9a4a2a",
  Geography: "#6f7a3a",
  Movies: "#7a4a5a",
  Music: "#8a5470",
  Prices: "#b8892b",
  Math: "#a0782a",
  Sports: "#5e6b4a",
};

export const FALLBACK_COLOR = "#6b3a2e";
