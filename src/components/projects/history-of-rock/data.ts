import type { Genre, Connection } from './types';

export const GENRES: Genre[] = [
  // Root genres (left side)
  { id: 'country', label: 'COUNTRY', artists: [], x: -550, y: -200 },
  { id: 'blues', label: 'BLUES', artists: [], x: -550, y: 200 },
  { id: 'jazz', label: 'JAZZ', artists: [], x: -550, y: 350 },

  // Early offshoots
  { id: 'folk', label: 'FOLK', artists: ['Kingston Trio', 'Joan Baez', 'Peter, Paul & Mary'], x: -380, y: -250 },
  { id: 'r-and-b', label: 'R&B', artists: ['Fats Domino', 'Little Richard', 'Chuck Berry', 'Ray Charles', 'Bo Diddley', 'Ike & Tina Turner'], x: -380, y: 100 },
  { id: 'doo-wop', label: 'DOO WOP', artists: ['The Platters', 'The Coasters', 'The Drifters', 'The Temptations'], x: -250, y: 200 },
  { id: 'rockabilly', label: 'ROCK A BILLY', artists: ['Carl Perkins', 'Gene Vincent', 'Elvis', 'Everly Brothers', 'Buddy Holly', 'Roy Orbison', 'Eddie Cochran'], x: -480, y: -50 },

  // Second wave
  { id: 'folk-rock', label: 'FOLK ROCK', artists: ['Van Morrison', 'Dave Mason', 'Creedence Clearwater Revival', 'Jackson Browne', 'Simon & Garfunkel', 'The Band'], x: -100, y: -280 },
  { id: 'brit-invasion', label: 'BRIT INVASION', artists: ['Beatles', 'Kinks', 'Rolling Stones', 'Animals', 'Yardbirds', 'Cream'], x: -100, y: -150 },
  { id: 'soul', label: 'SOUL', artists: ['Gladys Knight & The Pips', 'Otis Redding', 'Sam Cooke', 'Marvin Gaye', 'Stevie Wonder', 'Diana Ross', 'James Brown', 'Aretha Franklin', 'Isaac Hayes', 'Al Green', 'Sly & The Family Stone'], x: -100, y: 50 },

  // Middle column
  { id: 'pop-rock', label: 'POP ROCK', artists: ['Neil Young', 'Crosby, Stills & Nash', 'Byrds', 'The Go-Go\'s', 'Fleetwood Mac', 'Beach Boys', 'Kiss', 'Elton John', 'Neil Diamond', 'Bonnie Raitt', 'Ted Nugent', 'Grand Funk'], x: 100, y: -200 },
  { id: 'psychedelic-rock', label: 'PSYCHEDELIC ROCK', artists: ['The Doors', 'Jefferson Airplane', 'Grateful Dead', 'Velvet Underground', 'Janis Joplin', 'Iggy Pop'], x: 100, y: 50 },
  { id: 'southern-rock', label: 'SOUTHERN ROCK', artists: ['Dr. John', 'Allman Brothers', 'Lynyrd Skynyrd', 'ZZ Top', 'Ozark Mt. Daredevils', 'Black Oak Arkansas', 'Molly Hatchet', 'Little Feat'], x: 100, y: 200 },
  { id: 'funk', label: 'FUNK', artists: ['Parliament/Funkadelic', 'Confunktion', 'Prince', 'Isley Brothers', 'Rick James'], x: -50, y: 280 },
  { id: 'disco', label: 'DISCO', artists: ['Bee Gees', 'The Village People', 'Donna Summer', 'KC & The Sunshine Band'], x: 100, y: 350 },

  // Right-center column
  { id: 'hard-rock', label: 'HARD ROCK', artists: ['AC/DC', 'The Who', 'Led Zeppelin', 'Aerosmith', 'Deep Purple', 'Van Halen'], x: 300, y: -150 },
  { id: 'prog-rock', label: 'PROG ROCK', artists: ['Jethro Tull', 'Rush', 'ELO', 'Yes', 'Pink Floyd', 'Genesis', 'Residents', 'King Crimson'], x: 300, y: 50 },
  { id: 'glitter-glam', label: 'GLITTER/GLAM', artists: ['David Bowie', 'Alice Cooper', 'T Rex', 'Roxy Music'], x: 300, y: 200 },
  { id: 'unclassifiable', label: '?', artists: ['Zappa', 'Can', 'Capt. Beefheart'], x: 425, y: 125 },
  { id: 'rap', label: 'RAP', artists: ['Dr. Dre', 'The Geto Boys', 'Public Enemy', 'N.W.A.', 'LL Cool J', 'Run DMC'], x: 350, y: 390 },
  { id: 'hip-hop', label: 'HIP HOP', artists: ['Sugar Hill Gang', 'Salt-N-Pepa', 'Doug E. Fresh', 'Eric B', 'Boogie Down Productions', 'Beastie Boys', 'Ice T', 'Ice Cube', 'Snoop Dogg'], x: 350, y: 300 },

  // Far right column
  { id: 'new-wave', label: 'NEW WAVE', artists: ['Talking Heads', 'Pretenders', 'Eurythmics', 'Blondie', 'Elvis Costello', 'Devo', 'B-52\'s', 'Police'], x: 500, y: -300 },
  { id: 'grunge', label: 'GRUNGE', artists: ['Nirvana', 'Pearl Jam', 'Mudhoney', 'Sound Garden', 'Alice in Chains'], x: 500, y: -180 },
  { id: 'punk', label: 'PUNK', artists: ['Patti Smith', 'Buzzcocks', 'Richard Hell', 'Siouxsie and The Banshees', 'Sex Pistols', 'Ramones', 'The Clash'], x: 500, y: -50 },
  { id: 'heavy-metal', label: 'HEAVY METAL', artists: ['Motorhead', 'Black Sabbath', 'Dio', 'Judas Priest', 'Iron Maiden', 'Metallica'], x: 650, y: -115 },
  { id: 'eighties', label: "80'S", artists: ['Dead Kennedys', 'The Replacements', 'Minutemen', 'Sonic Youth', 'Butthole Surfers', 'Husker Du', 'Meat Puppets', 'Fugazi'], x: 550, y: 50 },
];

