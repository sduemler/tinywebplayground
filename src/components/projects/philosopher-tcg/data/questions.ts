import { dayNumber } from "../lib/daily";

// Open-ended philosophical prompts for the bonus-pack reflection gate. There's
// no "correct" answer — writing a thoughtful response earns the bonus pack.
export const QUESTIONS: string[] = [
  "What does it mean to live a good life?",
  "Is it better to be feared or to be loved?",
  "Can an action ever be truly selfless?",
  "Do we have free will, or is everything determined?",
  "What makes you the same person you were ten years ago?",
  "Is it ever right to lie?",
  "What is the difference between knowledge and wisdom?",
  "Is happiness the purpose of life, or a byproduct of it?",
  "Do we owe anything to people we will never meet?",
  "Can something be beautiful if no one ever perceives it?",
  "Is a promise still binding when the circumstances change?",
  "What, if anything, do we owe future generations?",
  "Is justice the same thing as fairness?",
  "Would you choose a life of contentment over a life of truth?",
  "Is it possible to know anything with certainty?",
  "Does suffering give life meaning, or merely interrupt it?",
];

/** The prompt for today — stable through the day, rotates at local midnight. */
export function questionForToday(): string {
  return QUESTIONS[dayNumber() % QUESTIONS.length];
}

// The grimoire's reaction to a submitted reflection. Almost always snark —
// see QuestionGate for the 1-in-10 genuine-compliment roll (long answers only).
export const SNARKY_REMARKS: string[] = [
  "Huh. I guess everyone's entitled to their own opinion.",
  "Didn't know I was in a Philosophy 101 classroom today.",
  "Maybe just keep that one between you and me.",
  "Socrates died for this.",
  "Interesting.",
  "I've read fortune cookies with more rigor.",
  "Kant can't right now.",
  "The unexamined life might've been the safer call here.",
  "Groundbreaking. Alert the academies.",
  "Diogenes lived in a barrel and still had better takes.",
  "I've seen margin doodles with more thesis.",
  "Descartes doubted everything. Start with this.",
  "The Stoics teach acceptance of what cannot be changed. Like this answer.",
  "At least that was legible.",
  "Nietzsche stared into the abyss. It looked something like this.",
  "Maybe stick to watching the shadows in the cave bud",
  "What a plate o' poo",
  "Not sure if Euripides would have filed this under comedy or tragedy",
  "Wish this response had been lost in the Library of Alexandria",
  "Less Kierkegaard, more Kierkekardashian",
  "If this had dropped on Newton's head he would have discovered a drinking habit",
  "Two things can be true at once. You can write this and I can hate it.",
  "Looks like you put Descartes before the horse on this one",
  "Even Leibniz couldn't find anything positive to say about this."
];

export const GENUINE_REMARKS: string[] = [
  "As good as Christopher Nolan directing the shadows in the cave",
  "The Oracle at Delphi is looking for a replacement if you're available",
  "Grimoire's running out of room, but this one is worth it",
  "Rousseau is writing up the contract right now",
  "Copernicus was wrong, maybe the Earth revolves around this answer",
  "Even Hume would have been convinced by this thought."
];
