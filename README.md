# CNUR 130 Study Modules

Interactive study guide for CNUR 130 (Pathotherapeutics), Modules 1-4: chapters, practice quizzes, flip cards and learning-outcome tracking.

Open `index.html` in a browser, or visit the hosted site. Quiz progress is saved only in your own browser.

## Hosting on Netlify

`index.html` is the source: a self-extracting single file that also works on its own (GitHub Pages, or opened directly). On Netlify, `scripts/unbundle.mjs` runs as the build step and writes `dist/` with the page as plain HTML and content-hashed asset files, so it loads faster and repeat visits come from the browser cache.

1. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick `cedarrixshantz/cnur130-study-modules`.
2. Leave the build settings as they are; `netlify.toml` sets the build command and the `dist` publish directory.
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
- **Exam readiness** (Me → Exam readiness, card on Home): a score per module from accuracy and questions tried (learning-outcome ticks don't count), reduced after a week without practice.
- **Confidence rating**: optional Sure / Think so / Guessing buttons on chapter quizzes, check-yourself and NCLEX questions. Wrong "Sure" answers appear under Confidently wrong on Weak spots; Exam readiness shows how often each level is right; lucky guesses count half toward readiness.
- **Knowledge map** (Progress → Knowledge map): an Obsidian-style graph of chapters, key terms and drugs. Drag to pan, scroll to zoom, click a node to open it, and filter by name. A Grid view shows every chapter as a tile shaded by mastery.
- **Letter grades**: quizzes, chapters, modules and Exam readiness show a TMU letter grade (A+ at 90% and above, down to F below 50%).
- **Difficulty labels** (`netlify/functions/qstats.mjs`): the first attempt at each question is recorded anonymously, and questions show Easy / Medium / Hard and "N% of the class got this right" once enough classmates have answered. NCLEX practice can be filtered by difficulty.
- **Select all that apply** (NCLEX → Select all that apply): 24 SATA questions scored NCLEX-style (+1 for each right pick, −1 for each wrong pick, never below 0).
- **Why not the others**: every chapter quiz, check-yourself and NCLEX question explains each wrong option. Distractors were rewritten so the correct answer is no longer the obviously longest one.
- **Shuffled options**: answer options are shuffled once per question (the same order for everyone, so duels and live games match), so the correct answer is spread across A–D instead of mostly B. True/false questions and questions with options like "B and C" or "Both" keep their order. Answers saved before the shuffle are converted automatically.
- **Points**: learning-outcome ticks no longer earn points (or count toward readiness and mastery); they're just a personal checklist.
- **Drug card binder** (Games → Drug Games → Drug card binder): 33 collectible cards built from the Drug review tables, in four rarities. Packs are earned every 5 correct answers; a specific card can be won by answering a question about it.
- **Heart sound trainer** (Practice → Head-to-Toe → Heart sounds): normal S1/S2, S3, S4, three murmurs and a friction rub, generated in the browser with Web Audio, with a learn mode and a quiz.
- **Hints**: every chapter quiz, check-yourself, NCLEX practice, select-all-that-apply and Objective coach question in Modules 1–4 has a **Hint** button with a short clinical nudge that never names or rules out an option. Hints are stored as `hint` on each question (existing ones in `hintData()`, keyed by question id), so a new question only needs a `hint` field. Hinted answers still count toward Exam readiness, but an Objective coach objective is only mastered when both Apply scenarios are answered without a hint (they show a “Hint used” tag). Hint use is saved with the rest of your progress.
- **Objective coach** (Module 4 → Objective path, and a **Learn it →** button beside every Module 4 learning outcome): each objective has Teach (explanation, key points, diagram, “On the unit”, exam trap, memory hook, page references), Check (recall questions), Apply (clinical scenarios: multiple choice, select all that apply, matrix) and an optional Explain it back. Getting every Check and Apply question right masters the objective; reviews come due after 1, 3 and 7 days, and a missed review drops it back to Learning. Mastered objectives count toward Exam readiness for modules that have coach content (40% accuracy, 30% questions tried, 30% objectives mastered; review due counts half). Content lives in `coachData()` keyed by outcome id, so other modules can be added as data only.

## Navigation and settings

- Every chapter has its own address (`#/module/chapter`), so Back/Forward work and links can be shared.
- Search: Ctrl K or `/` anywhere, across chapters (including their text), glossary terms and drugs.
- Practice and Games open on All practice / All games overview pages; the Me tab is now Progress.
- Settings (header button): Light/Dark/Night, sound, notifications (All / Quiet / Off), focus mode, PRN on/off, projector mode, the tour and What's new.
- First-time visitors get a five-step tour; returning visitors see What's new once per release (`WN_VER` in the page code).
- Answer feedback is the same everywhere: blue with ✓ for the right answer, strikethrough with ✗ for a wrong pick.
- Exam readiness and the knowledge map count only accuracy and questions tried, not ticked learning objectives.

## Icons

The colour icons come from the "Pathotherapeutics Icons" design (Claude Design). The full library, 456 icons in 45 sets, is saved as separate SVG files in `design/icons/<set>/` for future use. The site embeds only the ones it uses (in `pico()`), and they are used for:
- section tabs, hub cards and chapter headers
- the header (search, badges, dark mode, sound)
- notifications and "Report a problem"
- difficulty tags
- correct/incorrect verdicts
- the favicon

Also:
- answer letters A–D become tiles, with ✓/✗ shown as correct/incorrect icons, across every quiz and game (`[data-mk]` spans keep the text for screen readers)
- the warm-up is True or false, with pill buttons, and true/false check-yourself questions use the same pills
- outcomes use checkbox icons, and sidebar chapters show not started / in progress / completed
- each chapter header has its own icon (organs, conditions, ECG and so on), and drug cards show their drug-class label
- home stats, the timed exam and heart-sound play/stop have icons
- PRN is the retro buddy, and its face follows what's happening: correct, wrong, star-struck on a streak, error on a flatline, loading, thinking, sleeping at night and so on

In dark mode the page is colour-inverted, so icons get a counter-filter (`svg[data-ico]`) to keep their real colours.

## Look and feel

The site matches the icon set:
- a blue gradient background that fades into white, with a light grain texture
- dark navy text and blue gradient buttons and highlights
- Bricolage Grotesque headings and DM Mono labels
- rounded cards and pill buttons, soft shadows and light outlines
- each module's colour on the selected tab and chapter (Module 1 blue, 2 pink, 3 green, 4 purple)

This is a stylesheet layer (the `--paper`, `--ink`, `--acc` tokens) that restyles the existing inline styles by matching their colours, so canvases, diagrams and icons are untouched. Dark mode has its own palette: navy with blue accents, or warm brown with amber for Night. Diagrams, picture cards and the knowledge graph sit on light panels so they stay readable.

Also:
- Exam readiness shows a letter-grade badge when the grade is exactly A+, A, B, C, D or F.
- Duel, live game and report errors show an offline or error icon.
- PRN's busy messages show a loading icon.

## Avatars, games and sharing

- **Avatars** use the character icons, with a gradient background circle and an optional corner badge. The Wardrobe (Progress → My profile) offers 19 characters, 10 backgrounds and 9 badges, some unlocked by points, streaks or chapters. Old avatars convert automatically: the old hairstyle picks the closest nurse character.
- **Knowledge graph** chapter and module dots show their icons.
- **PRN's monitor** is a rounded navy-to-blue screen with a glowing trace.
- **Link previews:** the page title is "CNUR 130 · Pathotherapeutics Study". `public/` holds `og.jpg` (the share image), the home-screen icons and a web manifest; the build copies them into `dist/` and adds the description, Open Graph and Twitter tags to the page head.
- **Full screen:** figures, concept maps, step-through diagrams and the knowledge graph have an Expand button (bottom right). Close or Esc returns to the page.
- **Bookmarks:** hover any section in a chapter and tap the ☆ on its left (top right on narrow screens).
- **Highlights and notes:** select text in a chapter to highlight it in yellow, green, pink or blue, or to add a ✎ note. Notes show as cards under the paragraph and can be edited in place. Selecting highlighted text again offers Remove.
- Both are listed under Progress → Bookmarks & notes, with a link back to the spot. They're saved with your progress and drawn with the CSS Custom Highlight API, which doesn't change the page text.
- **PRN is chattier:** it reacts to more answers, checks in every minute or so while you study (pearls, mnemonics, time on task, tips), comments on new section headings, and reacts to bookmarks, highlights and notes. It stays quiet when notifications are reduced, in focus mode or when presenting.
- **Glossary tooltips:** glossary terms in chapter text show their definition on hover (tap on phones), with "Open in glossary →" to jump to the term.
- **Related games:** every Module 1–4 chapter ends with practice cards: NCLEX filtered to that chapter's topic, Patho games, Drug games, that module's Jeopardy board, a duel on that module, and Flashcards.
- **Key terms per chapter:** the terms defined in the chapter plus other glossary terms its text uses, preferring the same module, up to 16. On wide screens they're in the "In the margin" rail (click a term to expand its definition); on narrower screens they're chips under the chapter intro with hover tooltips. Glossary tooltips also appear in learning outcomes, definitions and notes.

## Where it's hosted

- **Netlify:** https://cnur130.netlify.app, built from `dist/` with the Netlify Functions for class stats, duels, live games and reports.
- **GitHub Pages:** https://cedarrixshantz.github.io/cnur130-study-modules/, serves the repo's `index.html` as is.

Features that need the Netlify Functions (class leaderboard and stats, duels, live games, problem reports, difficulty labels) only work on the Netlify address.
