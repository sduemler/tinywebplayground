import { useState, useRef, useEffect, useCallback } from "react";
import haikus from "./haikus.json";
import { thinkingMessages } from "./thinkingMessages";
import styles from "./HaikuGenerator.module.css";

interface Haiku {
  line1: string;
  line2: string;
  line3: string;
}

interface Message {
  type: "user" | "haiku";
  text: string;
  streaming?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HaikuGenerator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [haikuQueue, setHaikuQueue] = useState<Haiku[]>(() =>
    shuffleArray(haikus as Haiku[])
  );
  const [queueIndex, setQueueIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  function getNextHaiku(): Haiku {
    let idx = queueIndex;
    let queue = haikuQueue;

    if (idx >= queue.length) {
      queue = shuffleArray(haikus as Haiku[]);
      setHaikuQueue(queue);
      idx = 0;
    }

    const haiku = queue[idx];
    setQueueIndex(idx + 1);
    return haiku;
  }

  function getRandomThinkingMessage(): string {
    return thinkingMessages[
      Math.floor(Math.random() * thinkingMessages.length)
    ];
  }

  async function streamHaiku(haiku: Haiku) {
    const fullText = `${haiku.line1}\n${haiku.line2}\n${haiku.line3}`;
    const messageIndex =
      messages.length + 1; // +1 because user message was just added

    setMessages((prev) => [...prev, { type: "haiku", text: "", streaming: true }]);

    for (let i = 0; i <= fullText.length; i++) {
      await new Promise((r) => setTimeout(r, 35 + Math.random() * 30));
      const partial = fullText.slice(0, i);
      setMessages((prev) => {
        const updated = [...prev];
        const target = updated[messageIndex];
        if (target) {
          updated[messageIndex] = { ...target, text: partial };
        }
        return updated;
      });
    }

    setMessages((prev) => {
      const updated = [...prev];
      const target = updated[messageIndex];
      if (target) {
        updated[messageIndex] = { ...target, streaming: false };
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isThinking) return;

    setInput("");
    setMessages((prev) => [...prev, { type: "user", text: prompt }]);

    setIsThinking(true);
    setThinkingText(getRandomThinkingMessage());

    const thinkDuration = 2000 + Math.random() * 2000;

    // Cycle through 2-3 thinking messages
    const intervalId = setInterval(() => {
      setThinkingText(getRandomThinkingMessage());
    }, 1200);

    await new Promise((r) => setTimeout(r, thinkDuration));
    clearInterval(intervalId);
    setIsThinking(false);

    const haiku = getNextHaiku();
    await streamHaiku(haiku);

    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          H<span className={styles.ai}>AI</span>KU
        </h2>
        <p className={styles.description}>
          We've aggregated the world's strongest, most creative LLMs to provide
          thought provoking and insightful haikus about any subject you can
          imagine.
        </p>
        <p className={styles.instructions}>
          Type any topic, idea, or feeling below and press Enter. Our AI
          ensemble will craft a unique haiku just for you.
        </p>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a haiku about anything..."
            rows={1}
            disabled={isThinking}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!input.trim() || isThinking}
            aria-label="Send"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 10l7-7m0 0l7 7m-7-7v14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="rotate(90 10 10)"
              />
            </svg>
          </button>
        </div>
        <span className={styles.disclaimer}>
          Powered by HSM
        </span>
      </form>

      {/* Chat area */}
      <div className={styles.chatArea}>
        {messages.length === 0 && !isThinking && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>筆</span>
            <p>Your haiku awaits. Type a prompt to begin.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${
              msg.type === "user" ? styles.userMessage : styles.haikuMessage
            }`}
          >
            {msg.type === "haiku" && (
              <div className={styles.avatarBadge}>筆</div>
            )}
            <div
              className={
                msg.type === "user" ? styles.userBubble : styles.haikuBubble
              }
            >
              {msg.type === "haiku" ? (
                <pre className={styles.haikuText}>
                  {msg.text}
                  {msg.streaming && <span className={styles.cursor}>|</span>}
                </pre>
              ) : (
                <p className={styles.userText}>{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className={`${styles.message} ${styles.haikuMessage}`}>
            <div className={styles.avatarBadge}>筆</div>
            <div className={styles.thinkingBubble}>
              <span className={styles.thinkingText}>{thinkingText}</span>
              <div className={styles.thinkingDots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
