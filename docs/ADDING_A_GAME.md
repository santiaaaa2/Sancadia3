# Adding a game

Use this checklist when adding a game:

1. Create `src/games/<id>/rules.ts` with the state, move types and a pure `GameEngine` implementation.
   Do not import React, DOM APIs, components, screens or hooks. Ensure every playthrough terminates,
   using a move cap or repetition rule if the position space permits cycles.
2. Add `src/games/<id>/ai.ts` with an evaluator, difficulty caps and a `chooseMove` function.
   Search must use `engine.currentPlayer(state)` to decide whether a position is maximizing or
   minimizing; a move can give the same player another turn. Include a focused extra-turn AI test.
3. Add `src/games/<id>/rules.test.ts` for wins, draws, illegal moves, immutability and special rules.
   Run `runEngineContract(engine)` from `src/engine/testing.ts` for new board engines; it checks
   initial-state legality, input immutability, terminal/winner consistency, and 200 random playouts.
   Add focused AI tests when move selection has game-specific behavior.
4. Create `<Game>Match.tsx` using `useEngineMatch`, `GameBoard`, `Scoreboard` and `GameOverDialog`;
   create `<Game>Game.tsx` to share `MatchFlow` and its pre-game setup.
5. Register the game's component and display metadata in `src/games/registry.ts`. Keep
   unimplemented games as `coming-soon` placeholders; do not change existing games' availability.
6. Register an available versus engine's state validator, engine, evaluation and difficulty caps in
   `src/games/aiRegistry.ts` so computer moves run in the Web Worker. Keep rules and nation metadata
   aligned with the registry; verify its AI and points coverage tests.
7. Lazy-load the game screen with `React.lazy`. Confirm the production PWA precaches emitted chunks
   and can open and play the game offline.
8. Give interactive cells descriptive accessible labels, visible keyboard focus and status updates.
   Use symbols as well as color to distinguish players, and test at a 360px viewport.
9. Run `npm run check` and `npm run build`.

## Custom search and hidden-information games

Use the optional `searchOverride` on a worker AI entry when the search does not fit the shared
two-player minimax implementation, such as Monte Carlo tree search. The override receives the
state, difficulty, time limit and an `AbortSignal`; long searches must yield to the worker event
loop periodically and check `signal.aborted` inside the search loop. Keep it in the existing
`ai.worker.ts` path so cancellation and legal-move verification remain consistent.

Use `HiddenGameEngine` when a game has more than two seats or needs an explicit player-specific
observation. It supports two to six players. An engine for a public-information multiplayer game
may return the full state from `observe`; hidden-information games must return only information
that player is allowed to see, and every AI must consume that observation rather than full state.
Add contract and information-leak tests before connecting the game to any UI or backend flow.

## Adding a puzzle game

Puzzle games do not use the minimax engine or `aiRegistry`.

1. Keep reusable game rules in a pure module under `src/games/<id>/`; test win, loss, invalid input,
   and restart behavior there.
2. Register the game with `type: 'puzzle'` and add its component to `gameComponents`.
3. Use the shared puzzle session and stats APIs so attempts, difficulty, points, and result
   de-duplication stay consistent. Do not record abandoned sessions.
4. For local pass-and-play secrets, collect the secret with `SecretEntry` and show
   `PassDeviceScreen` before revealing the next player's controls.
5. Bundle offline content such as word lists. Validate it in tests for duplicates, allowed
   characters, and difficulty constraints.
6. Make keyboard input, touch controls, feedback announcements, and result dialogs usable without
   relying on color alone. Verify the layout at 360px wide.
7. Add component tests and run `npm run check` and `npm run build`.

## Games with zoomable boards and stick dice

Use `ZoomableBoard` for boards whose cells become difficult to target at a 360px viewport.
Keep the turn banner, score, and action controls outside the pan area. Pass the game's `gameId`,
row and column counts, and board content; use the reported fit-cell size to enable tap-preview and
confirm when the cells are below 44px. The wrapper persists zoom per game, supports Fit and discrete
zoom levels, clamps panning, and disables page touch scrolling while the board is being manipulated.
For irregular boards, size the SVG to the wrapper's board area and provide generous, separately
labelled hit targets.

Use `rollSticks` from `src/engine/hidden/sticks.ts` for four independent two-sided sticks. Pass the
game's injected random-number generator; never call `Math.random()` from a rules module. Use
`stickProbabilities()` when an AI needs the binomial distribution for expectimax. Keep each game's
mapping from marked sides to movement, extra throws, and special-square effects in that game's
ruleset rather than in the shared helper.

Games based on incomplete historical evidence must carry a `reconstructionNote` in their registry
entry and show the `ReconstructedRulesBadge` in the game card. Keep reconstruction choices in the
game ruleset and distinguish them from known historical facts in the info dialog.
