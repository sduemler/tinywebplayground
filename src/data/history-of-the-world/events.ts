// The events on the History of the World scroll, oldest first.
//
// Dates: deep-time entries give `ago` (years before the present); everything
// from the end of the last ice age onward gives `year` (negative = BCE, no
// year zero is modelled — spans across 1 BCE/1 CE are off by one year, which
// is well below the "≈" precision the UI shows). `approx` prefixes "c." and
// marks spans touching the event as approximate.

export type CategoryId =
  | "cosmic"
  | "life"
  | "disaster"
  | "war"
  | "invention"
  | "migration"
  | "empire"
  | "culture";

export interface Category {
  id: CategoryId;
  label: string;
  /** Ink color of the event's underline and spine dot. */
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "cosmic", label: "Cosmic & Geological", color: "#4b4453" },
  { id: "life", label: "Life & Evolution", color: "#3d7a45" },
  { id: "disaster", label: "Disasters & Plagues", color: "#c4561a" },
  { id: "war", label: "Wars & Conflict", color: "#8e1b1b" },
  { id: "invention", label: "Inventions & Science", color: "#2d5a7b" },
  { id: "migration", label: "Migrations & Exploration", color: "#b08209" },
  { id: "empire", label: "Empires & Politics", color: "#6d2a6b" },
  { id: "culture", label: "Culture & Religion", color: "#b5476f" },
];

interface RawEvent {
  title: string;
  category: CategoryId;
  blurb: string;
  ago?: number;
  year?: number;
  approx?: boolean;
}

export interface HistoryEvent {
  id: string;
  title: string;
  category: CategoryId;
  blurb: string;
  /** Astronomical-ish year: negative = BCE / years before 1 CE. */
  year: number;
  /** True for deep-time entries, which are labelled "… years ago". */
  deep: boolean;
  approx: boolean;
}

/** The present — the bottom of the scroll. */
export const NOW_YEAR = 2026;

