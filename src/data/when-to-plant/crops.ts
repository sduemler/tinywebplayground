// Planting rules for When To Plant.
//
// Each crop's windows are written in weeks before (negative) or after (positive) the
// average last spring frost (`lsf`) or first fall frost (`fff`), the way extension
// planting charts give them. `hi` is the range of average daily high (°F) a planting
// date must fall in: it slides windows later where spring is cold, trims them where
// summer is hot, and together with `minLow` is the main rule in frost-free and
// near-frost-free counties (see engine.ts).
//
// Timings are summarized from university extension planting charts (Cornell CCE,
// University of Minnesota Extension, Texas A&M AgriLife, UF/IFAS, Oregon State),
// written in our own words and rounded to whole weeks. Indoor sowing windows only show
// in the county panel; they never color the map.

export type GroupId =
  | "greens"
  | "brassicas"
  | "roots"
  | "alliums"
  | "legumes"
  | "nightshades"
  | "cucurbits"
  | "herbs";

export type Method = "indoors" | "direct" | "transplant";

export interface PlantWindow {
  method: Method;
  anchor: "lsf" | "fff";
  /** Weeks relative to the anchor; negative = before. */
  from: number;
  to: number;
  /** Only counties with at least this many frost-free days get this window (late fall plantings of warm crops). */
  minSeason?: number;
}

export interface Crop {
  id: string;
  name: string;
  group: GroupId;
  /** Killed by frost: never planted outside between first and last frost. */
  tender: boolean;
  windows: PlantWindow[];
  /** Average daily high (°F) allowed on the planting date. */
  hi: [min: number, max: number];
  /** Tender crops: days from planting outside to first harvest; the harvest has to beat the fall frost. */
  days?: number;
  /** Tender crops: average nightly low (°F) they need. Only checked in mild counties, where frost dates don't gate them. */
  minLow?: number;
  note?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  short: string;
}

// Order is also the tie-break when two groups are equally ready in a county.
export const GROUPS: Group[] = [
  { id: "greens", name: "Leafy greens", short: "Greens" },
  { id: "brassicas", name: "Brassicas", short: "Brassicas" },
  { id: "roots", name: "Roots & tubers", short: "Roots" },
  { id: "alliums", name: "Alliums", short: "Alliums" },
  { id: "legumes", name: "Peas & beans", short: "Peas & beans" },
  { id: "nightshades", name: "Tomatoes & kin", short: "Tomatoes" },
  { id: "cucurbits", name: "Squash, melons & corn", short: "Squash & corn" },
  { id: "herbs", name: "Herbs", short: "Herbs" },
];

const w = (
  method: Method,
  anchor: "lsf" | "fff",
  from: number,
  to: number,
  minSeason?: number,
): PlantWindow => ({ method, anchor, from, to, ...(minSeason ? { minSeason } : {}) });

