export interface Question {
  id: number;
  text: string;
  placeholder: string;
}

const allQuestions: Question[] = [
  { id: 1, text: "What city were you born in?", placeholder: "e.g. Chicago, London, Tokyo..." },
  { id: 2, text: "What was the name of your first pet?", placeholder: "e.g. Buddy, Whiskers, Mr. Fluffington..." },
  { id: 3, text: "What is your mother's maiden name?", placeholder: "e.g. Smith, Garcia, Nakamura..." },
  { id: 4, text: "What street did you grow up on?", placeholder: "e.g. Oak Street, Elm Drive..." },
  { id: 5, text: "What was the name of your elementary school?", placeholder: "e.g. Lincoln Elementary..." },
  { id: 6, text: "What was the make of your first car?", placeholder: "e.g. Honda Civic, Ford Focus..." },
  { id: 7, text: "What is your favorite movie?", placeholder: "e.g. The Shawshank Redemption..." },
  { id: 8, text: "What is your father's middle name?", placeholder: "e.g. James, Robert, William..." },
  { id: 9, text: "What was the name of your childhood best friend?", placeholder: "e.g. Alex, Jamie, Sam..." },
  { id: 10, text: "What is your favorite sports team?", placeholder: "e.g. Lakers, Manchester United..." },
  { id: 11, text: "What is your oldest sibling's middle name?", placeholder: "e.g. Marie, Edward, Rose..." },
  { id: 12, text: "What was the name of your first employer?", placeholder: "e.g. McDonald's, Target..." },
  { id: 13, text: "What hospital were you born in?", placeholder: "e.g. St. Mary's, General Hospital..." },
  { id: 14, text: "What was your childhood nickname?", placeholder: "e.g. Ace, Bug, Peanut..." },
  { id: 15, text: "What is the name of the street your grandparents lived on?", placeholder: "e.g. Maple Avenue, Pine Road..." },
  { id: 16, text: "What was your high school mascot?", placeholder: "e.g. Eagles, Wildcats, Tigers..." },
  { id: 17, text: "What was the first concert you attended?", placeholder: "e.g. Taylor Swift, Coldplay..." },
  { id: 18, text: "What is the middle name of your youngest child?", placeholder: "e.g. Grace, Thomas, Lee..." },
  { id: 19, text: "What was the model of your first phone?", placeholder: "e.g. iPhone 4, Motorola Razr..." },
  { id: 20, text: "In what city did your parents meet?", placeholder: "e.g. New York, Austin, Dublin..." },
];

export function getRandomQuestions(count: number = 10): Question[] {
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export interface LiabilityResult {
  score: number;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

export function getLiabilityResult(answeredCount: number): LiabilityResult {
  if (answeredCount === 0) {
    return {
      score: 0,
      title: "UNHACKABLE FORTRESS",
      emoji: "🏰",
      description:
        "You didn't answer a single question. You are a digital ghost. The NSA has a poster of you on their wall that says 'RESPECT.' Droop is both impressed and slightly offended.",
      color: "#2d8e4a",
    };
  }
  if (answeredCount <= 2) {
    return {
      score: answeredCount,
      title: "CAUTIOUS CITIZEN",
      emoji: "🛡️",
      description:
        "You gave away almost nothing. Your passwords are probably safe, your identity is mostly intact, and Droop only has enough info to maybe guess your zodiac sign. Well played.",
      color: "#3a7e2d",
    };
  }
  if (answeredCount <= 4) {
    return {
      score: answeredCount,
      title: "SLIGHTLY LEAKY",
      emoji: "🚿",
      description:
        "You answered a few — enough for a determined attacker to start piecing things together. It's like leaving your window cracked open. Probably fine, but a clever raccoon could get in.",
      color: "#8e8a2d",
    };
  }
  if (answeredCount <= 6) {
    return {
      score: answeredCount,
      title: "SECURITY CONCERN",
      emoji: "⚠️",
      description:
        "Over half your common security questions, answered to a cartoon dog on the internet. Droop could probably reset at least two of your passwords right now. He won't. Probably.",
      color: "#c97b2e",
    };
  }
  if (answeredCount <= 8) {
    return {
      score: answeredCount,
      title: "WALKING DATA BREACH",
      emoji: "🚨",
      description:
        "You just handed a stranger on the internet most of the answers to your security questions. Droop is concerned FOR you. Please go change your passwords. All of them. Right now.",
      color: "#c94a2e",
    };
  }
  if (answeredCount === 9) {
    return {
      score: answeredCount,
      title: "IDENTITY CRISIS",
      emoji: "💀",
      description:
        "NINE out of ten! You gave a cartoon dog detective almost everything needed to steal your identity. Droop is drafting a strongly worded letter to your past self. Change every password you have. Yesterday.",
      color: "#8e2d2d",
    };
  }
  return {
    score: 10,
    title: "CONGRATULATIONS, YOU PLAYED YOURSELF",
    emoji: "🎭",
    description:
      "You answered ALL TEN common security questions to a random website. Droop didn't even need to be a good detective — you just... volunteered everything. Your digital life is an open book, and that book is on fire. Please, PLEASE go change your passwords and security questions immediately.",
    color: "#6e0000",
  };
}
