# Changelog

## [Homepage squirrel] — 2026-08-29

Preview only. Not deployed to production (songbai.li / Netlify).

### Added
- Optional homepage squirrel mascot (`companion.js` + `mascot/`)
- Header toggle: Squirrel / Squirrel off
- Pixel-art poses, nest, pine nut, glove cursor
- Modular vanilla ES modules (no bundler)

### Behavior
- Lives at the bottom of the viewport
- Walks and snacks on the ground
- Climbs only onto collected text lines, one vertical hop at a time
- No diagonal slides
- Rare short climbs (1–3 lines), occasional pine nut
- Idle nest-sleep, hover pet, drag with glove

## [Week 1 foundation] — 2026-08-28


Foundation only. No public wording changed. Not deployed to production.

### Added
- `styles.css` extracted from the homepage `<style>` block
- `h2.label` so section labels are real headings
- `:focus-visible` hairline treatment
- Skip-to-content link
- Twitter card tags, Person JSON-LD, theme-color
- `robots.txt` and homepage-only `sitemap.xml`
- On-brand `404.html`
- `favicon.svg`
- `netlify.toml` with 404 rewrite and nosniff

### Changed
- Homepage uses `/styles.css` instead of inline CSS
- Section labels are `<h2 class="label">` (visible text identical)

### Not in this change
- Writing archive
- Paper DOI
- Production deploy
