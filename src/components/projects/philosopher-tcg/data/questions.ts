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
