// Typing Terror — curated escalating passages.
//
// Each set is three excerpts from a SINGLE public-domain book (all pre-1931,
// firmly in the US public domain), chosen to escalate:
//   tier 1 — innocuous, calm, with a faint wrongness
//   tier 2 — the strange has arrived
//   tier 3 — very weird / full horror
//
// Text is normalized to clean ASCII (straight quotes, " -- " for em-dashes,
// single spaces) so it stays comfortable to type. Sources verified against the
// Project Gutenberg editions noted by `gutenbergId`.

export interface TypingPrompt {
  tier: 1 | 2 | 3;
  text: string;
}

export interface TypingSet {
  id: string;
  book: string;
  author: string;
  year: number;
  gutenbergId: number;
  prompts: [TypingPrompt, TypingPrompt, TypingPrompt];
}

export const sets: TypingSet[] = [
  {
    id: "the-metamorphosis",
    book: "The Metamorphosis",
    author: "Franz Kafka",
    year: 1915,
    gutenbergId: 5200,
    prompts: [
      {
        tier: 1,
        text: "His room, a proper human room although a little too small, lay peacefully between its four familiar walls. Above the table there hung a picture that he had recently cut out of an illustrated magazine and housed in a nice, gilded frame.",
      },
      {
        tier: 2,
        text: "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and could see his brown belly, slightly domed and divided by arches into stiff sections.",
      },
      {
        tier: 3,
        text: "He got into the habit of crawling up and down the walls and ceiling. He was especially fond of hanging from the ceiling; up there, relaxed and almost happy, it might happen that he would surprise even himself by letting go and landing on the floor with a crash.",
      },
    ],
  },
  {
    id: "the-willows",
    book: "The Willows",
    author: "Algernon Blackwood",
    year: 1907,
    gutenbergId: 11438,
    prompts: [
      {
        tier: 1,
        text: "After leaving Vienna, and long before you come to Budapest, the Danube enters a region of singular loneliness and desolation, where its waters spread away on all sides regardless of a main channel, and the country becomes a swamp for miles upon miles.",
      },
      {
        tier: 2,
        text: "Upon the borders of an alien world, a world where we were intruders, a world where we were not wanted or invited to remain -- where we ran grave risks perhaps; the feeling refused to yield its meaning, yet it would not be denied.",
      },
      {
        tier: 3,
        text: "It was a region not far removed from our own world in one sense, yet wholly different in kind, where great things go on unceasingly, where immense and terrible personalities hurry by, intent on vast purposes beside which our own affairs are dust.",
      },
    ],
  },
  {
    id: "the-yellow-wallpaper",
    book: "The Yellow Wallpaper",
    author: "Charlotte Perkins Gilman",
    year: 1892,
    gutenbergId: 1952,
    prompts: [
      {
        tier: 1,
        text: "It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer. A colonial mansion, a hereditary estate, I would say a haunted house. Still I will proudly declare that there is something queer about it.",
      },
      {
        tier: 2,
        text: "The color is repellent, almost revolting; a smouldering, unclean yellow, strangely faded by the slow-turning sunlight. It is a dull yet lurid orange in some places, a sickly sulphur tint in others. No wonder the children hated it.",
      },
      {
        tier: 3,
        text: "I always lock the door when I creep by daylight. I have got out at last, in spite of you and Jane! And I have pulled off most of the paper, so you can't put me back! Now why should that man have fainted? But he did.",
      },
    ],
  },
  {
    id: "the-fall-of-the-house-of-usher",
    book: "The Fall of the House of Usher",
    author: "Edgar Allan Poe",
    year: 1839,
    gutenbergId: 932,
    prompts: [
      {
        tier: 1,
        text: "During the whole of a dull, dark, and soundless day in the autumn of the year, when the clouds hung oppressively low in the heavens, I had been passing alone, on horseback, through a singularly dreary tract of country.",
      },
      {
        tier: 2,
        text: "About the whole mansion and domain there hung an atmosphere which had no affinity with the air of heaven, but which had reeked up from the decayed trees, and the grey wall, and the silent tarn -- a pestilent and mystic vapour, dull and leaden-hued.",
      },
      {
        tier: 3,
        text: "Madman! here he sprang furiously to his feet, and shrieked out his syllables, as if in the effort he were giving up his soul -- Madman! I tell you that she now stands without the door!",
      },
    ],
  },
  {
    id: "dracula",
    book: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    gutenbergId: 345,
    prompts: [
      {
        tier: 1,
        text: "3 May. Bistritz. Left Munich at 8:35 P.M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train.",
      },
      {
        tier: 2,
        text: "I explored further; doors, doors, doors everywhere, and all locked and bolted. In no place save from the windows in the castle walls is there an available exit. The castle is a veritable prison, and I am a prisoner!",
      },
      {
        tier: 3,
        text: "I saw the whole man slowly emerge from the window and begin to crawl down the castle wall over that dreadful abyss, face down, with his cloak spreading out around him like great wings. I saw the fingers and toes grasp the corners of the stones.",
      },
    ],
  },
  {
    id: "frankenstein",
    book: "Frankenstein",
    author: "Mary Shelley",
    year: 1818,
    gutenbergId: 84,
    prompts: [
      {
        tier: 1,
        text: "It was the secrets of heaven and earth that I desired to learn; and whether it was the outward substance of things or the inner spirit of nature and the mysterious soul of man that occupied me, still my inquiries were directed to the metaphysical.",
      },
      {
        tier: 2,
        text: "It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing at my feet.",
      },
      {
        tier: 3,
        text: "His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; but these luxuriances only formed a more horrid contrast with his watery eyes, his shrivelled complexion and straight black lips.",
      },
    ],
  },
  {
    id: "the-repairer-of-reputations",
    book: "The Repairer of Reputations",
    author: "Robert W. Chambers",
    year: 1895,
    gutenbergId: 8492,
    prompts: [
      {
        tier: 1,
        text: "Toward the end of the year 1920 the Government of the United States had practically completed the programme adopted during the last months of President Winthrop's administration. The country was apparently tranquil.",
      },
      {
        tier: 2,
        text: "The safe opens and I lift, from its velvet crown, a diadem of purest gold, blazing with diamonds. I do this every day, and yet the joy of at last touching again the diadem only seems to increase as the days pass. It is a diadem fit for a King among kings.",
      },
      {
        tier: 3,
        text: "Trembling, I put the diadem from my head and wiped my forehead, but I thought of Hastur and of my own rightful ambition, and I remembered Mr. Wilde as I had last left him, his face all torn and bloody from the claws of that devil's creature.",
      },
    ],
  },
  {
    id: "the-great-god-pan",
    book: "The Great God Pan",
    author: "Arthur Machen",
    year: 1894,
    gutenbergId: 389,
    prompts: [
      {
        tier: 1,
        text: "I have devoted myself to transcendental medicine for the last twenty years. It is a slight lesion in the grey matter, that is all; a trifling rearrangement of certain cells, a microscopical alteration that would escape ninety-nine brain specialists out of a hundred.",
      },
      {
        tier: 2,
        text: "She was lying wide-awake, rolling her head from side to side, and grinning vacantly. It is a great pity, said the doctor, still quite cool; she is a hopeless idiot. However, it could not be helped; and, after all, she has seen the Great God Pan.",
      },
      {
        tier: 3,
        text: "I saw the form waver from sex to sex, dividing itself from itself, and then again reunited. Then I saw the body descend to the beasts whence it ascended, even to the abyss of all being. The principle of life remained, while the outward form changed.",
      },
    ],
  },
  {
    id: "carmilla",
    book: "Carmilla",
    author: "Sheridan Le Fanu",
    year: 1872,
    gutenbergId: 10007,
    prompts: [
      {
        tier: 1,
        text: "Nothing can be more picturesque or solitary. It stands on a slight eminence in a forest. The road, very old and narrow, passes in front of its drawbridge. Over all this the schloss shows its many-windowed front, its towers, and its Gothic chapel.",
      },
      {
        tier: 2,
        text: "Gazing in my face with languid and burning eyes, she breathed so fast that her dress rose and fell with the tumultuous respiration. It was like the ardour of a lover; it embarrassed me; it was hateful and yet overpowering.",
      },
      {
        tier: 3,
        text: "I was wakened by a sensation as if two needles ran into my breast very deep at the same moment, and I cried loudly. The lady started back, with her eyes fixed on me, and then slipped down upon the floor, and, as I thought, hid herself under the bed.",
      },
    ],
  },
  {
    id: "the-colour-out-of-space",
    book: "The Colour Out of Space",
    author: "H. P. Lovecraft",
    year: 1927,
    gutenbergId: 68236,
    prompts: [
      {
        tier: 1,
        text: "West of Arkham the hills rise wild, and there are valleys with deep woods that no axe has ever cut. There are dark narrow glens where the trees slope fantastically, and where thin brooklets trickle without ever having caught the glint of sunlight.",
      },
      {
        tier: 2,
        text: "It was only by analogy that they called it colour at all. Its texture was glossy, and upon tapping it appeared to promise both brittleness and hollowness. One of the professors gave it a smart blow with a hammer, and it burst with a nervous little pop.",
      },
      {
        tier: 3,
        text: "It was just a colour out of space -- a frightful messenger from unformed realms of infinity beyond all Nature as we know it; from realms whose mere existence stuns the brain and numbs us with the black extra-cosmic gulfs it throws open before our frenzied eyes.",
      },
    ],
  },
];
