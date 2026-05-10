# The Crossword — Firebase Setup Guide

Everything the front-end needs is already built and committed. This guide walks you through creating the Firebase project, connecting it to the app, seeding the puzzle data, and deploying.

---

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed globally:
  ```bash
  npm install -g firebase-tools
  ```
- A Google account

---

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it (e.g., `the-crossword`) — this becomes your project ID
4. Disable Google Analytics (not needed) or enable it — your call
5. Click **Create project**

---

## 2. Enable Required Firebase Services

### Firestore Database

1. In the Firebase Console sidebar, click **Build > Firestore Database**
2. Click **Create database**
3. Choose a location close to your expected users (e.g., `us-central1` for North America, `europe-west1` for Europe)
4. Start in **Production mode** (our security rules will be deployed in a later step)
5. Click **Enable**

### Authentication

1. In the sidebar, click **Build > Authentication**
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Enable **Anonymous** sign-in (click it, toggle the switch on, click **Save**)

### Cloud Functions

Cloud Functions requires the **Blaze (pay-as-you-go)** plan. For a small project like this, you'll stay well within the free tier limits (2M invocations/month, 400K GB-seconds/month).

1. In the bottom-left of the Firebase Console, click **Upgrade** on the Spark plan
2. Link a billing account (you won't be charged unless you exceed the free tier)

---

## 3. Get Your Firebase Config Values

1. In the Firebase Console, click the **gear icon** (top-left) > **Project settings**
2. Scroll down to **Your apps** section
3. Click the **web icon** (`</>`) to add a web app
4. Give it a nickname (e.g., `the-crossword-web`)
5. Don't check "Firebase Hosting" — we're deploying on Netlify
6. Click **Register app**
7. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "the-crossword.firebaseapp.com",
  projectId: "the-crossword",
  storageBucket: "the-crossword.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Copy these values — you'll need them in the next step.

---

## 4. Set Environment Variables

### Local Development

Create a `.env` file in the project root (it's already in `.gitignore`):

```bash
# In the project root directory
cp .env.example .env
```

Edit `.env` and fill in the Firebase values from step 3:

```
PUBLIC_FIREBASE_API_KEY=AIzaSy...
PUBLIC_FIREBASE_AUTH_DOMAIN=the-crossword.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=the-crossword
PUBLIC_FIREBASE_STORAGE_BUCKET=the-crossword.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

The `PUBLIC_` prefix is required — Astro uses it to expose variables to client-side code.

### Netlify (Production)

1. Go to your Netlify site dashboard
2. Click **Site configuration > Environment variables**
3. Add each of the six `PUBLIC_FIREBASE_*` variables with their values
4. Trigger a new deploy (or it'll pick them up on the next push)

---

## 5. Connect Firebase CLI to Your Project

```bash
firebase login
```

Then update the project alias in `firebase/.firebaserc` to match your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

Verify the connection:

```bash
cd firebase
firebase projects:list
```

You should see your project in the list.

---

## 6. Deploy Firestore Security Rules

From the `firebase/` directory:

```bash
cd firebase
firebase deploy --only firestore:rules
```

This deploys the rules that make all puzzle data read-only for clients and restrict writes to Cloud Functions only. Nicknames are readable only by the owning user.

---

## 7. Install and Deploy Cloud Functions

```bash
cd firebase/functions
npm install
cd ..
firebase deploy --only functions
```

This builds and deploys two Cloud Functions:
- **`solveClue`** — validates answers, locks cells, unlocks adjacent clues, writes solve history (all in an atomic transaction)
- **`moderateName`** — validates nicknames using `bad-words` filter, generates unique `name#1234` suffix, rate-limits to 60s between changes

The first deploy may take 1-2 minutes. You'll see the function URLs in the output.

---

## 8. Generate a Service Account Key (for Seeding)

The seed script uses the Firebase Admin SDK and needs a service account key.

1. In the Firebase Console, click **gear icon > Project settings > Service accounts**
2. Click **Generate new private key**
3. Save the downloaded JSON file somewhere safe (e.g., `~/keys/the-crossword-sa.json`)
4. **Never commit this file to git**

---

## 9. Seed the Puzzle Data

The puzzle layout is already built at `src/data/the-crossword/puzzle.json` (1,000 clues on a 141x148 grid). The seed script needs `firebase-admin` which is in the functions directory — install it temporarily for the root context:

```bash
# From the project root
npm install --no-save firebase-admin
```

Then run the seed script:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/Code/.keys/the-crossword-680f8-firebase-adminsdk-fbsvc-cf923c6a06.json
node scripts/seed-firestore.mjs
```

You should see output like:

```
Seeding puzzle "puzzle-001" with 1000 entries...
  Meta document written
  Entry batch 1 committed (500 entries)
  Final entry batch committed (1000 total)
  Cell batch 1 committed
  ...
  Final cell batch committed (XXXX total cells)

Done! Puzzle "puzzle-001" seeded with:
  1000 entries
  XXXX cells
  Start entry: 883A
```

To use a different puzzle ID (if you want to run multiple puzzles), pass it as an argument:

```bash
node scripts/seed-firestore.mjs puzzle-002
```

If you change the puzzle ID, also update the `PUZZLE_ID` constant in `src/components/projects/the-crossword/TheCrossword.tsx` (line 20).

### Verify in Firebase Console

1. Go to **Firestore Database** in the Firebase Console
2. You should see:
   - `puzzles/puzzle-001` — meta document with `gridWidth: 141`, `gridHeight: 148`, `solveCount: 0`, `totalEntries: 1000`
   - `puzzles/puzzle-001/entries/` — 1,000 entry documents
   - `puzzles/puzzle-001/cells/` — individual cell documents
3. Check that entry `883A` has `unlocked: true` (the starting clue)
4. All other entries should have `unlocked: false`

---

## 10. Test Locally

```bash
# From the project root
npm run dev
```

Navigate to `http://localhost:4321/projects/the-crossword`

You should see:
- A canvas grid centered on the starting clue
- Pan (drag) and zoom (scroll wheel / pinch) working
- Clicking the starting clue shows the CluePanel at the bottom
- The toolbar shows "0 solved" and the view toggle + timelapse button
- Typing an answer and clicking "Check" calls the `solveClue` Cloud Function

### Testing the Solve Flow

1. Click the highlighted starting clue cell
2. The CluePanel appears with the clue text and an input field
3. Type the correct answer and click **Check**
4. If you haven't set a nickname yet, the NicknameModal appears first
5. On correct answer: the cells lock (turn tan), 2 adjacent clues unlock, solve counter increments
6. On wrong answer: cells flash red, input disabled for 3 seconds
7. Open a second browser window — solves should appear in real-time

### Testing the Timelapse

1. Click the play button icon in the toolbar (next to the view toggle)
2. A mini player appears in the top-right showing solve progression
3. Use play/pause, scrubber, and speed controls (1x to 25x)

---

## 11. Add the Hub Card Image

Create or place a `.webp` image (recommended 400x260px) at:

```
public/images/projects/the-crossword.webp
```

This is the thumbnail shown on the home page project grid.

---

## 12. Go Live

Once you've tested locally and everything works:

1. Push your code (the `.env` file won't be committed)
2. Make sure Netlify has the `PUBLIC_FIREBASE_*` environment variables set (step 4)
3. The site will build and deploy automatically
4. Change the project status from `"wip"` to `"live"` in `src/data/projects.ts` when ready

---

## Firestore Data Model Reference

| Collection | Document | Fields |
|---|---|---|
| `puzzles/{puzzleId}` | Meta | `gridWidth`, `gridHeight`, `centerRow`, `centerCol`, `solveCount`, `totalEntries`, `isComplete`, `startedAt`, `completedAt` |
| `puzzles/{puzzleId}/entries/{entryId}` | Entry | `word`, `clue`, `direction`, `row`, `col`, `length`, `unlocked`, `solvedBy`, `solvedAt`, `solveSequence`, `adjacentEntryIds[]` |
| `puzzles/{puzzleId}/cells/{row_col}` | Cell | `letter`, `locked`, `acrossEntryId`, `downEntryId` |
| `puzzles/{puzzleId}/solveHistory/{autoId}` | Solve log | `entryId`, `solverName`, `solverUid`, `timestamp`, `solveSequence`, `unlockedEntryIds[]` |
| `nicknames/{uid}` | Nickname | `name`, `suffix`, `displayName`, `approved`, `createdAt` |

---

## Resetting the Puzzle

If you need to start the puzzle over (clear all solves):

1. In the Firebase Console, delete the `puzzles/puzzle-001` document and all its subcollections
2. Delete all documents in the `nicknames` collection
3. Re-run the seed script:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=~/keys/the-crossword-sa.json
   node scripts/seed-firestore.mjs
   ```

---

## Cost Estimate

On the Firebase Blaze plan free tier:

| Resource | Free Tier | This Project |
|---|---|---|
| Firestore reads | 50K/day | ~1,000 on seed + real-time listeners |
| Firestore writes | 20K/day | 1 per solve (transaction) |
| Cloud Function invocations | 2M/month | 1 per solve + 1 per nickname |
| Cloud Function compute | 400K GB-s/month | Minimal (each call < 1s) |
| Authentication | 10K anonymous users/month | 1 per unique visitor |

A puzzle with 1,000 clues and hundreds of players will stay comfortably within the free tier.
