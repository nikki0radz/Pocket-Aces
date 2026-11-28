# Pocket Aces

Beginner-first poker lessons with Pip, plus a continuous broadcast companion.

## Watch with Pip (0.3.0)

Open **Watch** in the app. **Try practice** plays an explicitly labelled, authored
12-event hand automatically, with concrete explanations, optional device speech,
pause/stop controls and a running story. No OpenAI account or screen sharing is
needed for practice. It never pretends to analyse a real stream.

For a real stream, start **Share a game with Pip**. Desktop Chrome/Edge can share
a video tab, including its audio when available. The [Android test APK](https://pocket-aces.nikki0radz.chatgpt.site/downloads/Pocket-Aces-0.3.1.apk) adds Android's explicit app-sharing permission and a draggable Pip
overlay, with pause/stop buttons and a foreground notification. It shares pictures
only in this first Android prototype; broadcast audio transcription is supported
in desktop browsers when the selected source provides audio. Protected video or
audio remains protected. Only share content you are entitled to process.

Live mode collects changed table views, batches up to six chronological JPEGs,
and sends a bounded recent history and running state through the private server.
It follows meaningful changes automatically; questions are optional. Pip explains
unfamiliar terms immediately, reports uncertainty, and does not infer unseen
bets, winners, faces, financial profits or off-camera tournament results.

Each session stops after 30 minutes. Pause stops new analysis; Stop releases the
capture, timers and queued audio, and aborts the client request. Navigation away
also stops sharing. An already submitted provider request may finish. No scheduled
jobs, pre-generation or idle API activity are configured. Browser-owned speech
is optional. Session history stays in memory; only player-name and voice settings
are stored locally. Pocket Aces does not save a video or audio recording. API inputs
are subject to [OpenAI's retention policies](https://developers.openai.com/api/docs/guides/your-data).

## Design review mode (0.3.1)

The Design mode switch at the top freezes page interaction and motion. Tap a
place to add a note; pins reopen notes for editing or deletion. Notes persist in
browser storage across pages and reloads. Export JSON contains all notes, page
routes, readable target labels, selectors, tap positions and viewport sizes.
Screen captures, API credentials and query parameters are not included.

The Android build uses the system Save file picker for JSON exports; the browser
uses a normal download. Cancelling export retains every note. Turning off Design
mode restores the page and any practice game that it paused. The release is
signed with the original Pocket Aces certificate so it can update the first APK.
The APK loads the hosted app; it needs a connection for initial sign-in and load.

## Interactive Triton screenshot

Open **Watch → Your Triton screenshot** (or `#screenshot`). The supplied original
image is displayed with 88 responsive, labelled tap regions over every meaningful
part of the hand. Pip gives a short concrete explanation first, with optional
extra detail, arithmetic and device speech. Every occurrence of BB/SB/D can be
tapped repeatedly, including faded rows. Repeated taps never consume or disable
an explanation. Bigger text buttons and image zoom are available on phones.

The optional 17-step walkthrough follows the recorded action. Amounts distinguish
remaining chips, total bets, additional chips, rounded pot size and net gain.
It explains the uncalled final 75K and does not invent either player’s private
cards. This is authored teaching for the supplied screenshot, available offline
without OpenAI calls. The source image is preserved; only browser CSS crops out
phone/browser chrome for display. Explanations and geometry are in `triton-hand.js`.
Local development also offers `/__mobile` for a 390px-wide screenshot preview.

## OpenAI connection

The production host needs `OPENAI_API_KEY` as a **server-only secret**. Use the
OpenAI Developers connection and its API-key setup workflow; never put a key in
browser JavaScript, an APK, GitHub Pages, this repository or a chat message.
Optional model overrides are documented in `.env.example`. Default models are
`gpt-4.1-mini` for image interpretation and `gpt-4o-mini-transcribe` for shared
broadcast audio. Status requests do not call OpenAI; missing credentials block
live analysis with an honest connection message.

Live routes require the hosting platform's authenticated user identity,
same-origin access and an expiring, signed session token bound to that user.
Request size, frame order and bounded history are validated. Per-isolate request
limits supplement the private Site access boundary; these are not a distributed
billing cap. Configure a provider spending limit before real-stream testing.
No live OpenAI request has been tested until the account connection is configured.

## Run and test

Node 20+; no npm dependencies are required.

- `npm test` checks lessons, rewards, table rules, demo chip conservation, image
  validation, API identity, signed sessions and provider failure handling.
- `npm run check` checks JavaScript syntax.
- `npm run dev -- --port 3000` builds and serves a local preview. Local preview
  intentionally has no live provider credentials.
- `npm run build` builds a dependency-free Worker at `dist/server/index.js`,
  preserving all existing static lessons and assets. `.openai/hosting.json` retains
  the existing Pocket Aces Site identity and private audience.

GitHub Pages can still serve the root for lessons and practice. Live AI needs the
private server at https://pocket-aces.nikki0radz.chatgpt.site, not static Pages.

## Android test build

Set `ANDROID_JAR` and `ANDROID_BUILD_TOOLS` to official Android SDK 35 paths, then
run `python3 scripts/build-android.py`. It produces `downloads/Pocket-Aces-0.3.1.apk`.
The app targets Android 15, supports Android 8+, and loads the same private hosted
app, including its normal sign-in. Screen sharing needs its OpenAI connection.

The native bridge uses an origin-targeted WebMessagePort to the trusted main page,
not a JavaScript interface exposed to embedded video frames. No API keys are in
the APK. Android capture is a foreground service with explicit projection consent,
no restart on kill, no saved media, and an independent 30-minute stop. Signing
material is ignored by Git and backed up privately; retain it for installable
updates. Build/signature checks do not establish real-device behaviour. Test the
sign-in, overlay permission, YouTube capture and background callbacks on a phone.

## Existing learning app

Ten bite-sized lessons introduce cards, suits, rank order, pairs, shared/private
cards, actions and simple hand comparisons. Concepts must be taught and correctly
answered before progressing. First-time lesson completion earns a unique card;
replays and daily practice do not duplicate rewards. Progress and the card deck
remain local to this browser/device. The manual **Follow a table** guide is still
available under Learn. Learning content, dictionary and card collection work
offline after first load. Scheduled daily notifications remain a future feature.

Pip's original transparent mascot artwork is preserved. Main UI: `app.js`,
`styles.css`; continuous companion: `watch.js`, `watch.css`; shared rules and
teaching instructions: `watch-core.js`; private API: `worker/index.js`.
