# Sancadia — Classic Games Arcade

[![CI](https://github.com/Edrvdr/Sancadia3/actions/workflows/ci.yml/badge.svg)](https://github.com/Edrvdr/Sancadia3/actions/workflows/ci.yml)

A Vite, React and TypeScript arcade for classic board games.

## Development

```sh
npm ci
npm run dev
```

Useful scripts:

| Script                   | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `npm run check`          | Typecheck, lint, formatting check and unit tests |
| `npm run typecheck`      | TypeScript compiler                              |
| `npm run lint`           | ESLint                                           |
| `npm run format`         | Format project files with Prettier               |
| `npm run format:check`   | Check formatting without changing files          |
| `npm test`               | Run Vitest                                       |
| `npm test -- --coverage` | Run tests and generate coverage                  |
| `npm run build`          | Create the production app in `dist/`             |
| `npm run preview`        | Preview a production build locally               |

### Environment

Copy `.env.example` to `.env.local` and provide Supabase credentials to enable authentication. The
arcade and local game features work without those optional values.

## Project status

> Roadmap status last updated November 10, 2026.

### Recent implementation highlights

- Expanded the arcade to a full game catalog with board-game entries such as Latrunculi, Reversi, Checkers, Dots and Boxes, Mancala, Dominoes, Ludo, Snake and 2048.
- Added a global settings flow with persistent preferences, nation/theme selection, accessibility controls, PWA install actions, and reset-data tooling.
- Completed a full Latrunculi gameplay loop with local pass-and-play, computer AI, undo, resign handling, and move recording.
- Added run-of-show docs for settings compliance and the Latrunculi admin dashboard, including Supabase edge-function deployment guidance.
- Continued the Supabase work with migrations and admin/metrics support around profiles, game results, and published admin content.

### What has been done

- Set up the Vite + React + TypeScript arcade structure.
- Added/updated authentication context and session handling.
- Added game registry entries and puzzle/versus game support across the arcade.
- Fixed the codebreaker RNG generation bug that could stall unique-secret generation.
- Completed Phase 6: shared code-breaker gameplay, Mastermind, Bulls and Cows, Hangman, pass-and-play, keyboard and notes UX, puzzle points/stats, and documentation.
- Delivered key Phase 7 board-game and settings work: global per-game settings, nation and theme selection, install/reset UX, and completed Latrunculi game flow and admin docs.
- Verified `npm run check` and the focused Latrunculi test flow in the current branch.

### What still needs to be done

- Complete any remaining browser-level/manual QA checks after deployment or local preview.
- Confirm the end-to-end flow for authentication, save data, and game sessions in a live environment.
- Review remaining UX polish and accessibility items before release.
- Finish the remaining Supabase/Cloudflare backend security and deployment items.
- Finish any outstanding production or PWA validation tasks.

### Important note

> The prompt-driven implementation work is treated as effectively complete for the current branch, while the longer-term roadmap phases remain intentionally paused and should not be re-opened unless explicitly requested.

> The full end-to-end test work is still marked as pending and must be completed later. Do not assume the project is fully validated until that checklist is complete.

> Current local unit coverage is green, but the broader QA and deployment checklist still needs follow-up in the target environment.

## Holland prompt checklist

This section captures the Holland-specific prompt tasks from the attached game and rules PDFs and keeps them tracking alongside the paused roadmap phases.

- [x] Add Holland to the nations list and settings selector.
- [x] Review the Dutch classics set and map each title to the app's existing game patterns.
- [x] Implement Stratego in the app's UI and rules flow.
- [x] Implement Sjoelen (Dutch shuffleboard) with a matching board interaction and scoring flow.
- [x] Implement Ganzenbord (The Game of the Goose) with the goose bonuses and landing rules.
- [ ] Implement Mens Erger Je Niet with the race-and-capture loop and safe-zone logic.
- [ ] Implement Trictrac (Dutch Backgammon variant) with the board, move rules, and bearing-off flow.
- [ ] Implement Levensweg (The Game of Life - Dutch Edition) using the app's board-game conventions.
- [ ] Implement Dammen (Dutch draughts / international checkers) with mandatory captures and win detection.
- [ ] Implement Keezenspel (Keezen) using the card-driven race mechanic.
- [ ] Implement Pim Pam Pet with the themed trivia card interaction and scoring system.
- [ ] Implement Dutch Blitz with the rapid simultaneous card-laying UI and win conditions.
- [ ] Align each Holland game with the current application styling, controls, settings, and nation filtering.
- [ ] Validate each game against the arcade's accessibility, routing, and smoke-test expectations.

## Roadmap checklist

This roadmap is derived from the build-plan PDFs and the prompt sequence for the remaining arcade work. Use it as the delivery checklist for the next milestones.

### Phase 6 — Guessing games

- [x] Shared code-breaker core and 2-player handoff
- [x] Mastermind
- [x] Bulls and Cows
- [x] Hangman
- [x] Stats, points and docs

### Phase 7 — Supabase and game systems

- [x] Supabase migration and admin dashboard scaffolding
- [x] Game result and profile data flows for admin insights
- [x] Global settings persistence and UI polish
- [x] Latrunculi gameplay, AI and pass-device UX
- [ ] Client and anonymous auth flow
- [ ] Offline-first synced stats
- [ ] Leaderboards
- [ ] Privacy and abuse basics

### Phase 8 — Cloudflare

- [ ] Pages deployment config
- [ ] Score validation Worker
- [ ] Lock down the database
- [ ] Client integration and Turnstile
- [ ] Monitoring and rollback

### Phase 9 — Board game batch 2

- [x] Reversi
- [x] Checkers
- [x] Dots and Boxes
- [x] Mancala
- [x] Ludo
- [x] Latrunculi rules, AI and match flow
- [ ] Batch integration and docs

### Phase 10 — Hidden-information and chance games

- [ ] Hidden-information and chance core
- [ ] Battleships
- [ ] Dominoes
- [ ] Ludo
- [ ] Stats, points and backend integration

### Phase 11 — Arcade games

- [ ] Arcade core
- [ ] Snake
- [ ] 2048
- [ ] Minesweeper
- [ ] Scores, replay validation and anti-cheat

### Phase 12 — Engagement and economy

- [ ] Economy and shop backend
- [ ] Shop, themes and loadout screens
- [ ] Achievements
- [ ] Online match schema and multiplayer readiness
- [ ] Match Worker with server authority
- [ ] Online play client
- [ ] Online safety, ratings and moderation

### Phase 13 — Launch and release

- [ ] Automated end-to-end and visual testing
- [ ] Performance budgets and optimization
- [ ] Accessibility audit
- [ ] Analytics, monitoring and feedback
- [ ] Legal, privacy and content review
- [ ] Capacitor wrapping for app stores
- [ ] Release process and launch checklist

### Delivery order

1. Finish the remaining game-engine and game implementation prompts.
2. Close the Supabase/Cloudflare backend and security work.
3. Complete engagement, economy and social features.
4. Run release-grade QA and deployment checks.
5. Launch and monitor the production build.

### Project structure

- `src/engine/` — UI-independent game search and shared engine types.
- `src/games/<game>/rules.ts` — pure game rules and state transitions.
- `src/games/<game>/ai.ts` — game-specific AI evaluation and difficulty settings.
- `src/components/` — shared React components.
- `src/screens/` — route-level screens.
- `src/lib/` — persistence, settings, feedback and other application utilities.

Keep `rules.ts` files pure: no React, DOM, components, screens or hooks imports. Add rule tests
alongside each game's rules.

## Testing the PWA

Run `npm run build && npm run preview`, open the printed local URL in a supported browser, and use
Lighthouse's Progressive Web App checks. Confirm the app installs, then disable network access in
DevTools and navigate to the app and game routes. Service workers cache aggressively; use DevTools
→ Application → Update on reload or clear site data when validating a new build.

GitHub Pages is served from the `/Sancadia3/` project subpath, so the Vite base and PWA start URL
are configured for that path.
