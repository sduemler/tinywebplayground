import { useState, useRef, useEffect } from "react";
import { getRandomQuestions, getLiabilityResult } from "./questions";
import styles from "./WhoAreYou.module.css";

type Phase = "intro" | "questioning" | "thinking" | "result";

export default function WhoAreYou() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState(() => getRandomQuestions());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [fade, setFade] = useState<"in" | "out">("in");
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    if (phase === "questioning" && fade === "in") {
      inputRef.current?.focus();
    }
  }, [phase, fade, questionIndex]);

  function transitionToNext(didAnswer: boolean) {
    if (didAnswer) setAnsweredCount((c) => c + 1);
    setFade("out");

    setTimeout(() => {
      setAnswer("");
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
        setFade("in");
      } else {
        setPhase("thinking");
        setFade("in");
        setTimeout(() => {
          setFade("out");
          setTimeout(() => {
            setPhase("result");
            setFade("in");
          }, 500);
        }, 3000);
      }
    }, 500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    transitionToNext(true);
  }

  function handleSkip() {
    transitionToNext(false);
  }

  function handleRestart() {
    setFade("out");
    setTimeout(() => {
      setPhase("intro");
      setQuestions(getRandomQuestions());
      setQuestionIndex(0);
      setAnswer("");
      setAnsweredCount(0);
      setFade("in");
    }, 500);
  }

  const result = getLiabilityResult(answeredCount);

  return (
    <div className={styles.container}>
      {/* Character */}
      <div className={styles.characterArea}>
        <img
          src="/images/projects/droop-character.png"
          alt="Droop the Dog Detective"
          className={styles.characterImage}
        />
        <span className={styles.characterName}>Droop the Dog Detective</span>
      </div>

      {/* Content area */}
      <div className={styles.contentArea}>
        {/* Intro */}
        {phase === "intro" && (
          <div className={`${styles.panel} ${styles[fade]}`}>
            <div className={styles.speechBubble}>
              <p className={styles.introText}>
                Well, well, well... a new suspect! I'm <strong>Droop the Dog Detective</strong>, and I can figure out <em>exactly</em> who you are in just 10 questions.
              </p>
              <p className={styles.introSubtext}>
                Think I can't do it? Let's find out.
              </p>
            </div>
            <button className={styles.startButton} onClick={() => setPhase("questioning")}>
              I'm Ready, Detective
            </button>
          </div>
        )}

        {/* Questioning */}
        {phase === "questioning" && (
          <div className={`${styles.panel} ${styles[fade]}`}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className={styles.questionCount}>
              Question {questionIndex + 1} of {questions.length}
            </span>

            <div className={styles.speechBubble}>
              <p className={styles.questionText}>{currentQuestion.text}</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.answerForm}>
              <input
                ref={inputRef}
                type="text"
                className={styles.answerInput}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
              />
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!answer.trim()}
              >
                Answer
              </button>
            </form>

            <button className={styles.skipButton} onClick={handleSkip}>
              I'd rather not say...
            </button>
          </div>
        )}

        {/* Thinking */}
        {phase === "thinking" && (
          <div className={`${styles.panel} ${styles[fade]}`}>
            <div className={styles.speechBubble}>
              <p className={styles.thinkingText}>Hmm... let me analyze the evidence...</p>
            </div>
            <div className={styles.thinkingDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}

        {/* Result */}
        {phase === "result" && (
          <div className={`${styles.panel} ${styles[fade]}`}>
            <div className={styles.resultCard} style={{ borderColor: result.color }}>
              <span className={styles.resultEmoji}>{result.emoji}</span>
              <h2 className={styles.resultTitle} style={{ color: result.color }}>
                {result.title}
              </h2>
              <div className={styles.scoreMeter}>
                <div className={styles.scoreMeterTrack}>
                  <div
                    className={styles.scoreMeterFill}
                    style={{
                      width: `${(result.score / 10) * 100}%`,
                      backgroundColor: result.color,
                    }}
                  />
                </div>
                <span className={styles.scoreLabel}>
                  {result.score}/10 questions answered
                </span>
              </div>
              <p className={styles.resultDescription}>{result.description}</p>
              <button className={styles.startButton} onClick={handleRestart}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
