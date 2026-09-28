# CLAUDE.md - White Matter Tracts Game

## What this is
A browser drag-and-drop drill that has students sort 10 cards (8 white-matter tracts plus 2 definitions) into Commissural vs Association, for medical and neuroscience students learning tract classification (per README). Live on GitHub Pages: https://royc4515.github.io/white-matter-tracts-game/

## Stack & layout
Vanilla HTML/CSS/JS, no build, no dependencies beyond two CDNs (Google Fonts Inter, canvas-confetti@1.6.0 via jsDelivr).
- `index.html` - live page; the 10 cards are hardcoded as `.item` divs with `data-answer`, `data-short`, `data-full`.
- `script.js` - all game logic: `STATE`/`UI` objects, Training (instant feedback) and Test (30/60/90s timer, lock, grade) modes.
- `style.css` - styling, one breakpoint at 768px.
- `white-matter-tracts-game.html` - older self-contained version (inline CSS/JS). Not linked from `index.html` or the README.

## Commands
- Run: open `index.html` in a browser (no server needed). Unverified here (no browser).
- Syntax check: `node --check script.js` - verified.
- No tests, no CI, no package manifest.

## Conventions (Roy's standing rules)
- Comments explain WHY, not what.
- Flag counterintuitive, load-bearing or past-bug-hiding lines with `// don't touch / <reason>` (`<!-- don't touch / <reason> -->` in HTML).
- Edge cases and input validation first; prefer clean structure, good naming, reuse.
- No em dashes in user-facing text or docs; use a plain hyphen. (Existing `data-full` labels like "CC – corpus callosum" use en dashes.)
- Secrets only via environment variables, never committed (there are none today).

## Neuroanatomy accuracy (repo rule)
- Any change to tract names, classifications, origins/terminations or functions must cite a source (textbook or paper) in the commit message or an adjacent comment.
- Fornix is keyed as `association` per the course teacher's key (see comment in `white-matter-tracts-game.html`). Many textbooks class it as a projection or limbic pathway. Do not "fix" it without Roy's decision.

## Gotchas
- `script.js` `setupEventListeners`: `checkBtn` is bound directly to `checkAnswersTest`, so the click Event arrives as the truthy `isTimeout` arg, `clearInterval` is skipped, and the timer keeps ticking after a manual check. Wrap it: `() => checkAnswersTest(false)`.
- Card count `10` is hardcoded in `checkAnswersTest` and `updateCheckBtn`. Adding or removing a card in `index.html` silently breaks scoring; derive it from `.item` count.
- `STATE.draggedItem` is never cleared after a drop, so a later foreign drop onto a zone moves the last-dragged card.
- Training mode: an already-correct card can be re-dragged and re-scored, inflating `totalTries`/`correctTries`.
- Uses the HTML5 Drag and Drop API only, no touch/pointer handlers; the README's mobile claim is unverified on touch devices.
- Two copies of the game logic: fixes to `script.js` do not reach `white-matter-tracts-game.html`. Decide whether to delete the legacy file before editing both.
