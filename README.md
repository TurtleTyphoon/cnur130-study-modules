# CNUR 130 Study Modules

Interactive study guide for CNUR 130 (Pathotherapeutics), Modules 1-4: chapters, practice quizzes, flip cards and learning-outcome tracking.

Open `index.html` in a browser, or visit the hosted site. Quiz progress is saved only in your own browser.

## Hosting on Netlify

The site is one static `index.html` with no build step; `netlify.toml` tells Netlify to publish the repo root.

1. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick `TurtleTyphoon/cnur130-study-modules`.
2. Leave the build command empty and the publish directory as `.` (both come from `netlify.toml`).
3. Deploy. Every push to `main` redeploys automatically.

## Class leaderboard

`netlify/functions/board.mjs` stores everyone's scores in Netlify Blobs, so the leaderboard and module champions show the whole class. It needs no setup beyond deploying on Netlify. Anyone with the link who makes a profile appears under their chosen nickname; guests don't. Each profile's row can only be changed from the browser that created it. On other hosts (GitHub Pages, opening the file directly) the leaderboard falls back to profiles on that device.

## Duels, live games and problem reports

- **Duel** (`netlify/functions/duel.mjs`): Games → Duel makes a 10-question NCLEX duel with a share link (`?duel=CODE`). Everyone who opens it plays the same questions; results show side by side.
- **Live Game** (`netlify/functions/room.mjs`): Games → Live Game. The host creates a room and puts it on a projector; players join with the 5-letter code (or `?live=CODE`) and answer on their own devices. Faster correct answers score more.
- **Report a problem** (`netlify/functions/report.mjs`): a link at the bottom of every page. To read reports, set a `REPORTS_KEY` environment variable in Netlify (Site configuration → Environment variables), redeploy, then open Me → Problem reports and enter that key.
- **Printable cheat sheets**: Review → Clinical Review → Printable cheat sheets prints every module's one-page sheet, each on its own page. Each module's own Cheat sheet chapter also has a print button.

## Study tools added later

- **Picture cards** (Review → Flashcards → Picture cards): ECG strips and physical findings drawn as SVG (edema grades, clubbing, RA and OA hand changes, pulse amplitude, lobar consolidation). Name each one, then read the key points.
- **Lab trends** (Practice → Simulations → Lab trends): seven patients whose labs change over three days, with a decision each day.
- **Class progress** (Me → Class progress, and a card on Home): class totals and a weekly shared goal. `board.mjs` records each player's totals at their first sync of the week (weeks start Monday, UTC); when the goal is met, everyone gets the Team effort flair.
- **Alerts**: pop-up notices when a classmate passes you, when a module title is within 50 points, when you win a title or unlock a flair, and when the class goal is reached. Each notice has a "Turn off these alerts" link.
- **Dark mode**: the header button cycles Light → Dark → Night (warm). It follows the device's dark setting until someone picks a mode.
- **Exam readiness** (Me → Exam readiness, card on Home): a score per module from accuracy, questions tried and outcomes ticked, reduced after a week without practice.
- **Confidence rating**: optional Sure / Think so / Guessing buttons on chapter quizzes, check-yourself and NCLEX questions. Wrong "Sure" answers appear under Confidently wrong on Weak spots; Exam readiness shows how often each level is right; lucky guesses count half toward readiness.
- **Knowledge map** (Me → Knowledge map): every chapter as a tile shaded by mastery.
- **Drug card binder** (Games → Drug Games → Drug card binder): 33 collectible cards built from the Drug review tables, in four rarities. Packs are earned every 5 correct answers; a specific card can be won by answering a question about it.
- **Heart sound trainer** (Practice → Head-to-Toe → Heart sounds): normal S1/S2, S3, S4, three murmurs and a friction rub, generated in the browser with Web Audio, with a learn mode and a quiz.

