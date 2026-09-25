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
