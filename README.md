# Pocket Aces

A mobile-friendly, beginner-first Texas Hold’em learning app, starring Pip the cat. First playable draft.

## Run

No installation or build required. Serve the repository root with `python3 -m http.server 3000`, then open http://localhost:3000. Run meaningful progression checks with `npm test` (Node 18+).

GitHub Pages can serve the root of `main` directly. All URLs are relative, so this works at `/Pocket-Aces/` and on a custom domain. `.nojekyll` prevents unnecessary Jekyll processing.

## Included

- Collect a unique card on each module’s first completion, with a Pip celebration and card reveal. My pocket → My deck shows all 52 slots and earned-card details. Existing completed modules receive their cards automatically. Replays and daily practice do not grant extra cards. The ten current modules award ten cards; future modules will make the remaining cards available. Collection derives from saved completion IDs, so reloads cannot duplicate rewards. Resetting progress also resets the deck.

- Ten bite-sized lessons: the deck, red suits, black suits, reading cards, rank order, pairs, private/shared cards, flop/turn/river, actions, and simple five-card hand comparisons.
- Explain first, test second. Every concept must be correctly answered to unlock the next lesson. Mistakes show explanations and switch to another example; other mastered concepts remain saved.
- Four original generated Pip expressions, integrated as a transparent CSS sprite sheet.
- A daily question drawn only from the current fully taught lesson. Completed topics are excluded. Before teaching, the learner is directed to the lesson; after the final lesson, the daily pool is empty. Daily practice does not skip lesson tests.
- Searchable dictionary, hand-ranking reference, optional replay of completed lessons, motion setting, and explicit reset confirmation.
- Versioned browser-local progress and offline assets via service worker. No account, analytics, ads, or real-money play.

## Deliberately not connected in this draft

The notification preview is a visual demonstration only. There are no scheduled notifications, Android overlay permission requests, background jobs or native APK yet. A future Android wrapper should call the same current-level question selector and refresh eligibility whenever progress changes. Scheduling and optional overlays need separate native implementation and explicit device permissions.

Pip’s hints are authored explanations, not live AI. Open-ended questions should later use a server-side OpenAI integration; never put an API key into static JavaScript or commit it. Friends’ mini-games are deferred.

## Files

`data.js`: lessons, question variants and dictionary. `engine.js`: progress, gating and daily selection. `app.js`: interface and interactions. `styles.css`: responsive design. `assets/pip-cat-expressions.png`: generated mascot sheet (happy/thinking/celebrate/surprised in a 2×2 grid). `tests/engine.test.mjs`: progression regression checks.

## Limits

Progress is only on the current browser/device and can be lost if browser storage is cleared. This is an introductory trail, not a complete poker strategy course. Individual rank comparisons are distinguished from full five-card hand comparisons. No automatic tournament/video interpretation is implemented.
