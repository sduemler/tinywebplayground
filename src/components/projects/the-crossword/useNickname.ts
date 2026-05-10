import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "./firebase";
import type { NicknameData } from "./types";

export function useNickname() {
  const [uid, setUid] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState<NicknameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        signInAnonymously(auth).catch((err) => setError(err.message));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "nicknames", uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setNicknameState({
            name: d.name,
            suffix: d.suffix,
            displayName: d.displayName,
            approved: d.approved,
            createdAt: d.createdAt?.toDate() ?? new Date(),
          });
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  const submitNickname = async (
    name: string,
  ): Promise<{ approved: boolean; displayName?: string; reason?: string }> => {
    try {
      const fn = httpsCallable(functions, "moderateName");
      const result = await fn({ name });
      return result.data as {
        approved: boolean;
        displayName?: string;
        reason?: string;
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set nickname";
      return { approved: false, reason: msg };
    }
  };

  return { uid, nickname, loading, error, submitNickname };
}
