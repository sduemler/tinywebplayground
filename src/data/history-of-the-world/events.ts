// The events on the History of the World scroll, oldest first.
//
// Dates: deep-time entries give `ago` (years before the present); everything
// from the end of the last ice age onward gives `year` (negative = BCE, no
// year zero is modelled — spans across 1 BCE/1 CE are off by one year, which
// is well below the "≈" precision the UI shows). `approx` prefixes "c." and
// marks spans touching the event as approximate.
//
// `meanwhile` describes the stretch of time *leading up to* the event. It is
// shown inside the unrolled fold just above the event, so it only matters for
// events that follow a long (foldable) gap.

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
  /** One-word name for the compact key beside the seal. */
  short: string;
  /** Ink color of the event's underline and spine dot. */
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "cosmic", label: "Cosmic & Geological", short: "Cosmic", color: "#4b4453" },
  { id: "life", label: "Life & Evolution", short: "Life", color: "#3d7a45" },
  { id: "disaster", label: "Disasters & Plagues", short: "Disasters", color: "#c4561a" },
  { id: "war", label: "Wars & Conflict", short: "Wars", color: "#8e1b1b" },
  { id: "invention", label: "Inventions & Science", short: "Inventions", color: "#2d5a7b" },
  { id: "migration", label: "Migrations & Exploration", short: "Migrations", color: "#b08209" },
  { id: "empire", label: "Empires & Politics", short: "Empires", color: "#6d2a6b" },
  { id: "culture", label: "Culture & Religion", short: "Culture", color: "#b5476f" },
];

interface RawEvent {
  title: string;
  category: CategoryId;
  blurb: string;
  meanwhile?: string;
  ago?: number;
  year?: number;
  approx?: boolean;
}

