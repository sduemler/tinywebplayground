export interface RollResult {
  input: string;
  result: number;
  breakdown: string;
}

type Token =
  | { type: "num"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function rollDice(numDice: number, numSides: number): number {
  if (numDice <= 0 || numSides <= 0) {
    throw new Error("Dice counts and sides must be positive");
  }
  if (numDice > 1000 || numSides > 1000) {
    throw new Error("Dice values too large (max 1000)");
  }
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * numSides) + 1;
  }
  return total;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < expr.length && expr[j] >= "0" && expr[j] <= "9") j++;
      if (j < expr.length && expr[j] === ".") {
        j++;
        while (j < expr.length && expr[j] >= "0" && expr[j] <= "9") j++;
      }
      tokens.push({ type: "num", value: parseFloat(expr.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

function evaluate(tokens: Token[]): number {
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseExpr = (): number => {
    let left = parseTerm();
    while (pos < tokens.length) {
      const t = peek();
      if (t.type === "op" && (t.value === "+" || t.value === "-")) {
        consume();
        const right = parseTerm();
        left = t.value === "+" ? left + right : left - right;
      } else break;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parseFactor();
    while (pos < tokens.length) {
      const t = peek();
      if (t.type === "op" && (t.value === "*" || t.value === "/")) {
        consume();
        const right = parseFactor();
        if (t.value === "*") {
          left = left * right;
        } else {
          if (right === 0) throw new Error("Division by zero");
          left = left / right;
        }
      } else break;
    }
    return left;
  };

  const parseFactor = (): number => {
    const t = peek();
    if (!t) throw new Error("Unexpected end of expression");
    if (t.type === "op" && (t.value === "+" || t.value === "-")) {
      consume();
      const v = parseFactor();
      return t.value === "-" ? -v : v;
    }
    if (t.type === "num") {
      consume();
      return t.value;
    }
    if (t.type === "lparen") {
      consume();
      const v = parseExpr();
      const next = peek();
      if (!next || next.type !== "rparen") throw new Error("Missing )");
      consume();
      return v;
    }
    throw new Error("Unexpected token");
  };

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("Unexpected trailing input");
  return result;
}

export function parseDiceRoll(input: string): RollResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty expression");

  const diceRegex = /(\d+)d(\d+)/gi;
  const rolls = new Map<string, number>();
  let expression = trimmed;

  let match: RegExpExecArray | null;
  while ((match = diceRegex.exec(trimmed)) !== null) {
    const notation = match[0].toLowerCase();
    if (!rolls.has(notation)) {
      const numDice = parseInt(match[1], 10);
      const numSides = parseInt(match[2], 10);
      rolls.set(notation, rollDice(numDice, numSides));
    }
  }

  for (const [notation, value] of rolls) {
    expression = expression.replace(
      new RegExp(notation, "gi"),
      value.toString(),
    );
  }

  const tokens = tokenize(expression);
  const result = evaluate(tokens);

  const breakdown =
    rolls.size > 0
      ? `(${Array.from(rolls.entries())
          .map(([dice, value]) => `${dice} = ${value}`)
          .join(", ")})`
      : "";

  return { input: trimmed, result, breakdown };
}