export const CROPS: Crop[] = [
  // Leafy greens
  {
    id: "lettuce", name: "Lettuce", group: "greens", tender: false, hi: [40, 82],
    windows: [w("indoors", "lsf", -10, -6), w("direct", "lsf", -4, 3), w("direct", "fff", -10, -3)],
    note: "Sow a short row every two weeks for a steady supply.",
  },
  {
    id: "spinach", name: "Spinach", group: "greens", tender: false, hi: [38, 78],
    windows: [w("direct", "lsf", -6, -2), w("direct", "fff", -8, -4)],
    note: "Bolts fast once days get long and hot.",
  },
  {
    id: "arugula", name: "Arugula", group: "greens", tender: false, hi: [40, 80],
    windows: [w("direct", "lsf", -5, 2), w("direct", "fff", -8, -2)],
  },
  {
    id: "chard", name: "Swiss chard", group: "greens", tender: false, hi: [45, 88],
    windows: [w("direct", "lsf", -2, 6), w("direct", "fff", -12, -8)],
    note: "Handles summer heat better than most greens.",
  },
  {
    id: "asian-greens", name: "Bok choy & Asian greens", group: "greens", tender: false, hi: [40, 80],
    windows: [w("direct", "lsf", -4, 0), w("direct", "fff", -10, -4)],
  },

  // Brassicas
  {
    id: "broccoli", name: "Broccoli", group: "brassicas", tender: false, hi: [40, 88],
    windows: [w("indoors", "lsf", -10, -7), w("transplant", "lsf", -4, -1), w("transplant", "fff", -14, -10)],
    note: "Fall plantings often make the best heads.",
  },
  {
    id: "cabbage", name: "Cabbage", group: "brassicas", tender: false, hi: [40, 88],
    windows: [w("indoors", "lsf", -10, -7), w("transplant", "lsf", -5, -1), w("transplant", "fff", -14, -10)],
  },
  {
    id: "cauliflower", name: "Cauliflower", group: "brassicas", tender: false, hi: [45, 85],
    windows: [w("indoors", "lsf", -9, -6), w("transplant", "lsf", -3, 0), w("transplant", "fff", -14, -11)],
    note: "The fussiest brassica: steady moisture, no heat stress.",
  },
  {
    id: "kale", name: "Kale", group: "brassicas", tender: false, hi: [38, 88],
    windows: [w("indoors", "lsf", -10, -6), w("direct", "lsf", -5, -1), w("direct", "fff", -12, -6)],
    note: "Light frost makes the leaves sweeter.",
  },
  {
    id: "collards", name: "Collards", group: "brassicas", tender: false, hi: [40, 92],
    windows: [w("direct", "lsf", -4, 2), w("direct", "fff", -14, -8)],
  },
  {
    id: "brussels-sprouts", name: "Brussels sprouts", group: "brassicas", tender: false, hi: [40, 88],
    windows: [w("indoors", "lsf", -10, -7), w("transplant", "lsf", -4, -1), w("transplant", "fff", -18, -14)],
    note: "A long crop; best harvested after a few frosts.",
  },
  {
    id: "kohlrabi", name: "Kohlrabi", group: "brassicas", tender: false, hi: [40, 85],
    windows: [w("direct", "lsf", -5, -1), w("direct", "fff", -10, -6)],
  },

  // Roots & tubers
  {
    id: "carrots", name: "Carrots", group: "roots", tender: false, hi: [45, 85],
    windows: [w("direct", "lsf", -3, 4), w("direct", "fff", -12, -8)],
    note: "Keep the seedbed damp until they sprout (up to 3 weeks).",
  },
  {
    id: "beets", name: "Beets", group: "roots", tender: false, hi: [45, 85],
    windows: [w("direct", "lsf", -3, 3), w("direct", "fff", -10, -6)],
  },
  {
    id: "radishes", name: "Radishes", group: "roots", tender: false, hi: [40, 80],
    windows: [w("direct", "lsf", -5, 1), w("direct", "fff", -6, -2)],
    note: "Ready in about a month.",
  },
  {
    id: "turnips", name: "Turnips", group: "roots", tender: false, hi: [40, 85],
    windows: [w("direct", "lsf", -4, 0), w("direct", "fff", -10, -6)],
  },
  {
    id: "parsnips", name: "Parsnips", group: "roots", tender: false, hi: [45, 80],
    windows: [w("direct", "lsf", -3, 2)],
    note: "Leave them in through frost for the sweetest roots.",
  },
  {
    id: "potatoes", name: "Potatoes", group: "roots", tender: false, hi: [45, 80],
    windows: [w("direct", "lsf", -3, 1)],
    note: "Plant seed potatoes; tops can take a light frost.",
  },
  {
    id: "sweet-potatoes", name: "Sweet potatoes", group: "roots", tender: true, hi: [75, 95], days: 100, minLow: 60,
    windows: [w("transplant", "lsf", 3, 8)],
    note: "Plant slips once the soil is truly warm.",
  },

  // Alliums
  {
    id: "onions", name: "Onions", group: "alliums", tender: false, hi: [40, 75],
    windows: [w("indoors", "lsf", -12, -8), w("transplant", "lsf", -6, -2)],
    note: "Pick a day-length type for your latitude: short-day in the South, long-day in the North.",
  },
  {
    id: "leeks", name: "Leeks", group: "alliums", tender: false, hi: [45, 80],
    windows: [w("indoors", "lsf", -12, -8), w("transplant", "lsf", -2, 2)],
  },
  {
    id: "garlic", name: "Garlic", group: "alliums", tender: false, hi: [40, 75],
    windows: [w("direct", "fff", -2, 5)],
    note: "Plant cloves pointy end up; harvest next summer.",
  },
  {
    id: "shallots", name: "Shallots", group: "alliums", tender: false, hi: [40, 75],
    windows: [w("direct", "lsf", -4, -1), w("direct", "fff", -2, 5)],
  },
  {
    id: "scallions", name: "Scallions", group: "alliums", tender: false, hi: [40, 85],
    windows: [w("direct", "lsf", -4, 4), w("direct", "fff", -10, -6)],
  },

  // Peas & beans
  {
    id: "peas", name: "Peas", group: "legumes", tender: false, hi: [40, 75],
    windows: [w("direct", "lsf", -6, -2), w("direct", "fff", -10, -8)],
    note: "Give them a trellis or fence to climb.",
  },
  {
    id: "fava-beans", name: "Fava beans", group: "legumes", tender: false, hi: [40, 70],
    windows: [w("direct", "lsf", -6, -3)],
  },
  {
    id: "bush-beans", name: "Bush beans", group: "legumes", tender: true, hi: [65, 92], days: 55, minLow: 50,
    windows: [w("direct", "lsf", 1, 10), w("direct", "fff", -12, -9, 150)],
    note: "Sow again every few weeks into midsummer.",
  },
  {
    id: "pole-beans", name: "Pole beans", group: "legumes", tender: true, hi: [65, 92], days: 65, minLow: 50,
    windows: [w("direct", "lsf", 1, 6)],
  },
  {
    id: "edamame", name: "Edamame", group: "legumes", tender: true, hi: [68, 92], days: 85, minLow: 55,
    windows: [w("direct", "lsf", 2, 6)],
  },

  // Tomatoes & kin
  {
    id: "tomatoes", name: "Tomatoes", group: "nightshades", tender: true, hi: [65, 92], days: 70, minLow: 50,
    windows: [w("indoors", "lsf", -8, -6), w("transplant", "lsf", 0, 5), w("transplant", "fff", -16, -13, 220)],
    note: "Set them deep: roots grow along the buried stem.",
  },
  {
    id: "peppers", name: "Peppers", group: "nightshades", tender: true, hi: [68, 92], days: 70, minLow: 55,
    windows: [w("indoors", "lsf", -10, -8), w("transplant", "lsf", 0, 5), w("transplant", "fff", -16, -14, 220)],
  },
  {
    id: "eggplant", name: "Eggplant", group: "nightshades", tender: true, hi: [70, 92], days: 75, minLow: 55,
    windows: [w("indoors", "lsf", -10, -8), w("transplant", "lsf", 1, 5)],
    note: "Wants the warmest spot in the garden.",
  },
  {
    id: "tomatillos", name: "Tomatillos", group: "nightshades", tender: true, hi: [65, 90], days: 75, minLow: 50,
    windows: [w("indoors", "lsf", -8, -6), w("transplant", "lsf", 0, 4)],
    note: "Plant at least two; they need a partner to set fruit.",
  },

  // Squash, melons & corn
  {
    id: "cucumbers", name: "Cucumbers", group: "cucurbits", tender: true, hi: [65, 92], days: 55, minLow: 55,
    windows: [w("direct", "lsf", 1, 8), w("direct", "fff", -12, -10, 200)],
  },
  {
    id: "zucchini", name: "Zucchini & summer squash", group: "cucurbits", tender: true, hi: [65, 92], days: 50, minLow: 55,
    windows: [w("direct", "lsf", 1, 8), w("direct", "fff", -12, -10, 200)],
  },
  {
    id: "winter-squash", name: "Winter squash", group: "cucurbits", tender: true, hi: [65, 92], days: 95, minLow: 55,
    windows: [w("direct", "lsf", 1, 4)],
  },
  {
    id: "pumpkins", name: "Pumpkins", group: "cucurbits", tender: true, hi: [68, 92], days: 105, minLow: 55,
    windows: [w("direct", "lsf", 2, 6)],
    note: "Count back about 110 days from when you want them.",
  },
  {
    id: "watermelon", name: "Watermelon", group: "cucurbits", tender: true, hi: [70, 95], days: 85, minLow: 60,
    windows: [w("direct", "lsf", 2, 5)],
  },
  {
    id: "cantaloupe", name: "Cantaloupe", group: "cucurbits", tender: true, hi: [70, 95], days: 80, minLow: 60,
    windows: [w("direct", "lsf", 2, 5)],
  },
  {
    id: "sweet-corn", name: "Sweet corn", group: "cucurbits", tender: true, hi: [62, 95], days: 75, minLow: 50,
    windows: [w("direct", "lsf", 0, 8)],
    note: "Plant in blocks, not one long row, so it pollinates.",
  },
  {
    id: "okra", name: "Okra", group: "cucurbits", tender: true, hi: [75, 98], days: 60, minLow: 60,
    windows: [w("direct", "lsf", 3, 10)],
    note: "Loves heat; sulks in cool soil.",
  },

  // Herbs
  {
    id: "basil", name: "Basil", group: "herbs", tender: true, hi: [68, 92], days: 30, minLow: 50,
    windows: [w("indoors", "lsf", -6, -4), w("transplant", "lsf", 0, 6)],
    note: "Pinch the tips to keep it bushy.",
  },
  {
    id: "cilantro", name: "Cilantro", group: "herbs", tender: false, hi: [45, 80],
    windows: [w("direct", "lsf", -3, 2), w("direct", "fff", -8, -4)],
    note: "Goes to seed in heat; fall sowings last longer.",
  },
  {
    id: "dill", name: "Dill", group: "herbs", tender: false, hi: [50, 85],
    windows: [w("direct", "lsf", -2, 4)],
  },
  {
    id: "parsley", name: "Parsley", group: "herbs", tender: false, hi: [45, 85],
    windows: [w("indoors", "lsf", -10, -8), w("transplant", "lsf", -2, 3)],
  },
  {
    id: "chives", name: "Chives", group: "herbs", tender: false, hi: [45, 80],
    windows: [w("direct", "lsf", -4, 2)],
    note: "Perennial: plant once, snip for years.",
  },
  {
    id: "thyme", name: "Thyme", group: "herbs", tender: false, hi: [55, 85],
    windows: [w("transplant", "lsf", 0, 4)],
  },
  {
    id: "oregano", name: "Oregano", group: "herbs", tender: false, hi: [55, 85],
    windows: [w("transplant", "lsf", 0, 4)],
  },
];