export interface HistoryEvent {
  id: string;
  title: string;
  category: CategoryId;
  blurb: string;
  /** What the world was doing in the long gap before this event, if anything. */
  meanwhile?: string;
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
    blurb: "Dust and rock circling the young Sun clump together into a molten planet, third from its star. The clock starts here. For its first few hundred million years the surface is an ocean of magma, battered by leftover debris.",
  },
  {
    ago: 4.51e9, approx: true, category: "cosmic", title: "The Moon Is Born",
    blurb: "A Mars-sized body called Theia slams into the infant Earth. The debris flung into orbit gathers into the Moon. It starts out far closer than today, raising enormous tides, and has been drifting away ever since, about 3.8 cm a year.",
    meanwhile: "The young solar system is a shooting gallery. Leftover chunks of rock collide, merge or are flung away as the planets settle into their orbits.",
  },
  {
    ago: 4.4e9, approx: true, category: "cosmic", title: "The First Oceans",
    blurb: "Tiny zircon crystals from Western Australia's Jack Hills, the oldest known pieces of Earth, show that liquid water was already pooling on the cooling surface. Water will make Earth the only world known to host life.",
    meanwhile: "The magma ocean cools and a thin, fragile crust forms. Water vapour escaping from the interior thickens the air and begins to fall as rain.",
  },
  {
    ago: 3.5e9, approx: true, category: "life", title: "The First Signs of Life",
    blurb: "Microbial mats build layered mounds called stromatolites, whose fossils survive in some of the oldest rocks on Earth. Living stromatolites still grow today in the salty lagoons of Shark Bay, Australia.",
    meanwhile: "Continents begin to grow from volcanic islands. There is no free oxygen in the air. Somewhere, perhaps at hot vents on the sea floor, chemistry quietly becomes biology.",
  },
  {
    ago: 2.4e9, approx: true, category: "life", title: "The Great Oxidation",
    blurb: "Photosynthesizing cyanobacteria flood the air with oxygen, poisoning much of early life but making ours possible. Iron dissolved in the seas rusts and sinks, laying down the banded rocks we mine for steel today. The oxygen also forms an ozone layer that will one day shield life on land.",
    meanwhile: "Microbes are the only life on Earth. Cyanobacteria learn to split water using sunlight, releasing oxygen that for ages is soaked up by iron in the seas.",
  },
  {
    ago: 1.8e9, approx: true, category: "life", title: "Complex Cells",
    blurb: "Cells with a nucleus appear, probably after one microbe swallowed another and kept it as a power plant: the mitochondrion. Every plant, animal and fungus alive today is built from cells like these.",
    meanwhile: "Oxygen seeps into the air, and the planet plunges into some of its first great ice ages.",
  },
  {
    ago: 7.2e8, approx: true, category: "cosmic", title: "Snowball Earth",
    blurb: "Ice creeps nearly to the equator in one of the most severe glaciations the planet has ever known. Life hangs on in patches of open water and near volcanic vents, and the great thaw may have set the stage for animals.",
    meanwhile: "The so-called 'Boring Billion'. For roughly a billion years the climate and life change remarkably little, and the seas belong to microbes and simple algae.",
  },
  {
    ago: 5.75e8, approx: true, category: "life", title: "The Ediacaran Creatures",
    blurb: "Soft, quilted organisms, some a metre long, spread across the sea floor. They are among the first large, complex living things. Most look like nothing alive today: fronds, discs and quilts with no obvious head, mouth or legs.",
    meanwhile: "Earth freezes over and thaws at least twice. In the meltwater seas, the first sponges and other simple animals may already be appearing.",
  },
  {
    ago: 5.39e8, approx: true, category: "life", title: "The Cambrian Explosion",
    blurb: "In a geological blink, most major animal body plans appear: eyes, shells, jointed legs, and the first true predators. Nearly every major animal group alive today, including our own backboned ancestors, traces its roots to this burst.",
    meanwhile: "Animals begin to burrow and crawl across the sea floor, leaving the first tracks.",
  },
  {
    ago: 4.7e8, approx: true, category: "life", title: "Plants Come Ashore",
    blurb: "Moss-like plants creep onto the bare continents. Their roots and debris start the first soils, and by drawing carbon dioxide from the air they begin to cool the climate.",
    meanwhile: "The seas fill with trilobites, the first fish-like animals and giant predators like Anomalocaris, while the land stays bare rock.",
  },
  {
    ago: 4.45e8, approx: true, category: "disaster", title: "The Ordovician Extinction",
    blurb: "A sudden ice age locks up water and drains the shallow seas where most life lived. Around 85 percent of marine species die out in the second-worst mass extinction in Earth's history.",
    meanwhile: "Reefs spread across warm, shallow seas, and life on the sea floor diversifies faster than ever before.",
  },
  {
    ago: 3.85e8, approx: true, category: "life", title: "The First Forests",
    blurb: "Trees such as Archaeopteris, with true wood and deep roots, form the first forests. They pull so much carbon from the air that the climate cools, and the forests that follow will be buried to become the world's coal.",
    meanwhile: "Life rebounds. Fish with jaws appear and spread, and the first insects and small plants creep inland.",
  },
  {
    ago: 3.75e8, approx: true, category: "life", title: "A Fish Takes a Step",
    blurb: "Tiktaalik, part fish and part four-legged animal, props itself up in the shallows. It is a close cousin of the first land vertebrates. Its neck, sturdy fins and lungs show how the move from water to land happened step by step.",
    meanwhile: "In rivers and swamps, lobe-finned fish grow stronger fins and gulp air when the water runs short of oxygen.",
  },
  {
    ago: 3.35e8, approx: true, category: "cosmic", title: "Pangaea",
    blurb: "The continents grind together into a single supercontinent, ringed by one world ocean. Its heart lies so far from the sea that vast deserts form.",
    meanwhile: "Four-limbed animals crawl onto land, and vast swamp forests grow whose remains will become most of the world's coal.",
  },
  {
    ago: 3.12e8, approx: true, category: "life", title: "The Egg That Left the Water",
    blurb: "Early reptiles such as Hylonomus lay eggs with a tough shell and their own private pond inside. No longer needing water to breed, animals can move into the dry interiors of continents.",
    meanwhile: "Giant insects thrive in air richer in oxygen than today's. Some dragonfly relatives have wingspans of 70 cm.",
  },
  {
    ago: 2.52e8, approx: true, category: "disaster", title: "The Great Dying",
    blurb: "Vast Siberian eruptions trigger the worst mass extinction ever. Roughly nine in ten marine species vanish. Carbon dioxide from the eruptions heats the planet and strips oxygen from the oceans, and recovery takes millions of years.",
    meanwhile: "Pangaea's climate turns harsh and dry. Reptiles and our distant mammal-like relatives, the synapsids, spread across the land.",
  },
  {
    ago: 2.31e8, approx: true, category: "life", title: "The First Dinosaurs",
    blurb: "Small, two-legged hunters appear in what is now Argentina. Their descendants will rule the land for 165 million years. For now, though, they share it with larger crocodile-like reptiles.",
    meanwhile: "Life slowly recovers in a hot, dry world. The survivors, among them the ancestors of crocodiles, dinosaurs and mammals, inherit an emptied planet.",
  },
  {
    ago: 2.25e8, approx: true, category: "life", title: "The First Mammals",
    blurb: "Small, furry, and probably nocturnal, the earliest mammal-like creatures scurry about at the dinosaurs' feet. They will stay small for more than 150 million years.",
  },
  {
    ago: 2.01e8, approx: true, category: "disaster", title: "The End-Triassic Extinction",
    blurb: "Massive eruptions along the rift that will become the Atlantic trigger another mass extinction. Many of the dinosaurs' rivals disappear, and dinosaurs rise to dominate the land.",
    meanwhile: "Dinosaurs remain modest-sized and rare while crocodile relatives rule, and the first pterosaurs glide overhead.",
  },
  {
    ago: 2.0e8, approx: true, category: "cosmic", title: "Pangaea Breaks Apart",
    blurb: "The supercontinent begins to rift. A young Atlantic Ocean opens between Africa and the Americas. The continents are still drifting today, at about the speed your fingernails grow.",
  },
  {
    ago: 1.5e8, approx: true, category: "life", title: "Feathers Take Flight",
    blurb: "Archaeopteryx, a feathered dinosaur with teeth, claws and wings, flaps through the Jurassic. Birds are dinosaurs. Found in 1861, two years after Darwin's Origin of Species, it became a famous link between reptiles and birds.",
    meanwhile: "Dinosaurs grow into giants. Long-necked sauropods like Brachiosaurus become the largest animals ever to walk the land.",
  },
  {
    ago: 1.3e8, approx: true, category: "life", title: "The First Flowers",
    blurb: "Flowering plants appear, then spread across the globe alongside the insects that pollinate them. Today most plant species flower, including almost every crop we eat.",
    meanwhile: "The breakup of Pangaea continues, and South America begins to pull away from Africa.",
  },
  {
    ago: 6.6e7, category: "disaster", title: "The Asteroid",
    blurb: "A rock about 10 km wide strikes Mexico's Yucatán. The non-bird dinosaurs, and about three-quarters of all species, are wiped out. Soot and dust darken the skies, and food chains collapse. Small, burrowing mammals survive, and their descendants inherit the Earth.",
    meanwhile: "Dinosaurs reach their peak: Tyrannosaurus, Triceratops and giant sauropods. The Atlantic keeps widening, and flowering plants spread everywhere.",
  },
  {
    ago: 5e7, approx: true, category: "cosmic", title: "India Hits Asia",
    blurb: "After drifting north across the ocean, the Indian plate collides with Asia. The crumpling crust begins to raise the Himalayas and the Tibetan Plateau, which are still rising today.",
    meanwhile: "In the warm world after the asteroid, mammals diversify quickly into early horses, the land-dwelling ancestors of whales, and the first primates.",
  },
  {
    ago: 7e6, approx: true, category: "life", title: "A Split in the Family",
    blurb: "Our ancestors part ways with those of chimpanzees. Sahelanthropus, found in Chad, is one of the earliest known members of the human line. The change is slow: for millions of years our ancestors still climb trees as they learn to walk upright.",
    meanwhile: "The planet cools. Ice sheets form on Antarctica, grasslands spread, and apes appear and diversify in Africa and Eurasia.",
  },
  {
    ago: 3.3e6, approx: true, category: "invention", title: "The First Stone Tools",
    blurb: "Near Kenya's Lake Turkana, early hominins strike sharp flakes off stones. The tools are older than our own genus. Sharp edges let our ancestors butcher carcasses, adding meat and marrow to their diet.",
    meanwhile: "Upright-walking relatives of ours roam the woodlands of East Africa, though their brains are still no bigger than a chimpanzee's.",
  },
  {
    ago: 2.8e6, approx: true, category: "life", title: "Our Genus Appears",
    blurb: "A jawbone from Ledi-Geraru, Ethiopia, is the oldest known fossil of the genus Homo. Its members will have ever-larger brains and ever-better tools.",
    meanwhile: "Australopithecines such as the famous 'Lucy' walk upright through East Africa.",
  },
  {
    ago: 2.58e6, category: "cosmic", title: "The Ice Ages Begin",
    blurb: "Earth enters an era of repeating ice ages. Glaciers will advance and retreat dozens of times. Our genus evolves in this restless, cold-and-warm world, which we are still living in.",
  },
  {
    ago: 1.8e6, approx: true, category: "migration", title: "Out of Africa, the First Time",
    blurb: "Homo erectus spreads beyond Africa, reaching the Caucasus and eventually China and Java. Tall and long-legged, built for walking and running long distances, the species will survive for well over a million years.",
    meanwhile: "Early humans make stone tools across East Africa as the climate swings between wet and dry.",
  },
  {
    ago: 1e6, approx: true, category: "invention", title: "Mastering Fire",
    blurb: "Ash and burnt bone deep in South Africa's Wonderwerk Cave hint at the earliest controlled use of fire. Cooking makes food easier to digest, which may have helped fuel the growth of larger brains.",
    meanwhile: "Homo erectus spreads across Asia with a simple, successful toolkit that barely changes for hundreds of thousands of years.",
  },
  {
    ago: 3e5, approx: true, category: "life", title: "Homo sapiens",
    blurb: "Our own species appears in Africa. The oldest known fossils, from Jebel Irhoud in Morocco, are about 300,000 years old. Everyone alive today descends mainly from these early African populations.",
    meanwhile: "Several human species share the planet, including Neanderthals in Europe and Denisovans in Asia. Handaxes are refined and big game is hunted.",
  },
  {
    ago: 7.4e4, approx: true, category: "disaster", title: "The Toba Supereruption",
    blurb: "A volcano on Sumatra erupts thousands of times more violently than Mount St. Helens, blanketing South Asia in ash. Scientists still argue over how badly it hurt the humans of the time; many communities seem to have come through.",
    meanwhile: "Homo sapiens spreads across Africa, gathering shellfish on the coasts and making the first known beads and engraved ochre.",
  },
  {
    ago: 6.5e4, approx: true, category: "migration", title: "Out of Africa, Again",
    blurb: "Small bands of modern humans leave Africa. Over tens of thousands of years their descendants reach every continent but Antarctica. Nearly every non-African person alive today descends mainly from these migrants.",
  },
  {
    ago: 5.12e4, approx: true, category: "culture", title: "The Oldest Story",
    blurb: "On a cave wall in Sulawesi, Indonesia, someone paints three human-like figures around a wild pig. It is the oldest known narrative art. Across the world, people are now making jewelry, figurines and paintings.",
  },
  {
    ago: 5e4, approx: true, category: "migration", title: "Reaching Australia",
    blurb: "Crossing open sea, people arrive in Sahul, the joined landmass of Australia and New Guinea. They begin the world's oldest continuous cultures. Even at low sea level, the journey needed boats and crossings of many kilometres.",
  },
  {
    ago: 4e4, approx: true, category: "life", title: "The Last Neanderthals",
    blurb: "Neanderthals disappear, but not entirely: most people alive today carry a little of their DNA. They buried their dead, made tools and ornaments, and survived Ice Age Europe for hundreds of thousands of years.",
    meanwhile: "Modern humans reach Europe, where they share the continent with Neanderthals for several thousand years.",
  },
  {
    ago: 2.3e4, approx: true, category: "life", title: "Wolves Become Dogs",
    blurb: "Somewhere in the cold north, probably Siberia, wolves begin living alongside human hunters. Dogs are the first domesticated animal, tamed thousands of years before any crop.",
    meanwhile: "The Ice Age deepens. People hunt mammoths on the northern steppes and sew fitted clothing with bone needles.",
  },
  {
    ago: 2e4, approx: true, category: "cosmic", title: "The Last Glacial Maximum",
    blurb: "Ice sheets kilometres thick bury much of North America and northern Europe. Sea level sits about 120 m lower than today. Land bridges link Britain to Europe and Siberia to Alaska.",
  },
  {
    ago: 1.6e4, approx: true, category: "migration", title: "Into the Americas",
    blurb: "People cross from Siberia over the land bridge of Beringia and travel south along the Pacific coast. They may have arrived even earlier. Within a few thousand years people live from Alaska to the tip of South America.",
  },
  {
    ago: 1.29e4, approx: true, category: "cosmic", title: "The Big Freeze Returns",
    blurb: "Just as the ice is melting, the Northern Hemisphere plunges back into near-glacial cold for about 1,200 years, possibly after a flood of meltwater disrupted Atlantic currents. When it ends, temperatures leap upward within decades.",
    meanwhile: "Mammoths, giant ground sloths and other Ice Age giants begin to vanish as the climate warms and human hunters spread.",
  },

  // ── The Holocene: farming, cities, writing ───────────────────────────────
  {
    year: -9500, approx: true, category: "culture", title: "Göbekli Tepe",
    blurb: "Hunter-gatherers in what is now Turkey raise huge carved stone pillars in rings. It is a monumental site older than farming there. Its builders had no crops or herds, suggesting shared rituals may have drawn people together before farming did.",
  },
  {
    year: -9000, approx: true, category: "invention", title: "The First Farmers",
    blurb: "In the Fertile Crescent, people begin sowing wheat and barley and herding goats. Farming feeds more people from the same land, so villages become permanent and populations grow. Early farmers, though, are often shorter and less healthy than the hunters before them.",
  },
  {
    year: -7100, approx: true, category: "culture", title: "Çatalhöyük",
    blurb: "In central Turkey, thousands of people live in a town of packed mud-brick houses entered through the roof. Its walls are decorated with paintings and plastered bulls' heads.",
    meanwhile: "Villages multiply across the Fertile Crescent, and sheep, goats, pigs and cattle are domesticated.",
  },
  {
    year: -7000, approx: true, category: "invention", title: "Farming Everywhere",
    blurb: "Rice is domesticated along China's Yangtze River, and maize from a wild grass in Mexico. Farming is invented independently in several places around the world, including New Guinea.",
  },
  {
    year: -3500, approx: true, category: "invention", title: "The Wheel",
    blurb: "Potters' wheels and then wheeled carts appear in Mesopotamia and on the steppes north of the Black Sea. The wheel comes thousands of years after farming and pottery; the hard part is a precisely fitted axle.",
    meanwhile: "Farming spreads into Europe, Egypt and South Asia. People learn to smelt copper, weave cloth and fire pottery, and villages grow into towns.",
  },
  {
    year: -3300, approx: true, category: "invention", title: "The Bronze Age",
    blurb: "Smiths in the Near East alloy copper with tin to make bronze, harder than either metal alone. Tin is rare, so the demand for it drives long-distance trade.",
  },
  {
    year: -3200, approx: true, category: "invention", title: "Writing",
    blurb: "Sumerian scribes in Uruk press wedge-shaped marks into clay. History, in the written sense, begins. The first texts are mostly accounts of grain, beer and livestock, not stories. Writing will also be invented independently in China and in Mesoamerica.",
  },
  {
    year: -3100, approx: true, category: "empire", title: "Egypt Unites",
    blurb: "King Narmer, by tradition, joins Upper and Lower Egypt, beginning three thousand years of pharaohs. The Nile's reliable yearly flood makes Egypt one of the richest and most stable societies of the ancient world.",
  },
  {
    year: -2600, approx: true, category: "empire", title: "Cities of the Indus",
    blurb: "Harappa and Mohenjo-daro rise in what is now Pakistan, with grid streets, covered drains and standard-sized bricks. Their script has never been deciphered, and around 1900 BCE the cities are slowly abandoned.",
    meanwhile: "Sumer's city-states grow and quarrel, and Egypt's early pharaohs begin building monumental tombs.",
  },
  {
    year: -2560, approx: true, category: "culture", title: "The Great Pyramid",
    blurb: "It is built at Giza for the pharaoh Khufu, and will stand as the tallest human-made structure for nearly four thousand years. It was raised not by slaves, as legend says, but largely by paid and conscripted Egyptian workers.",
  },
  {
    year: -2334, approx: true, category: "empire", title: "The First Empire",
    blurb: "Sargon of Akkad conquers the city-states of Sumer, forging what is often called the world's first empire. It lasts about 180 years, and its collapse coincides with a severe drought.",
  },
  {
    year: -2200, approx: true, category: "invention", title: "Taming the Horse",
    blurb: "On the steppes north of the Black Sea, people breed the ancestors of all today's domestic horses. Within a few centuries, horses and spoke-wheeled chariots transform travel and war across Eurasia.",
  },
  {
    year: -1754, approx: true, category: "empire", title: "The Code of Hammurabi",
    blurb: "A Babylonian king carves 282 laws into stone, 'an eye for an eye' among them. It is one of the earliest written legal codes. Punishments depend on rank: harming a noble costs far more than harming a slave.",
    meanwhile: "Bronze Age kingdoms trade tin, copper and luxuries across Eurasia. Minoan palaces rise on Crete, and Stonehenge takes its final form.",
  },
  {
    year: -1600, approx: true, category: "disaster", title: "Thera Erupts",
    blurb: "A colossal eruption on Santorini buries the town of Akrotiri and shakes the Minoan world of the Aegean. Its tsunamis and ash may have helped weaken the Minoan civilization of Crete.",
  },
  {
    year: -1600, approx: true, category: "empire", title: "The Shang Dynasty",
    blurb: "China's first archaeologically confirmed dynasty rises on the Yellow River. Its oracle bones carry the earliest Chinese writing. Kings put questions to their ancestors by cracking heated bones and reading the cracks.",
  },
  {
    year: -1500, approx: true, category: "culture", title: "The Vedas",
    blurb: "In northern India, poets compose the Rigveda, hymns passed down by memory for many centuries before being written. They are among the oldest religious texts still in use and lie at the roots of Hinduism.",
  },
  {
    year: -1300, approx: true, category: "migration", title: "Voyagers of the Pacific",
    blurb: "Lapita seafarers, whose Austronesian ancestors came from Taiwan, sail east into the open Pacific. They settle islands as far as Tonga and Samoa. Navigating by stars, swells and birds, their Polynesian descendants will reach Hawaii, Rapa Nui and New Zealand.",
    meanwhile: "Egypt's New Kingdom reaches its peak under pharaohs such as Hatshepsut, Akhenaten and Tutankhamun.",
  },
  {
    year: -1200, approx: true, category: "empire", title: "The Olmec",
    blurb: "In the lowlands of Mexico's Gulf Coast, the Olmec carve colossal stone heads and lay the foundations of Mesoamerican civilization. The heads, some over three metres tall, are thought to be portraits of rulers.",
  },
  {
    year: -1177, approx: true, category: "disaster", title: "The Bronze Age Collapse",
    blurb: "Within a few decades, the palace civilizations of the eastern Mediterranean fall to drought, earthquakes, raiders and broken trade. Writing vanishes from Greece for four centuries, and iron, easier to find than tin, comes into wide use.",
  },
  {
    year: -1050, approx: true, category: "invention", title: "The Alphabet",
    blurb: "Phoenician merchants use a script of just 22 letters, each standing for a sound. Greek, Latin, Hebrew and Arabic scripts all descend from it, including the letters you are reading now.",
  },
  {
    year: -1000, approx: true, category: "migration", title: "The Bantu Expansion",
    blurb: "Bantu-speaking farmers spread out from West-Central Africa, eventually carrying their languages and iron-working across half a continent. Today hundreds of millions of people speak Bantu languages, from Swahili to Zulu.",
  },
  {
    year: -776, category: "culture", title: "The First Olympic Games",
    blurb: "Athletes gather at Olympia to honor Zeus. For centuries, Greeks will count the years by these games. A sacred truce pauses wars so athletes and spectators can travel safely.",
    meanwhile: "Iron tools spread, and small kingdoms such as Israel and Judah rise in the lands between Egypt and Mesopotamia.",
  },
  {
    year: -750, approx: true, category: "culture", title: "Homer's Epics",
    blurb: "The Iliad and the Odyssey, tales of the Trojan War and a long voyage home, take written form in Greek. They will shape Western literature for nearly three thousand years.",
  },
  {
    year: -600, approx: true, category: "invention", title: "The First Coins",
    blurb: "In Lydia, in modern Turkey, kings stamp lumps of electrum, a natural gold-silver alloy, with a lion's head to guarantee their value. Coins soon spread across the Greek world and beyond.",
  },
  {
    year: -508, category: "empire", title: "Democracy in Athens",
    blurb: "Cleisthenes' reforms give the citizens of Athens a vote on their own laws. Only free adult men count as citizens, but the idea that a people can govern itself will echo for millennia.",
  },
  {
    year: -500, approx: true, category: "culture", title: "The Axial Age",
    blurb: "Within a few generations, the Buddha in India, Confucius in China and the first Greek philosophers ask new questions about how to live. Their ideas still guide billions of people today.",
  },
  {
    year: -334, category: "war", title: "Alexander Marches East",
    blurb: "Alexander of Macedon invades Persia. In eleven years he builds an empire stretching from Greece to India. It splits apart at his death, but Greek language and culture spread from Egypt to Afghanistan.",
    meanwhile: "Greek city-states fight off Persian invasions, and Athens enjoys a golden age of theatre, philosophy and architecture.",
  },
  {
    year: -322, approx: true, category: "empire", title: "The Maurya Empire",
    blurb: "Chandragupta Maurya unites most of the Indian subcontinent. His grandson Ashoka, sickened by a bloody conquest, renounces war and carves edicts of tolerance on pillars across India, sending Buddhism across Asia.",
  },
  {
    year: -221, category: "empire", title: "China Unified",
    blurb: "Qin Shi Huang becomes the first emperor of a united China, standardizing its script, coins, weights and roads. He links walls into an early Great Wall and is buried with an army of thousands of life-sized terracotta soldiers.",
  },
  {
    year: -130, approx: true, category: "migration", title: "The Silk Road",
    blurb: "The journeys of the Han envoy Zhang Qian open routes that will carry silk, spices, faiths and plagues between China and Rome. Hardly anyone travels its whole length; goods pass from trader to trader across thousands of kilometres.",
  },
  {
    year: -27, category: "empire", title: "Rome Becomes an Empire",
    blurb: "Octavian takes the name Augustus. The Roman Republic becomes an empire that will ring the Mediterranean. The two centuries of relative peace that follow are called the Pax Romana.",
  },

  // ── The Common Era ───────────────────────────────────────────────────────
  {
    year: 30, approx: true, category: "culture", title: "The Crucifixion of Jesus",
    blurb: "Jesus of Nazareth is executed in Roman Judea. His followers will spread a faith that becomes the world's largest religion. Within four centuries it is the official religion of the Roman Empire.",
  },
  {
    year: 79, category: "disaster", title: "Vesuvius Buries Pompeii",
    blurb: "Ash and scalding gas entomb Pompeii and Herculaneum, freezing a moment of Roman daily life for 1,700 years. The letters of Pliny the Younger, whose uncle died in the eruption, are among the first eyewitness accounts of a volcano.",
  },
  {
    year: 105, category: "invention", title: "Paper",
    blurb: "The Chinese court official Cai Lun is credited with perfecting paper made from bark, hemp and rags. Cheaper and lighter than parchment, it reaches the Islamic world in the 700s and Europe centuries later.",
  },
  {
    year: 250, approx: true, category: "empire", title: "The Classic Maya",
    blurb: "Maya city-states such as Tikal flourish, with monumental temples, a full writing system and a calendar of startling precision. Many of the great southern cities are abandoned in the 800s and 900s, probably after drought and war.",
    meanwhile: "Rome reaches its greatest extent under the emperor Trajan, while Han China collapses into civil war.",
  },
  {
    year: 476, category: "empire", title: "The Fall of Rome",
    blurb: "The last western emperor is deposed. The eastern half carries on as the Byzantine Empire for another thousand years. In the west, cities shrink and trade declines as Germanic kingdoms take over the old provinces.",
    meanwhile: "Christianity becomes Rome's state religion, the empire splits into east and west, and peoples from beyond its frontiers push inside.",
  },
  {
    year: 541, category: "disaster", title: "The Plague of Justinian",
    blurb: "The first recorded pandemic of bubonic plague sweeps the Mediterranean world, killing millions. It returns in waves for two centuries, weakening the Byzantine Empire just as new powers rise.",
  },
  {
    year: 622, category: "culture", title: "The Rise of Islam",
    blurb: "Muhammad and his followers leave Mecca for Medina. The Hijra marks year one of the Islamic calendar. Within a century, Muslim armies and traders carry the faith from Spain to Central Asia.",
  },
  {
    year: 628, category: "invention", title: "Zero",
    blurb: "The Indian mathematician Brahmagupta sets down rules for calculating with zero, treating it as a number in its own right. Carried west by Arab scholars, Indian numerals, 0 through 9, become the digits the whole world uses.",
  },
  {
    year: 800, category: "empire", title: "Charlemagne Crowned",
    blurb: "On Christmas Day the pope crowns the Frankish king emperor, uniting much of Western Europe under one ruler. His empire soon splits among his grandsons, roughly into the lands that became France and Germany.",
    meanwhile: "The Tang dynasty makes China perhaps the richest empire on Earth, and the Islamic caliphate stretches from Spain to Central Asia.",
  },
  {
    year: 830, approx: true, category: "culture", title: "The House of Wisdom",
    blurb: "In Baghdad, scholars translate Greek, Persian and Indian works into Arabic and build on them. One of them, al-Khwarizmi, gives his name to the algorithm and his book's title to algebra.",
  },
  {
    year: 850, approx: true, category: "invention", title: "Gunpowder",
    blurb: "Chinese alchemists searching for an elixir of life instead find a mixture of saltpetre, sulfur and charcoal that burns explosively. It is used first in fireworks and fire-arrows; guns and cannon follow centuries later.",
  },
  {
    year: 1000, approx: true, category: "migration", title: "Vikings in America",
    blurb: "Leif Erikson's Norse crew lands in Newfoundland, nearly five hundred years before Columbus. Their settlement at L'Anse aux Meadows lasts only a few years.",
  },
  {
    year: 1008, approx: true, category: "culture", title: "The Tale of Genji",
    blurb: "Murasaki Shikibu, a lady of the Japanese imperial court, writes a vast story of love and court life. It is often called the world's first novel.",
  },
  {
    year: 1050, approx: true, category: "empire", title: "Cahokia",
    blurb: "Near modern St. Louis, Cahokia grows into the largest city north of Mexico, home to perhaps 10,000 to 20,000 people. At its heart rises Monks Mound, an earthen pyramid with a base larger than the Great Pyramid's.",
  },
  {
    year: 1066, category: "war", title: "The Norman Conquest",
    blurb: "William of Normandy wins at Hastings and remakes England's language, law and ruling class. Thousands of French words enter English, from 'beef' to 'justice'.",
  },
  {
    year: 1096, category: "war", title: "The First Crusade",
    blurb: "European armies march on Jerusalem, beginning two centuries of holy war in the eastern Mediterranean. The city falls in 1099 amid a massacre of its Muslim and Jewish inhabitants.",
  },
  {
    year: 1120, approx: true, category: "culture", title: "Angkor Wat",
    blurb: "The Khmer king Suryavarman II begins building Angkor Wat in Cambodia, the largest religious monument on Earth. Around it, Angkor is one of the biggest cities of the pre-industrial world.",
  },
  {
    year: 1206, category: "empire", title: "Genghis Khan",
    blurb: "Temüjin is proclaimed Genghis Khan. His Mongols will build the largest contiguous land empire in history. Their conquests kill millions, but also reopen the Silk Road, letting goods, ideas and plague move across Eurasia.",
  },
  {
    year: 1215, category: "empire", title: "Magna Carta",
    blurb: "England's barons force King John to accept that even a king is bound by the law. Most of its clauses deal with feudal disputes, but its promise of justice under law will inspire constitutions centuries later.",
  },
  {
    year: 1250, approx: true, category: "migration", title: "Polynesians Reach Aotearoa",
    blurb: "Voyaging canoes arrive in New Zealand, one of the last great landmasses settled by humans. There, Māori culture develops for centuries with no contact with the outside world.",
  },
  {
    year: 1300, approx: true, category: "empire", title: "Great Zimbabwe",
    blurb: "In southern Africa, Shona builders raise massive walls of fitted stone without mortar. The city is the capital of a kingdom that trades gold to the Indian Ocean world.",
  },
  {
    year: 1324, category: "empire", title: "Mansa Musa's Pilgrimage",
    blurb: "The fabulously rich king of Mali travels to Mecca. He spends so much gold in Cairo that its value falls for years. European mapmakers soon draw him on a throne, holding a golden nugget.",
  },
  {
    year: 1325, category: "empire", title: "Tenochtitlan Is Founded",
    blurb: "The Mexica build an island city in Lake Texcoco, linked to the shore by causeways. Within two centuries it is one of the largest cities on Earth and the capital of the Aztec Empire.",
  },
  {
    year: 1347, category: "disaster", title: "The Black Death",
    blurb: "Plague reaches Europe through its Mediterranean ports. Within a few years it kills perhaps a third to a half of the population. The bacterium, carried by fleas, empties whole villages. With so few workers left, wages rise and the old feudal order begins to crack.",
  },
  {
    year: 1400, approx: true, category: "culture", title: "The Renaissance",
    blurb: "In Florence and other Italian cities, artists and scholars rediscover the art and learning of ancient Greece and Rome. Perspective, anatomy and a new focus on the individual transform European art.",
  },
  {
    year: 1405, category: "migration", title: "The Treasure Fleets",
    blurb: "Admiral Zheng He leads Ming China's vast fleets across the Indian Ocean, as far as the coast of East Africa. His largest ships may have dwarfed Columbus's, but in 1433 China abruptly ends the voyages.",
  },
  {
    year: 1438, category: "empire", title: "The Inca Empire",
    blurb: "Pachacuti begins turning the small kingdom of Cusco into an empire stretching some 4,000 km along the Andes. It is held together by roads, relay runners and knotted-string records called quipu.",
  },
  {
    year: 1440, approx: true, category: "invention", title: "The Printing Press",
    blurb: "Johannes Gutenberg develops movable-type printing in Mainz. Books, and ideas, suddenly become cheap. Within fifty years millions of books are printed across Europe, speeding the spread of news, science and religious dissent.",
  },
  {
    year: 1453, category: "war", title: "The Fall of Constantinople",
    blurb: "The Ottoman sultan Mehmed II breaches the city's ancient walls with giant cannon, ending the Byzantine Empire. As Istanbul, it will be the Ottoman capital for nearly five centuries.",
  },
  {
    year: 1492, category: "migration", title: "Columbus Reaches the Americas",
    blurb: "A landing in the Bahamas begins lasting contact between the hemispheres. In the Columbian Exchange, potatoes, maize and tomatoes travel east while horses, wheat and smallpox travel west. For the Indigenous peoples of the Americas, it is the start of a catastrophe.",
  },
  {
    year: 1517, category: "culture", title: "The Reformation",
    blurb: "Martin Luther's Ninety-five Theses challenge the Catholic Church and split Western Christianity. The printing press spreads his ideas across Europe in weeks, and more than a century of religious wars follows.",
  },
  {
    year: 1519, category: "migration", title: "Around the World",
    blurb: "Magellan's fleet sets sail. Three years later a single ship, under Juan Sebastián Elcano, completes the first circumnavigation. Magellan is killed in the Philippines; of about 270 men who set out, only 18 return on that ship.",
  },
  {
    year: 1520, category: "disaster", title: "Smallpox in the Americas",
    blurb: "Old World diseases begin killing millions of Indigenous Americans, who have no immunity. Tenochtitlan falls the following year. Over the next century, epidemics may kill as many as nine in ten people across the two continents.",
  },
  {
    year: 1526, category: "empire", title: "The Transatlantic Slave Trade",
    blurb: "The first direct slaving voyage sails from Africa to the Americas, beginning one of the greatest crimes in human history. Over 350 years, some 12.5 million Africans are torn from their homes and shipped across the Atlantic in brutal conditions, and nearly two million die at sea. Their forced labour builds the wealth of colonial empires, and the racism invented to justify it outlives abolition.",
  },
  {
    year: 1526, category: "empire", title: "The Mughal Empire",
    blurb: "Babur, a descendant of both Genghis Khan and Timur, wins the Battle of Panipat and founds the Mughal Empire. At its height it rules most of South Asia and builds the Taj Mahal.",
  },
  {
    year: 1543, category: "invention", title: "The Sun at the Center",
    blurb: "Copernicus publishes his model of the heavens with the Sun, not the Earth, at the middle. He publishes only as he is dying, and the idea will take more than a century to win out.",
  },
  {
    year: 1610, category: "invention", title: "Galileo's Telescope",
    blurb: "Galileo turns a telescope on the sky and sees mountains on the Moon and moons circling Jupiter, proof that not everything orbits the Earth. The Church later forces him to recant, and he dies under house arrest.",
  },
  {
    year: 1618, category: "war", title: "The Thirty Years' War",
    blurb: "A religious war engulfs Central Europe. Parts of Germany lose a third or more of their people. The peace that ends it in 1648 helps establish the modern idea of sovereign states.",
  },
  {
    year: 1687, category: "invention", title: "Newton's Principia",
    blurb: "Isaac Newton's laws of motion and gravity explain a falling apple and the orbiting Moon with the same mathematics. His physics will aim cannon, build bridges and, three centuries later, guide astronauts to the Moon.",
  },
  {
    year: 1769, category: "invention", title: "The Steam Engine",
    blurb: "James Watt patents a far more efficient steam engine, and the Industrial Revolution gathers speed. Coal-powered factories, railways and steamships follow, and so does the long rise in carbon dioxide that is warming the planet today.",
    meanwhile: "The Enlightenment. Thinkers argue that reason and evidence, not tradition, should guide how people live and are governed.",
  },
  {
    year: 1776, category: "empire", title: "American Independence",
    blurb: "Thirteen British colonies declare themselves the United States of America. Its promise that 'all men are created equal' is written largely by slaveholders, a contradiction the nation will fight a civil war over.",
  },
  {
    year: 1789, category: "empire", title: "The French Revolution",
    blurb: "Parisians storm the Bastille. The old monarchy falls, and ideas of liberty and equality spread across Europe. The revolution executes its king, descends into the Terror, and ends with Napoleon's rise.",
  },
  {
    year: 1791, category: "war", title: "The Haitian Revolution",
    blurb: "Enslaved people in Saint-Domingue rise up. In 1804 Haiti becomes the first nation founded by people who freed themselves from slavery. Its success terrifies slaveholders across the Americas and inspires the enslaved everywhere.",
  },
  {
    year: 1796, category: "invention", title: "The First Vaccine",
    blurb: "Edward Jenner protects a boy from smallpox by infecting him with mild cowpox. Vaccination will eventually wipe smallpox from the Earth, the only human disease ever eradicated.",
  },
  {
    year: 1815, category: "disaster", title: "Tambora Erupts",
    blurb: "The largest eruption in recorded history, in Indonesia, cools the whole planet. 1816 becomes 'the year without a summer.' Crops fail from Europe to New England, bringing hunger far from the volcano.",
  },
  {
    year: 1833, category: "empire", title: "Abolition in the British Empire",
    blurb: "After decades of campaigning by abolitionists and uprisings by the enslaved, Britain outlaws slavery across most of its empire. Slaveholders are paid compensation; the people they enslaved receive nothing.",
  },
  {
    year: 1845, category: "disaster", title: "The Great Irish Famine",
    blurb: "A blight destroys the potato crop most poor Irish families depend on. About a million people die and another million emigrate, even as food continues to be exported from Ireland.",
  },
  {
    year: 1850, category: "war", title: "The Taiping Rebellion",
    blurb: "A failed civil-service candidate who believes he is the younger brother of Jesus leads a revolt against China's Qing dynasty. The fourteen-year war kills perhaps 20 to 30 million people, one of the deadliest conflicts in history.",
  },
  {
    year: 1859, category: "invention", title: "On the Origin of Species",
    blurb: "Charles Darwin argues that all life evolved by natural selection, joining everything above this line into a single story. His idea remains the foundation of modern biology.",
  },
  {
    year: 1861, category: "war", title: "The American Civil War",
    blurb: "Union and Confederacy fight over slavery. The war ends slavery in the United States and leaves more than 600,000 dead.",
  },
  {
    year: 1865, approx: true, category: "invention", title: "Germs Cause Disease",
    blurb: "Louis Pasteur shows that microbes cause fermentation and decay, and Joseph Lister uses the idea to disinfect wounds and surgical tools. Deaths after surgery plummet, and modern medicine begins.",
  },
  {
    year: 1868, category: "empire", title: "The Meiji Restoration",
    blurb: "Japan's shogunate falls and power returns to the emperor. Within a generation Japan builds railways, factories and a modern army, becoming the first industrial nation outside the West.",
  },
  {
    year: 1876, category: "invention", title: "The Telephone",
    blurb: "Alexander Graham Bell patents the telephone. A human voice can now travel along a wire. Within a few decades, cities are strung with telephone lines.",
  },
  {
    year: 1879, category: "invention", title: "The Electric Light",
    blurb: "Thomas Edison and Joseph Swan each develop practical light bulbs. Within a few years power stations are lighting city streets, and night will never be as dark again.",
  },
  {
    year: 1884, category: "empire", title: "The Scramble for Africa",
    blurb: "At the Berlin Conference, European powers agree rules for carving up Africa. No Africans are invited. By 1914 nearly the whole continent is colonized.",
  },
  {
    year: 1893, category: "empire", title: "Women Win the Vote",
    blurb: "New Zealand becomes the first self-governing country to give women the right to vote in national elections. Over the following century, women's suffrage spreads around the world.",
  },
  {
    year: 1903, category: "invention", title: "The First Powered Flight",
    blurb: "At Kitty Hawk, the Wright brothers' Flyer stays aloft for twelve seconds. Just 66 years later, humans will walk on the Moon.",
  },
  {
    year: 1905, category: "invention", title: "Relativity",
    blurb: "A 26-year-old patent clerk, Albert Einstein, shows that space and time are relative and that mass and energy are equivalent: E = mc². His ideas underpin GPS, nuclear power and our picture of the universe.",
  },
  {
    year: 1914, category: "war", title: "The First World War",
    blurb: "Industrialized warfare kills around 20 million soldiers and civilians and topples four empires. The bitter peace that follows helps set the stage for another war.",
  },
  {
    year: 1917, category: "empire", title: "The Russian Revolution",
    blurb: "The tsar falls and the Bolsheviks seize power, creating the world's first communist state. The Soviet Union it builds will last until 1991.",
  },
  {
    year: 1918, category: "disaster", title: "The 1918 Influenza",
    blurb: "A flu pandemic infects about a third of humanity and kills an estimated 50 million people, more than the First World War itself.",
  },
  {
    year: 1928, category: "invention", title: "Penicillin",
    blurb: "Alexander Fleming notices a mold killing the bacteria in a petri dish. It is the dawn of antibiotics. Mass-produced during the Second World War, they go on to save hundreds of millions of lives.",
  },
  {
    year: 1939, category: "war", title: "The Second World War",
    blurb: "The deadliest conflict in history. Some 70 to 85 million people die, including six million Jews murdered in the Holocaust. It ends with Europe and East Asia in ruins, the United Nations founded, and two superpowers facing off.",
  },
  {
    year: 1945, category: "war", title: "The Atomic Bomb",
    blurb: "The United States destroys Hiroshima and Nagasaki. By the end of the year well over 100,000 people have died in the two cities. Humanity now holds the power to end itself.",
  },
  {
    year: 1947, category: "migration", title: "The Partition of India",
    blurb: "British India splits into India and Pakistan. Some 15 million people are uprooted, in one of the largest migrations in history, and communal violence kills hundreds of thousands, perhaps far more.",
  },
  {
    year: 1947, category: "invention", title: "The Transistor",
    blurb: "At Bell Labs, three physicists build a tiny switch from a semiconductor crystal. Billions of them, etched onto silicon chips, will power every computer and phone.",
  },
  {
    year: 1948, category: "culture", title: "Universal Human Rights",
    blurb: "The new United Nations adopts the Universal Declaration of Human Rights, stating that all people are born free and equal in dignity and rights. It becomes one of the most translated documents in the world.",
  },
  {
    year: 1953, category: "invention", title: "The Double Helix",
    blurb: "Watson and Crick, drawing on Rosalind Franklin's X-ray images, describe the structure of DNA. Its shape shows how living things copy their genes, opening the way to modern genetics.",
  },
  {
    year: 1957, category: "invention", title: "Sputnik",
    blurb: "The Soviet Union launches the first artificial satellite, and the Space Race begins. Its beeping radio signal is picked up by listeners around the world.",
  },
  {
    year: 1958, category: "cosmic", title: "Measuring a Warming World",
    blurb: "Charles David Keeling begins measuring carbon dioxide on Hawaii's Mauna Loa. His steadily rising curve becomes key evidence that burning fossil fuels is changing Earth's climate.",
  },
  {
    year: 1959, category: "disaster", title: "The Great Chinese Famine",
    blurb: "Mao's Great Leap Forward forces peasants into communes and sets impossible grain quotas. In the famine that follows, an estimated 15 to 45 million people die.",
  },
  {
    year: 1960, category: "empire", title: "The Year of Africa",
    blurb: "Seventeen African nations win independence in a single year as the colonial empires crumble. Many inherit borders drawn by Europeans in Berlin.",
  },
  {
    year: 1969, category: "migration", title: "Footprints on the Moon",
    blurb: "Neil Armstrong and Buzz Aldrin of Apollo 11 become the first humans to walk on another world. Some 600 million people watch on television.",
  },
  {
    year: 1986, category: "disaster", title: "Chernobyl",
    blurb: "A reactor explodes in Soviet Ukraine in the worst nuclear accident in history. Radioactive fallout drifts across Europe, and the zone around the plant is still largely abandoned.",
  },
  {
    year: 1989, category: "empire", title: "The Berlin Wall Falls",
    blurb: "Crowds break open the wall dividing Berlin. Germany reunites the next year, and within two years the Soviet Union dissolves and the Cold War is over.",
  },
  {
    year: 1991, category: "invention", title: "The World Wide Web",
    blurb: "Tim Berners-Lee's web opens to the public, linking documents across the internet with a click. Within three decades, most of humanity is online.",
  },
  {
    year: 1994, category: "war", title: "The Rwandan Genocide",
    blurb: "In about 100 days, extremist Hutu militias and soldiers murder hundreds of thousands of people, most of them Tutsi, while the world looks away. It is one of the fastest mass killings in history.",
  },
  {
    year: 2001, category: "war", title: "September 11",
    blurb: "Hijacked airliners strike New York and Washington, killing nearly 3,000 people. The attacks set off two decades of war in Afghanistan and Iraq.",
  },
  {
    year: 2004, category: "disaster", title: "The Indian Ocean Tsunami",
    blurb: "A magnitude 9.1 earthquake off Sumatra sends waves across an entire ocean, killing about 230,000 people in fourteen countries. There was no ocean-wide warning system; one exists now.",
  },
  {
    year: 2020, category: "disaster", title: "COVID-19",
    blurb: "A new coronavirus spreads worldwide, killing millions and shutting down much of daily life. Vaccines are developed in under a year, faster than ever before.",
  },
  {
    year: 2022, category: "invention", title: "Generative AI",
    blurb: "Chatbots built on large language models are released to the public and reach hundreds of millions of people within months. They can write, translate, summarize and answer questions in plain language.",
  },
];

