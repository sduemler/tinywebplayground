import type { TypingSet, TypingPrompt } from "@data/typing-terror/passages";

export type { TypingSet, TypingPrompt };

export type Screen = "start" | "typing" | "results";

/** Stats captured for a single completed prompt. */
export interface PromptStat {
  tier: 1 | 2 | 3;
  wpm: number;
  accuracy: number; // 0..100
  ms: number; // elapsed milliseconds
  correctChars: number; // final correctly-positioned characters
  totalKeystrokes: number; // character-producing keystrokes (excl. backspace)
  errors: number; // keystrokes that did not match the expected character
  chars: number; // length of the prompt
}
