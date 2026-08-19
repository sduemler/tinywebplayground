import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import Filter from "bad-words";

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const filter = new Filter();

const NAME_REGEX = /^[a-zA-Z0-9 ]{3,20}$/;

interface ModerateRequest {
  name: string;
}

export const moderateName = onCall({ invoker: "public" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { name } = request.data as ModerateRequest;
  const uid = request.auth.uid;

  if (!name || !NAME_REGEX.test(name)) {
    return {
      approved: false,
      reason: "Name must be 3-20 characters, letters, numbers, and spaces only",
    };
  }

  const trimmed = name.trim();
  const nickRef = db.doc(`nicknames/${uid}`);

  // The uniqueness check and the write share one transaction so two concurrent
  // requests can't both pass the dup check and mint the same displayName. All
  // reads (nick doc + dup queries) run before the single write.
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(nickRef);
    if (existing.exists) {
      const lastChange = existing.data()?.createdAt?.toDate();
      if (lastChange && Date.now() - lastChange.getTime() < 60000) {
        return { approved: false, reason: "Please wait before changing your name" };
      }
      if (existing.data()?.name === trimmed) {
        return { approved: true, displayName: existing.data()?.displayName };
      }
    }

    if (filter.isProfane(name)) {
      return { approved: false, reason: "Please choose an appropriate name" };
    }

    let suffix = 0;
    let displayName = "";
    let attempts = 0;
    do {
      suffix = Math.floor(1000 + Math.random() * 9000);
      displayName = `${trimmed}#${suffix}`;
      const dup = await tx.get(
        db
          .collection("nicknames")
          .where("displayName", "==", displayName)
          .limit(1),
      );
      if (dup.empty) break;
      attempts++;
    } while (attempts < 10);

    tx.set(nickRef, {
      name: trimmed,
      suffix,
      displayName,
      approved: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { approved: true, displayName };
  });
});
