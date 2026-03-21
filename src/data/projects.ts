export interface Project {
  slug: string;
  title: string;
  description: string;
  image: string;
  accentColor: string;
  status: 'live' | 'wip' | 'coming-soon';
  tags?: string[];
}

export const projects: Project[] = [
  {
    slug: 'color-mixer',
    title: 'Color Mixer',
    description: 'Blend colors together and copy the result.',
    image: '',
    accentColor: '#c97b2e',
    status: 'coming-soon',
  },
  {
    slug: 'word-timer',
    title: 'Word Timer',
    description: 'How many words can you type in 60 seconds?',
    image: '',
    accentColor: '#7b9e4a',
    status: 'wip',
  },
  {
    slug: 'noise-maker',
    title: 'Noise Maker',
    description: 'Generate ambient soundscapes in the browser.',
    image: '',
    accentColor: '#4a7eb5',
    status: 'coming-soon',
  },
  {
    slug: 'pixel-canvas',
    title: 'Pixel Canvas',
    description: 'Draw tiny pixel art with a click-to-paint grid.',
    image: '',
    accentColor: '#a05ca0',
    status: 'coming-soon',
  },
  {
    slug: 'dice-roller',
    title: 'Dice Roller',
    description: 'Roll any combination of dice with satisfying animations.',
    image: '',
    accentColor: '#b84c4c',
    status: 'live',
  },
];
