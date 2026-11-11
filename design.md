# Tally — Design

## Direction
Warm, editorial, calm productivity. Paper-like off-white canvas, deep ink type, one vivid tangerine accent. Feels like a well-made notebook, not a SaaS dashboard.

## Typography
- Display: **Fraunces** (serif, 500–700, slight optical size) — page titles, list names, big numbers.
- Body/UI: **Poppins** (400/500/600) — everything else.
- Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72. Line height 1.5 body, 1.05 display.
- Small caps-style labels: Poppins 11–12px, uppercase, letter-spacing 0.12em.

## Color (CSS vars in styles.css)
- `--paper` #F5F0E8 (background), `--paper-2` #EDE6DA (sunken), `--card` #FFFCF7
- `--ink` #1A1916 (text), `--ink-soft` #6B655B (muted), `--line` #DDD4C5
- `--tangerine` #FF5B1F (primary accent — CTAs, progress fill, focus)
- Status: To do `--ink-soft`, In progress `--tangerine`, Done `--moss` #2F6B4F
- Destructive #C2361B

## Layout
- Max width 1180px, generous 24–48px gutters.
- Dashboard: oversized serif greeting left, stats right; lists as stacked rows (not card grid) with inline progress lines.
- List page: two columns ≥1024px — todos (wide) + sticky side rail (collaborators, activity).
- Borders 1px `--line`; radius small (6–10px). Shadows minimal, offset "paper" shadow on raised items.

## Texture & motion
- Subtle SVG grain overlay on body; faint ruled-paper lines on landing hero.
- Page load: staggered fade-up (motion, 40ms steps). Progress bars animate width.
- Optimistic updates for status/progress/create/delete.

## Components
- Status pill: segmented 3-way control.
- Progress: thin 6px track with tangerine fill + range input overlay; % in tabular Fraunces.
- Avatars: initials circles, colors derived from name hash from a warm palette.
