# songbai.li

Source for Songbai Li's personal website.

Live site: https://songbai.li (Netlify). Vercel preview is separate.

## Stack

- HTML, CSS, and a small optional homepage mascot (vanilla ES modules)
- No build step
- Hosted on Netlify (`songbaili`). Preview on Vercel (`songbaili`).

## Local preview

```bash
python3 -m http.server 8742
```

Then open http://localhost:8742.

## Mascot

Optional pixel squirrel on the homepage. Toggle is **Squirrel** / **Squirrel off** in the header.

```
companion.js
mascot/
  squirrelMascot.js   # mountSquirrelMascot()
  assets.js
  branches.js         # text lines as climb perches
  motion.js           # axis-aligned hops only
  fsm.js
  nest.js
  input.js
  squirrelMascot.css
  art/
```

It stays on the ground. It only climbs onto real text lines (never diagonally, never through empty air). Preview only until production is approved.

## Deployment

Production is the Netlify project `songbaili`. Do not promote a preview without approval.