const RAW: RawEvent[] = [
  // ── Deep time ────────────────────────────────────────────────────────────
  {
    ago: 4.54e9, approx: true, category: "cosmic", title: "The Earth Takes Shape",
    blurb: "Dust and rock circling the young Sun clump together into a molten planet, third from its star. The clock starts here.",
  },
  {
    ago: 4.51e9, approx: true, category: "cosmic", title: "The Moon Is Born",
    blurb: "A Mars-sized body called Theia slams into the infant Earth. The debris flung into orbit gathers into the Moon.",
  },
  {
    ago: 4.4e9, approx: true, category: "cosmic", title: "The First Oceans",
    blurb: "Tiny zircon crystals from Western Australia show that liquid water was already pooling on the cooling surface.",
  },
  {
    ago: 3.5e9, approx: true, category: "life", title: "The First Signs of Life",
    blurb: "Microbial mats build layered mounds called stromatolites, whose fossils survive in some of the oldest rocks on Earth.",
  },
  {
    ago: 2.4e9, approx: true, category: "life", title: "The Great Oxidation",
    blurb: "Photosynthesizing cyanobacteria flood the air with oxygen, poisoning much of early life but making ours possible.",
  },
  {
    ago: 1.8e9, approx: true, category: "life", title: "Complex Cells",
    blurb: "Cells with a nucleus appear, probably after one microbe swallowed another and kept it as a power plant: the mitochondrion.",
  },
  {
    ago: 7.2e8, approx: true, category: "cosmic", title: "Snowball Earth",
    blurb: "Ice creeps nearly to the equator in one of the most severe glaciations the planet has ever known.",
  },
  {
    ago: 5.75e8, approx: true, category: "life", title: "The Ediacaran Creatures",
    blurb: "Soft, quilted organisms, some a metre long, spread across the sea floor. They are among the first large, complex living things.",
  },
  {
    ago: 5.39e8, approx: true, category: "life", title: "The Cambrian Explosion",
    blurb: "In a geological blink, most major animal body plans appear: eyes, shells, jointed legs, and the first true predators.",
  },
  {
    ago: 4.7e8, approx: true, category: "life", title: "Plants Come Ashore",
    blurb: "Moss-like plants creep onto the bare continents, beginning to build soil and change the air.",
  },
  {
    ago: 3.75e8, approx: true, category: "life", title: "A Fish Takes a Step",
    blurb: "Tiktaalik, part fish and part four-legged animal, props itself up in the shallows. It is a close cousin of the first land vertebrates.",
  },
  {
    ago: 3.35e8, approx: true, category: "cosmic", title: "Pangaea",
    blurb: "The continents grind together into a single supercontinent, ringed by one world ocean.",
  },
  {
    ago: 2.52e8, approx: true, category: "disaster", title: "The Great Dying",
    blurb: "Vast Siberian eruptions trigger the worst mass extinction ever. Roughly nine in ten marine species vanish.",
  },
  {
    ago: 2.31e8, approx: true, category: "life", title: "The First Dinosaurs",
    blurb: "Small, two-legged hunters appear in what is now Argentina. Their descendants will rule the land for 165 million years.",
  },
  {
    ago: 2.25e8, approx: true, category: "life", title: "The First Mammals",
    blurb: "Small, furry, and probably nocturnal, the earliest mammal-like creatures scurry about at the dinosaurs' feet.",
  },
  {
    ago: 2.0e8, approx: true, category: "cosmic", title: "Pangaea Breaks Apart",
    blurb: "The supercontinent begins to rift. A young Atlantic Ocean opens between Africa and the Americas.",
  },
  {
    ago: 1.5e8, approx: true, category: "life", title: "Feathers Take Flight",
    blurb: "Archaeopteryx, a feathered dinosaur with teeth, claws and wings, flaps through the Jurassic. Birds are dinosaurs.",
  },
  {
    ago: 1.3e8, approx: true, category: "life", title: "The First Flowers",
    blurb: "Flowering plants appear, then spread across the globe alongside the insects that pollinate them.",
  },
  {
    ago: 6.6e7, category: "disaster", title: "The Asteroid",
    blurb: "A rock about 10 km wide strikes Mexico's Yucatán. The non-bird dinosaurs, and about three-quarters of all species, are wiped out.",
  },
  {
    ago: 7e6, approx: true, category: "life", title: "A Split in the Family",
    blurb: "Our ancestors part ways with those of chimpanzees. Sahelanthropus, found in Chad, is one of the earliest known members of the human line.",
  },
  {
    ago: 3.3e6, approx: true, category: "invention", title: "The First Stone Tools",
    blurb: "Near Kenya's Lake Turkana, early hominins strike sharp flakes off stones. The tools are older than our own genus.",
  },
  {
    ago: 2.58e6, category: "cosmic", title: "The Ice Ages Begin",
    blurb: "Earth enters an era of repeating ice ages. Glaciers will advance and retreat dozens of times.",
  },
  {
    ago: 1.8e6, approx: true, category: "migration", title: "Out of Africa, the First Time",
    blurb: "Homo erectus spreads beyond Africa, reaching the Caucasus and eventually China and Java.",
  },
  {
    ago: 1e6, approx: true, category: "invention", title: "Mastering Fire",
    blurb: "Ash and burnt bone deep in South Africa's Wonderwerk Cave hint at the earliest controlled use of fire.",
  },
  {
    ago: 3e5, approx: true, category: "life", title: "Homo sapiens",
    blurb: "Our own species appears in Africa. The oldest known fossils, from Jebel Irhoud in Morocco, are about 300,000 years old.",
  },
  {
    ago: 7.4e4, approx: true, category: "disaster", title: "The Toba Supereruption",
    blurb: "A volcano on Sumatra erupts thousands of times more violently than Mount St. Helens, blanketing South Asia in ash.",
  },
  {
    ago: 6.5e4, approx: true, category: "migration", title: "Out of Africa, Again",
    blurb: "Small bands of modern humans leave Africa. Over tens of thousands of years their descendants reach every continent but Antarctica.",
  },
  {
    ago: 5.12e4, approx: true, category: "culture", title: "The Oldest Story",
    blurb: "On a cave wall in Sulawesi, Indonesia, someone paints three human-like figures around a wild pig. It is the oldest known narrative art.",
  },
  {
    ago: 5e4, approx: true, category: "migration", title: "Reaching Australia",
    blurb: "Crossing open sea, people arrive in Sahul, the joined landmass of Australia and New Guinea. They begin the world's oldest continuous cultures.",
  },
  {
    ago: 4e4, approx: true, category: "life", title: "The Last Neanderthals",
    blurb: "Neanderthals disappear, but not entirely: most people alive today carry a little of their DNA.",
  },
  {
    ago: 2e4, approx: true, category: "cosmic", title: "The Last Glacial Maximum",
    blurb: "Ice sheets kilometres thick bury much of North America and northern Europe. Sea level sits about 120 m lower than today.",
  },
  {
    ago: 1.6e4, approx: true, category: "migration", title: "Into the Americas",
    blurb: "People cross from Siberia over the land bridge of Beringia and travel south along the Pacific coast. They may have arrived even earlier.",
  },

  // ── The Holocene: farming, cities, writing ───────────────────────────────
  {
    year: -9500, approx: true, category: "culture", title: "Göbekli Tepe",
    blurb: "Hunter-gatherers in what is now Turkey raise huge carved stone pillars in rings. It is a monumental site older than farming there.",
  },
  {
    year: -9000, approx: true, category: "invention", title: "The First Farmers",
    blurb: "In the Fertile Crescent, people begin sowing wheat and barley and herding goats. Farming will be invented independently several more times around the world.",
  },
  {
    year: -3500, approx: true, category: "invention", title: "The Wheel",
    blurb: "Potters' wheels and then wheeled carts appear in Mesopotamia and on the steppes north of the Black Sea.",
  },
  {
    year: -3200, approx: true, category: "invention", title: "Writing",
    blurb: "Sumerian scribes in Uruk press wedge-shaped marks into clay. History, in the written sense, begins.",
  },
  {
    year: -3100, approx: true, category: "empire", title: "Egypt Unites",
    blurb: "King Narmer, by tradition, joins Upper and Lower Egypt, beginning three thousand years of pharaohs.",
  },
  {
    year: -2600, approx: true, category: "empire", title: "Cities of the Indus",
    blurb: "Harappa and Mohenjo-daro rise in what is now Pakistan, with grid streets, covered drains and standard-sized bricks.",
  },
  {
    year: -2560, approx: true, category: "culture", title: "The Great Pyramid",
    blurb: "It is built at Giza for the pharaoh Khufu, and will stand as the tallest human-made structure for nearly four thousand years.",
  },
  {
    year: -2334, approx: true, category: "empire", title: "The First Empire",
    blurb: "Sargon of Akkad conquers the city-states of Sumer, forging what is often called the world's first empire.",
  },
  {
    year: -1754, approx: true, category: "empire", title: "The Code of Hammurabi",
    blurb: "A Babylonian king carves 282 laws into stone, 'an eye for an eye' among them. It is one of the earliest written legal codes.",
  },
  {
    year: -1600, approx: true, category: "disaster", title: "Thera Erupts",
    blurb: "A colossal eruption on Santorini buries the town of Akrotiri and shakes the Minoan world of the Aegean.",
  },
  {
    year: -1600, approx: true, category: "empire", title: "The Shang Dynasty",
    blurb: "China's first archaeologically confirmed dynasty rises on the Yellow River. Its oracle bones carry the earliest Chinese writing.",
  },
  {
    year: -1300, approx: true, category: "migration", title: "Voyagers of the Pacific",
    blurb: "Lapita seafarers, whose Austronesian ancestors came from Taiwan, sail east into the open Pacific. They settle islands as far as Tonga and Samoa.",
  },
  {
    year: -1200, approx: true, category: "empire", title: "The Olmec",
    blurb: "In the lowlands of Mexico's Gulf Coast, the Olmec carve colossal stone heads and lay the foundations of Mesoamerican civilization.",
  },
  {
    year: -1177, approx: true, category: "disaster", title: "The Bronze Age Collapse",
    blurb: "Within a few decades, the palace civilizations of the eastern Mediterranean fall to drought, earthquakes, raiders and broken trade.",
  },
  {
    year: -1000, approx: true, category: "migration", title: "The Bantu Expansion",
    blurb: "Bantu-speaking farmers spread out from West-Central Africa, eventually carrying their languages and iron-working across half a continent.",
  },
  {
    year: -776, category: "culture", title: "The First Olympic Games",
    blurb: "Athletes gather at Olympia to honor Zeus. For centuries, Greeks will count the years by these games.",
  },
  {
    year: -508, category: "empire", title: "Democracy in Athens",
    blurb: "Cleisthenes' reforms give the citizens of Athens a vote on their own laws.",
  },
  {
    year: -500, approx: true, category: "culture", title: "The Axial Age",
    blurb: "Within a few generations, the Buddha in India, Confucius in China and the first Greek philosophers ask new questions about how to live.",
  },
  {
    year: -334, category: "war", title: "Alexander Marches East",
    blurb: "Alexander of Macedon invades Persia. In eleven years he builds an empire stretching from Greece to India.",
  },
  {
    year: -322, approx: true, category: "empire", title: "The Maurya Empire",
    blurb: "Chandragupta Maurya unites most of the Indian subcontinent. His grandson Ashoka will send Buddhism across Asia.",
  },
  {
    year: -221, category: "empire", title: "China Unified",
    blurb: "Qin Shi Huang becomes the first emperor of a united China, standardizing its script, coins, weights and roads.",
  },
  {
    year: -130, approx: true, category: "migration", title: "The Silk Road",
    blurb: "The journeys of the Han envoy Zhang Qian open routes that will carry silk, spices, faiths and plagues between China and Rome.",
  },
  {
    year: -27, category: "empire", title: "Rome Becomes an Empire",
    blurb: "Octavian takes the name Augustus. The Roman Republic becomes an empire that will ring the Mediterranean.",
  },

  // ── The Common Era ───────────────────────────────────────────────────────
  {
    year: 30, approx: true, category: "culture", title: "The Crucifixion of Jesus",
    blurb: "Jesus of Nazareth is executed in Roman Judea. His followers will spread a faith that becomes the world's largest religion.",
  },
  {
    year: 79, category: "disaster", title: "Vesuvius Buries Pompeii",
    blurb: "Ash and scalding gas entomb Pompeii and Herculaneum, freezing a moment of Roman daily life for 1,700 years.",
  },
  {
    year: 105, category: "invention", title: "Paper",
    blurb: "The Chinese court official Cai Lun is credited with perfecting paper made from bark, hemp and rags.",
  },
  {
    year: 250, approx: true, category: "empire", title: "The Classic Maya",
    blurb: "Maya city-states such as Tikal flourish, with monumental temples, a full writing system and a calendar of startling precision.",
  },
  {
    year: 476, category: "empire", title: "The Fall of Rome",
    blurb: "The last western emperor is deposed. The eastern half carries on as the Byzantine Empire for another thousand years.",
  },
  {
    year: 541, category: "disaster", title: "The Plague of Justinian",
    blurb: "The first recorded pandemic of bubonic plague sweeps the Mediterranean world, killing millions.",
  },
  {
    year: 622, category: "culture", title: "The Rise of Islam",
    blurb: "Muhammad and his followers leave Mecca for Medina. The Hijra marks year one of the Islamic calendar.",
  },
  {
    year: 628, category: "invention", title: "Zero",
    blurb: "The Indian mathematician Brahmagupta sets down rules for calculating with zero, treating it as a number in its own right.",
  },
  {
    year: 800, category: "empire", title: "Charlemagne Crowned",
    blurb: "On Christmas Day the pope crowns the Frankish king emperor, uniting much of Western Europe under one ruler.",
  },
  {
    year: 850, approx: true, category: "invention", title: "Gunpowder",
    blurb: "Chinese alchemists searching for an elixir of life instead find a mixture of saltpetre, sulfur and charcoal that burns explosively.",
  },
  {
    year: 1000, approx: true, category: "migration", title: "Vikings in America",
    blurb: "Leif Erikson's Norse crew lands in Newfoundland, nearly five hundred years before Columbus.",
  },
  {
    year: 1066, category: "war", title: "The Norman Conquest",
    blurb: "William of Normandy wins at Hastings and remakes England's language, law and ruling class.",
  },
  {
    year: 1096, category: "war", title: "The First Crusade",
    blurb: "European armies march on Jerusalem, beginning two centuries of holy war in the eastern Mediterranean.",
  },
  {
    year: 1206, category: "empire", title: "Genghis Khan",
    blurb: "Temüjin is proclaimed Genghis Khan. His Mongols will build the largest contiguous land empire in history.",
  },
  {
    year: 1215, category: "empire", title: "Magna Carta",
    blurb: "England's barons force King John to accept that even a king is bound by the law.",
  },
  {
    year: 1250, approx: true, category: "migration", title: "Polynesians Reach Aotearoa",
    blurb: "Voyaging canoes arrive in New Zealand, one of the last great landmasses settled by humans.",
  },
  {
    year: 1324, category: "empire", title: "Mansa Musa's Pilgrimage",
    blurb: "The fabulously rich king of Mali travels to Mecca. He spends so much gold in Cairo that its value falls for years.",
  },
  {
    year: 1347, category: "disaster", title: "The Black Death",
    blurb: "Plague reaches Europe through its Mediterranean ports. Within a few years it kills perhaps a third to a half of the population.",
  },
  {
    year: 1405, category: "migration", title: "The Treasure Fleets",
    blurb: "Admiral Zheng He leads Ming China's vast fleets across the Indian Ocean, as far as the coast of East Africa.",
  },
  {
    year: 1440, approx: true, category: "invention", title: "The Printing Press",
    blurb: "Johannes Gutenberg develops movable-type printing in Mainz. Books, and ideas, suddenly become cheap.",
  },
  {
    year: 1453, category: "war", title: "The Fall of Constantinople",
    blurb: "The Ottoman sultan Mehmed II breaches the city's ancient walls with giant cannon, ending the Byzantine Empire.",
  },
  {
    year: 1492, category: "migration", title: "Columbus Reaches the Americas",
    blurb: "A landing in the Bahamas begins lasting contact between the hemispheres, and the Columbian Exchange of crops, animals and diseases.",
  },
  {
    year: 1517, category: "culture", title: "The Reformation",
    blurb: "Martin Luther's Ninety-five Theses challenge the Catholic Church and split Western Christianity.",
  },
  {
    year: 1519, category: "migration", title: "Around the World",
    blurb: "Magellan's fleet sets sail. Three years later a single ship, under Juan Sebastián Elcano, completes the first circumnavigation.",
  },
  {
    year: 1520, category: "disaster", title: "Smallpox in the Americas",
    blurb: "Old World diseases begin killing millions of Indigenous Americans, who have no immunity. Tenochtitlan falls the following year.",
  },
  {
    year: 1526, category: "migration", title: "The Transatlantic Slave Trade",
    blurb: "The first direct slaving voyage sails from Africa to the Americas. Over 350 years, about 12.5 million Africans are forced across the Atlantic.",
  },
  {
    year: 1543, category: "invention", title: "The Sun at the Center",
    blurb: "Copernicus publishes his model of the heavens with the Sun, not the Earth, at the middle.",
  },
  {
    year: 1618, category: "war", title: "The Thirty Years' War",
    blurb: "A religious war engulfs Central Europe. Parts of Germany lose a third or more of their people.",
  },
  {
    year: 1687, category: "invention", title: "Newton's Principia",
    blurb: "Isaac Newton's laws of motion and gravity explain a falling apple and the orbiting Moon with the same mathematics.",
  },
  {
    year: 1769, category: "invention", title: "The Steam Engine",
    blurb: "James Watt patents a far more efficient steam engine, and the Industrial Revolution gathers speed.",
  },
  {
    year: 1776, category: "empire", title: "American Independence",
    blurb: "Thirteen British colonies declare themselves the United States of America.",
  },
  {
    year: 1789, category: "empire", title: "The French Revolution",
    blurb: "Parisians storm the Bastille. The old monarchy falls, and ideas of liberty and equality spread across Europe.",
  },
  {
    year: 1791, category: "war", title: "The Haitian Revolution",
    blurb: "Enslaved people in Saint-Domingue rise up. In 1804 Haiti becomes the first nation founded by people who freed themselves from slavery.",
  },
  {
    year: 1815, category: "disaster", title: "Tambora Erupts",
    blurb: "The largest eruption in recorded history, in Indonesia, cools the whole planet. 1816 becomes 'the year without a summer.'",
  },
  {
    year: 1859, category: "invention", title: "On the Origin of Species",
    blurb: "Charles Darwin argues that all life evolved by natural selection, joining everything above this line into a single story.",
  },
  {
    year: 1861, category: "war", title: "The American Civil War",
    blurb: "Union and Confederacy fight over slavery. The war ends slavery in the United States and leaves more than 600,000 dead.",
  },
  {
    year: 1876, category: "invention", title: "The Telephone",
    blurb: "Alexander Graham Bell patents the telephone. A human voice can now travel along a wire.",
  },
  {
    year: 1884, category: "empire", title: "The Scramble for Africa",
    blurb: "At the Berlin Conference, European powers agree rules for carving up Africa. By 1914 nearly the whole continent is colonized.",
  },
  {
    year: 1903, category: "invention", title: "The First Powered Flight",
    blurb: "At Kitty Hawk, the Wright brothers' Flyer stays aloft for twelve seconds.",
  },
  {
    year: 1914, category: "war", title: "The First World War",
    blurb: "Industrialized warfare kills around 20 million soldiers and civilians and topples four empires.",
  },
  {
    year: 1917, category: "empire", title: "The Russian Revolution",
    blurb: "The tsar falls and the Bolsheviks seize power, creating the world's first communist state.",
  },
  {
    year: 1918, category: "disaster", title: "The 1918 Influenza",
    blurb: "A flu pandemic infects about a third of humanity and kills an estimated 50 million people.",
  },
  {
    year: 1928, category: "invention", title: "Penicillin",
    blurb: "Alexander Fleming notices a mold killing the bacteria in a petri dish. It is the dawn of antibiotics.",
  },
  {
    year: 1939, category: "war", title: "The Second World War",
    blurb: "The deadliest conflict in history. Some 70 to 85 million people die, including six million Jews murdered in the Holocaust.",
  },
  {
    year: 1945, category: "war", title: "The Atomic Bomb",
    blurb: "The United States destroys Hiroshima and Nagasaki. Humanity now holds the power to end itself.",
  },
  {
    year: 1947, category: "migration", title: "The Partition of India",
    blurb: "British India splits into India and Pakistan. Some 15 million people are uprooted, in one of the largest migrations in history.",
  },
  {
    year: 1953, category: "invention", title: "The Double Helix",
    blurb: "Watson and Crick, drawing on Rosalind Franklin's X-ray images, describe the structure of DNA.",
  },
  {
    year: 1957, category: "invention", title: "Sputnik",
    blurb: "The Soviet Union launches the first artificial satellite, and the Space Race begins.",
  },
  {
    year: 1960, category: "empire", title: "The Year of Africa",
    blurb: "Seventeen African nations win independence in a single year as the colonial empires crumble.",
  },
  {
    year: 1969, category: "migration", title: "Footprints on the Moon",
    blurb: "Neil Armstrong and Buzz Aldrin of Apollo 11 become the first humans to walk on another world.",
  },
  {
    year: 1986, category: "disaster", title: "Chernobyl",
    blurb: "A reactor explodes in Soviet Ukraine in the worst nuclear accident in history.",
  },
  {
    year: 1989, category: "empire", title: "The Berlin Wall Falls",
    blurb: "Crowds break open the wall dividing Berlin. Within two years the Soviet Union dissolves and the Cold War is over.",
  },
  {
    year: 1991, category: "invention", title: "The World Wide Web",
    blurb: "Tim Berners-Lee's web opens to the public, linking documents across the internet with a click.",
  },
  {
    year: 2001, category: "war", title: "September 11",
    blurb: "Hijacked airliners strike New York and Washington. The attacks set off two decades of war in Afghanistan and Iraq.",
  },
  {
    year: 2004, category: "disaster", title: "The Indian Ocean Tsunami",
    blurb: "A magnitude 9.1 earthquake off Sumatra sends waves across an entire ocean, killing about 230,000 people in fourteen countries.",
  },
  {
    year: 2020, category: "disaster", title: "COVID-19",
    blurb: "A new coronavirus spreads worldwide, killing millions and shutting down much of daily life.",
  },
  {
    year: 2022, category: "invention", title: "Thinking Machines",
    blurb: "Generative AI chatbots are released to the public and reach hundreds of millions of people within months.",
  },
];

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const EVENTS: HistoryEvent[] = RAW.map((e) => ({
  id: slug(e.title),
  title: e.title,
  category: e.category,
  blurb: e.blurb,
  year: e.ago !== undefined ? NOW_YEAR - e.ago : e.year!,
  deep: e.ago !== undefined,
  approx: !!e.approx,
})).sort((a, b) => a.year - b.year);