export const CONNECTIONS: Connection[] = [
  { source: 'jazz', target: 'blues' },
  { source: 'blues', target: 'r-and-b' },
  { source: 'r-and-b', target: 'hard-rock' },
  { source: 'r-and-b', target: 'doo-wop' },
  { source: 'r-and-b', target: 'rockabilly' },
  { source: 'country', target: 'rockabilly' },
  { source: 'country', target: 'folk' },
  { source: 'folk', target: 'folk-rock', bridgeArtist: 'Bob Dylan' },
  { source: 'folk-rock', target: 'new-wave' },
  { source: 'new-wave', target: 'grunge' },
  { source: 'heavy-metal', target: 'grunge' },
  { source: 'heavy-metal', target: 'punk' },
  { source: 'punk', target: 'eighties' },
  { source: 'hard-rock', target: 'grunge' },
  { source: 'hard-rock', target: 'punk' },
  { source: 'hard-rock', target: 'new-wave' },
  { source: 'doo-wop', target: 'soul' },
  { source: 'doo-wop', target: 'funk' },
  { source: 'funk', target: 'disco' },
  { source: 'disco', target: 'rap' },
  { source: 'disco', target: 'hip-hop' },
  { source: 'soul', target: 'psychedelic-rock', bridgeArtist: 'Janis Joplin' },
  { source: 'psychedelic-rock', target: 'southern-rock' },
  { source: 'country', target: 'southern-rock' },
  { source: 'psychedelic-rock', target: 'glitter-glam' },
  { source: 'psychedelic-rock', target: 'prog-rock' },
  { source: 'prog-rock', target: 'unclassifiable' },
  { source: 'psychedelic-rock', target: 'hard-rock', bridgeArtist: 'Jimi Hendrix' },
  { source: 'rockabilly', target: 'brit-invasion' },
  { source: 'brit-invasion', target: 'folk-rock' },
  { source: 'brit-invasion', target: 'soul' },
  { source: 'brit-invasion', target: 'pop-rock' },
  { source: 'brit-invasion', target: 'hard-rock' },
  { source: 'pop-rock', target: 'hard-rock' },
  { source: 'pop-rock', target: 'new-wave', bridgeArtist: 'Talking Heads' },
];