// ── Eras ─────────────────────────────────────────────────────────────────────
// Section headings along the spine. Each is drawn just above its `before`
// event (or the next visible event after it, when categories are filtered).

export interface Era {
  name: string;
  span: string;
  text: string;
  before: string;
}

export const ERAS: Era[] = [
  {
    name: "The Hadean Eon", span: "4.54 – 4 billion years ago", before: "the-earth-takes-shape",
    text: "Named for Hades, the Greek underworld: a molten, meteor-battered world whose earliest rocks have almost all been destroyed.",
  },
  {
    name: "The Archean Eon", span: "4 – 2.5 billion years ago", before: "the-first-signs-of-life",
    text: "The first continents form and life appears, but only as single cells in seas without oxygen.",
  },
  {
    name: "The Proterozoic Eon", span: "2.5 billion – 539 million years ago", before: "the-great-oxidation",
    text: "Oxygen fills the air, cells grow complex, ice sometimes grips the whole planet, and the first animals appear.",
  },
  {
    name: "The Paleozoic Era", span: "539 – 252 million years ago", before: "the-cambrian-explosion",
    text: "The era of 'ancient life': animals fill the seas, then plants, insects and four-legged creatures conquer the land.",
  },
  {
    name: "The Mesozoic Era", span: "252 – 66 million years ago", before: "the-first-dinosaurs",
    text: "The age of reptiles. Dinosaurs rule the land while mammals, birds and flowers quietly appear.",
  },
  {
    name: "The Cenozoic Era", span: "66 million years ago – today", before: "india-hits-asia",
    text: "The age of mammals. The climate cools, grasslands spread, and apes, eventually including us, evolve in Africa.",
  },
  {
    name: "The Ice Age World", span: "2.58 million – 11,700 years ago", before: "the-ice-ages-begin",
    text: "Ice sheets advance and retreat again and again while the human family evolves, spreads and dwindles to a single species: us.",
  },
  {
    name: "The Holocene", span: "11,700 years ago – today", before: "gobekli-tepe",
    text: "A warm, stable climate settles in, and people around the world begin to farm, settle and build.",
  },
  {
    name: "The First Civilizations", span: "c. 3300 – 800 BCE", before: "the-bronze-age",
    text: "Bronze, writing, cities and kings appear along the great rivers of Mesopotamia, Egypt, India and China.",
  },
  {
    name: "The Classical World", span: "c. 800 BCE – 500 CE", before: "the-first-olympic-games",
    text: "Iron-age empires rise, and the philosophies and faiths that still guide billions of people take shape.",
  },
  {
    name: "The Post-Classical World", span: "c. 500 – 1500 CE", before: "the-plague-of-justinian",
    text: "Great faiths spread along trade routes, and Islamic, Chinese and Mongol empires knit Eurasia together.",
  },
  {
    name: "The Early Modern World", span: "c. 1500 – 1800 CE", before: "columbus-reaches-the-americas",
    text: "Ships link every continent for the first time, bringing new wealth, new ideas and immense suffering.",
  },
  {
    name: "The Industrial Age", span: "c. 1760 – 1914 CE", before: "the-steam-engine",
    text: "Coal, steam and electricity remake work and cities, and European empires reach across the globe.",
  },
  {
    name: "The Modern World", span: "1914 CE – today", before: "the-first-world-war",
    text: "World wars, the atom, the end of empires, and a planet wired together.",
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
  meanwhile: e.meanwhile,
  year: e.ago !== undefined ? NOW_YEAR - e.ago : e.year!,
  deep: e.ago !== undefined,
  approx: !!e.approx,
})).sort((a, b) => a.year - b.year);

for (const era of ERAS) {
  if (!EVENTS.some((e) => e.id === era.before)) {
    throw new Error(`Era "${era.name}" anchors to unknown event "${era.before}"`);
  }
}
