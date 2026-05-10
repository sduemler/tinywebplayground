import { useState } from "react";
import styles from "./NicknameModal.module.css";
import { useCrosswordStore } from "./store";

interface Props {
  onSubmit: (name: string) => Promise<{
    approved: boolean;
    displayName?: string;
    reason?: string;
  }>;
  onClose: () => void;
}

export default function NicknameModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setNickname = useCrosswordStore((s) => s.setNickname);
  const markNicknamePromptSeen = useCrosswordStore(
    (s) => s.markNicknamePromptSeen,
  );

  const isValid = /^[a-zA-Z0-9 ]{3,20}$/.test(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await onSubmit(name.trim());
    setSubmitting(false);

    if (result.approved && result.displayName) {
      setNickname(result.displayName);
      markNicknamePromptSeen();
      onClose();
    } else {
      setError(result.reason || "Name not approved. Try another.");
    }
  };

  const handleSkip = () => {
    markNicknamePromptSeen();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleSkip}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Choose a name</h2>
        <p className={styles.subtitle}>
          Your name appears on clues you solve. You can always change it later.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Enter a name"
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
          {name.length > 0 && (
            <div
              className={`${styles.hint} ${isValid ? styles.hintValid : styles.hintInvalid}`}
            >
              {isValid
                ? `You'll be ${name.trim()}#1234`
                : "3–20 characters, letters, numbers, and spaces only"}
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          <button
            type="submit"
            className={styles.submit}
            disabled={!isValid || submitting}
          >
            {submitting ? "Checking..." : "Set Name"}
          </button>
        </form>
        <button className={styles.skip} onClick={handleSkip}>
          Skip — play as Anonymous
        </button>
      </div>
    </div>
  );
}
