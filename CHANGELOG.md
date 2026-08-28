# Changelog

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
