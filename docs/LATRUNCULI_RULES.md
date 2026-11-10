# LATRUNCULI reconstruction rules

Ludus latrunculorum is known from literary references and archaeological game boards, but surviving
evidence does not establish one universally agreed set of rules. This app therefore presents a
playable, historically inspired reconstruction, not a claim that every rule below is certain or
uniform across antiquity.

## Selected rules in this app

- The battlefield is an 8-by-8 grid. Each army starts with sixteen pieces in two ranks at opposite
  ends; the red army moves first.
- A piece moves any number of clear squares horizontally or vertically. Pieces cannot jump over
  other pieces, move diagonally, or land on an occupied square.
- Captures use custodial (sandwich) capture. After each move, an adjacent enemy piece is captured
  when it is bracketed horizontally or vertically by the piece just moved and another friendly
  piece. A move can capture more than one enemy at once.
- Diagonal adjacency does not capture. A board edge does not substitute for the second friendly
  piece, so an enemy against the edge is not captured by a single friendly piece.
- A player wins by capturing all opposing pieces or leaving the opposing army without a legal move.
  A player may also resign, awarding the win to the opponent. A match still undecided after 200
  moves is a draw.
- State records the active player, remaining pieces, captures credited to each player, total moves,
  move history, active/completed status, winner, and local/computer game mode. Undo restores the
  preceding immutable state, including the board, capture totals, move history, and active player.
- Victory rules are stored in the game state so future variants can change them. Majority-capture
  victory is disabled in the default rules and is never inferred from capture totals.

## Computer opponent

The computer offers three strengths: Recruit (one-ply tactical play), Centurion (two-ply response
search), and General (deeper minimax with alpha-beta pruning, bounded by a search time limit).
Evaluation considers material, immediate custodial captures and threats, mobility, central control,
and orthogonal friendly formations. Search candidates and resulting moves come from the same
validated rules engine as human moves. Computer searches run in a Web Worker; a 700 ms presentation
delay gives the thinking indicator time to appear without blocking the interface.

## Capture implementation

Capture rules live separately from legal movement in `src/games/latrunculi/capture.ts`.
`getCapturedPieces` evaluates a proposed move without mutating the board, `detectCaptures` scans
the post-move position, and `removeCapturedPieces` applies all detected captures to a new board.
Movement validation and turn changes remain in the game rules engine.

The custodial-capture interpretation and 8-by-8 setup are explicit design choices for a consistent
digital game. Alternative reconstructions exist; the app should describe these as selected rules,
not definitive ancient rules.
