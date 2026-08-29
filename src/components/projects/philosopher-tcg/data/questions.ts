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
  "Interesting. Wrong, probably, but interesting.",
  "I've read fortune cookies with more rigor.",
  "Somewhere, Kant just sighed.",
  "That's certainly… a sequence of words.",
  "The unexamined life might've been the safer call here.",
  "Groundbreaking. Alert the academies.",
  "I'll file that under 'attempts.'",
  "Your barista has stronger takes.",
  "A for effort. C-minus for everything else.",
  "The grimoire has seen worse. Not much worse, but worse.",
  "Truly the shower thought of a generation.",
  "Diogenes lived in a barrel and still had better takes.",
  "I'd debate you, but it feels unsporting.",
  "Hot take: lukewarm at best.",
  "You typed that with such confidence, too.",
  "Ah yes, the philosophy of vibes.",
  "Plato wrote dialogues. You wrote… this.",
  "Let's hope your enemies never read this paragraph.",
  "The Oracle at Delphi would like a word. Several, actually.",
  "I've seen margin doodles with more thesis.",
  "Somewhere a philosophy department just felt a chill.",
  "Descartes doubted everything. Start with this.",
  "The Stoics teach acceptance of what cannot be changed. Like this answer.",
  "Bold of you to write that where the grimoire can read it.",
  "Every word of that was legible. That's something.",
  "Nietzsche stared into the abyss. The abyss showed him this.",
];

export const GENUINE_REMARKS: string[] = [
  "…Huh. That one actually stopped me for a moment. Well said.",
  "Genuinely thoughtful. The grimoire keeps a page for answers like this.",
  "Now that is an examined life. Socrates would have bought you a drink.",
  "A careful mind at work. This one deserved the ink.",
  "You didn't just answer — you actually thought. It shows.",
];
