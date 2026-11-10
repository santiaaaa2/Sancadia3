import type { Difficulty } from '@/engine/difficulty';

export type RulesGameId =
  | 'noughts-and-crosses'
  | 'connect-4'
  | 'gomoku'
  | 'reversi'
  | 'latrunculi'
  | 'stratego'
  | 'sjoelen'
  | 'ganzenbord'
  | 'seega'
  | 'egyptianmancala'
  | 'senet'
  | 'twentysquares'
  | 'houndsjackals'
  | 'mehen'
  | 'xiangqi'
  | 'go'
  | 'chinesecheckers'
  | 'luzhanqi'
  | 'mahjong'
  | 'checkers'
  | 'battleships'
  | 'mastermind'
  | 'bullscows'
  | 'hangman'
  | 'dots-and-boxes'
  | 'mancala'
  | 'dominoes'
  | 'ludo'
  | 'snake'
  | '2048'
  | 'minesweeper';

export interface GameRules {
  title: string;
  goal: string;
  setup: string;
  howToPlay: readonly string[];
  winning: string;
  specialRules: readonly string[];
  difficultyNotes: Readonly<Record<Difficulty, string>>;
  tips: readonly string[];
}

export const rulesContent = {
  seega: {
    title: 'Seega',
    goal: 'Capture all of your opponent’s stones or leave them unable to move.',
    setup: 'A 5-by-5 board with 12 stones per player is planned; the centre starts empty.',
    howToPlay: ['Place stones in the setup phase, then move and capture by sandwiching.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['The board is not playable yet.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  egyptianmancala: {
    title: 'Egyptian Mancala',
    goal: 'Finish with more captured pebbles than your opponent.',
    setup: 'Two rows of six pits without stores are planned; the game is not playable yet.',
    howToPlay: ['Pick up pebbles from one of your pits and sow them around the board.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['The board is not playable yet.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  senet: {
    title: 'Senet',
    goal: 'Race all five of your pieces off the board.',
    setup: 'A 30-square serpentine path is planned; this is a modern reconstruction.',
    howToPlay: ['Throw four two-sided sticks, then move a legal piece by the resulting count.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['Historical rules are incomplete; the reconstruction will be configurable.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  twentysquares: {
    title: 'The Game of 20 Squares',
    goal: 'Race all seven of your pieces along the route and bear them off.',
    setup: 'A shared 20-square route is planned; this is a modern reconstruction.',
    howToPlay: ['Throw four two-sided sticks, then move a legal piece by the resulting count.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['Historical rules are incomplete; the reconstruction will be configurable.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  houndsjackals: {
    title: 'Hounds and Jackals (58 Holes)',
    goal: 'Race all five of your pegs to the exit.',
    setup: 'A 58-hole board is planned; the chosen layout and shortcut rules need to be sourced.',
    howToPlay: ['Throw four two-sided sticks, then move a peg along its track.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['The reconstruction will be clearly labelled and configurable.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  mehen: {
    title: 'Mehen',
    goal: 'Move your marbles and lion along the coiled-snake track.',
    setup: 'A configurable coiled track is planned; this is a modern reconstruction.',
    howToPlay: ['Throw four two-sided sticks, then move one eligible piece.'],
    winning: 'The full rules and playable game are coming soon.',
    specialRules: ['Historical rules are not preserved; the reconstruction will be configurable.'],
    difficultyNotes: {
      beginner: 'Coming soon.',
      professional: 'Coming soon.',
      expert: 'Coming soon.',
    },
    tips: ['Check back when the game is released.'],
  },
  'noughts-and-crosses': {
    title: 'Noughts and Crosses',
    goal: 'Make a line of three of your marks before your opponent does.',
    setup: 'The game uses a 3-by-3 grid. One player is X and the other is O; X moves first.',
    howToPlay: [
      'Take turns choosing one empty square for your mark.',
      'Look for a move that makes your own line or stops your opponent from making one.',
      'The game ends as soon as a line is made or every square is filled.',
    ],
    winning:
      'Make three of your marks in a row horizontally, vertically, or diagonally. If the board fills with no line, the game is a draw.',
    specialRules: ['There are no captures, extra turns, or passes.'],
    difficultyNotes: {
      beginner: 'Learn to take a win when you see one and block an immediate threat.',
      professional: 'Create a fork: a move that threatens two different winning lines.',
      expert: 'Against perfect play, this game is a draw; avoid giving away a fork.',
    },
    tips: [
      'The centre square belongs to four possible lines.',
      'Check your opponent’s threats before choosing a square.',
    ],
  },
  'connect-4': {
    title: 'Connect 4',
    goal: 'Be the first player to connect four of your discs in a straight line.',
    setup:
      'Play on a 7-column by 6-row upright grid. Each player uses a different kind of disc; the first player drops a disc into any non-full column.',
    howToPlay: [
      'Choose a column that still has room.',
      'Drop one disc; it falls to the lowest empty space in that column.',
      'Take turns until a player connects four or the board is full.',
    ],
    winning:
      'Connect four discs horizontally, vertically, or diagonally. A full board with no four-in-a-row is a draw.',
    specialRules: ['Discs cannot be moved after they land.', 'You cannot play in a full column.'],
    difficultyNotes: {
      beginner: 'Look for immediate wins and block any line your opponent can finish next turn.',
      professional:
        'Plan around the support a disc gives to future moves; a winning space may need to be built from below.',
      expert: 'Count threats several turns ahead and avoid giving the opponent a winning reply.',
    },
    tips: [
      'The centre columns can connect to more possible lines.',
      'Before dropping a disc, check what new space it gives the other player.',
    ],
  },
  gomoku: {
    title: 'Gomoku',
    goal: 'Be the first player to place five stones in an unbroken straight line.',
    setup:
      'The game uses a 15-by-15 grid of intersections. Players take turns placing a stone on an empty intersection; opening near the centre is common.',
    howToPlay: [
      'Place one stone on any empty intersection.',
      'Take turns building your own lines while blocking the other player’s threats.',
      'Continue until someone makes five in a row or the board fills.',
    ],
    winning:
      'Make five consecutive stones horizontally, vertically, or diagonally. This version counts five or more in a row as a win; a full board without a line is a draw.',
    specialRules: ['Stones stay where they are placed; there are no captures or passes.'],
    difficultyNotes: {
      beginner: 'Make open lines and stop your opponent from reaching four in a row.',
      professional: 'Create two threats at once so one block cannot stop both.',
      expert: 'Evaluate both players’ open-ended threats before every placement.',
    },
    tips: [
      'Build from connected shapes instead of scattering stones.',
      'An open line with empty spaces at both ends is harder to block.',
    ],
  },
  xiangqi: {
    title: 'Xiangqi (Chinese Chess)',
    goal: 'Capture or trap the opposing general so the other side cannot make a legal move.',
    setup:
      'Play on a 9-by-10 board of intersections. Each side starts with 16 pieces; Red moves first. The river divides the two halves, and each general begins inside its own palace.',
    howToPlay: [
      'Take turns moving one piece along the board lines.',
      'The general moves one point orthogonally inside its palace; advisors move one point diagonally there.',
      'Elephants move two points diagonally on their own side of the river and cannot jump a blocked eye. Horses move two points along one axis and one across, but cannot jump a blocked leg.',
      'Chariots move any unobstructed distance orthogonally. Cannons move the same way, but must jump exactly one piece to capture.',
      'Soldiers move forward one point. After crossing the river, they may also move sideways, but never backward.',
      'Choose a move that keeps your general safe. The two generals may not face each other on an open file.',
    ],
    winning:
      'Checkmate the opposing general or leave the opposing side with no legal move. Stalemate is a loss, not a draw.',
    specialRules: [
      'A third occurrence of the same position is a draw unless one player has given check on every move in the repeated sequence; that player loses.',
      'The game is drawn after 60 complete moves without a capture (120 plies) or after 400 plies.',
    ],
    difficultyNotes: {
      beginner: 'Learn each piece’s movement, capture undefended pieces, and protect your general.',
      professional:
        'Coordinate chariots, cannons, and horses across the river while watching for checks.',
      expert:
        'Calculate forcing lines and repetition while preserving a safe route for your general.',
    },
    tips: [
      'Pieces occupy intersections, not the spaces between board lines.',
      'A cannon needs exactly one screen between it and a piece it captures.',
      'Keep the file between the two generals blocked unless you are ready for a flying-general capture.',
    ],
  },
  go: {
    title: 'Go (Weiqi)',
    goal: 'Finish with more surrounded territory than your opponent.',
    setup: 'A two-player board with selectable sizes is planned; this game is not playable yet.',
    howToPlay: ['Place one stone on an empty intersection, or pass.'],
    winning: 'The game is scored by territory and stones on the board.',
    specialRules: [
      'Groups with no liberties are captured; suicide and repeated positions are illegal.',
    ],
    difficultyNotes: {
      beginner: 'Build connected groups and avoid leaving stones without liberties.',
      professional: 'Balance territory, influence, and the safety of your groups.',
      expert: 'Use shape, timing, and life-and-death reading to maximize your score.',
    },
    tips: ['Corners and edges can be easier to surround than open center territory.'],
  },
  chinesecheckers: {
    title: 'Chinese Checkers (Tiaoqi)',
    goal: 'Move all of your marbles into the opposite triangle.',
    setup:
      'A six-pointed star board for two to six players is planned; this game is not playable yet.',
    howToPlay: ['Move one marble to a neighboring hole or hop over another marble.'],
    winning:
      'The first player to fill the opposite triangle wins; the remaining players can continue for ranking.',
    specialRules: ['A chain of hops is one move and can cross marbles belonging to any player.'],
    difficultyNotes: {
      beginner: 'Move marbles forward while keeping them close enough to help one another.',
      professional: 'Use long hop chains and avoid leaving a slow straggler behind.',
      expert: 'Plan routes through shared bridges while limiting your opponents’ best hops.',
    },
    tips: ['A friendly marble can be a useful stepping stone.'],
  },
  luzhanqi: {
    title: 'Lu Zhan Qi (Army Chess)',
    goal: 'Capture the opposing flag while protecting your own.',
    setup: 'A hidden-army setup and board are planned; this game is not playable yet.',
    howToPlay: ['Arrange your army, then move one eligible piece along the board paths.'],
    winning: 'Capture the opposing flag or leave the opposing army without a legal move.',
    specialRules: ['The referee resolves clashes; most enemy ranks remain hidden until revealed.'],
    difficultyNotes: {
      beginner: 'Keep your flag defended and use scouts to learn the enemy positions.',
      professional: 'Protect key paths and send engineers to investigate suspected mines.',
      expert: 'Track public clash information and reason about the remaining hidden ranks.',
    },
    tips: ['The pieces’ strength is hidden from the opponent.'],
  },
  mahjong: {
    title: 'Mahjong',
    goal: 'Complete a winning hand before the wall runs out.',
    setup:
      'A four-player, 136-tile Hong Kong-style ruleset is planned; this game is not playable yet.',
    howToPlay: ['Draw and discard tiles, and claim eligible discards to build a hand.'],
    winning: 'A standard hand uses four melds and a pair; several special hands are also planned.',
    specialRules: ['Claims have a priority order, and a kong draws a replacement tile.'],
    difficultyNotes: {
      beginner: 'Collect matching sets and sequences while keeping a pair.',
      professional: 'Use discards and exposed melds to evaluate hand potential.',
      expert: 'Balance tile efficiency, likely waits, fan value, and safety.',
    },
    tips: ['Keep track of visible discards when choosing a wait.'],
  },
  reversi: {
    title: 'Reversi',
    goal: 'Finish with more of your discs on the board than your opponent.',
    setup:
      'Use an 8-by-8 board. Four discs begin in the centre in an alternating square; a legal move must flip at least one opposing disc.',
    howToPlay: [
      'Place one disc on an empty square that brackets one or more opponent discs between it and another of your discs.',
      'Flip every bracketed opponent disc in all straight directions from the new disc.',
      'Take turns; if you have no legal move, pass your turn.',
    ],
    winning:
      'The game ends when neither player has a legal move. The player with more discs wins; equal counts are a draw.',
    specialRules: [
      'You must flip at least one disc to make a move.',
      'If you have no legal move, you must pass; you may not pass while a legal move exists.',
    ],
    difficultyNotes: {
      beginner: 'Try not to give away corners, since corner discs cannot be flipped.',
      professional: 'Think about which moves give your opponent access to the edges and corners.',
      expert: 'Disc count early in the game is less important than mobility and stable edges.',
    },
    tips: [
      'A legal move can flip discs in several directions at once.',
      'Corners are permanent once taken.',
    ],
  },
  checkers: {
    title: 'Checkers (American)',
    goal: 'Capture all opposing pieces or leave your opponent with no legal move.',
    setup:
      'Use an 8-by-8 board with pieces on the dark squares of the three rows nearest each player. Each player starts with 12 men; men move toward the far side.',
    howToPlay: [
      'On your turn, move one man diagonally forward to an empty adjacent dark square, unless a capture is available.',
      'To capture, jump diagonally over one adjacent opposing piece to the empty square immediately beyond it.',
      'Continue jumping with the same piece while another capture is available; otherwise the turn passes.',
      'A man reaching the far row becomes a king and can then move and jump diagonally forward or backward.',
    ],
    winning: 'Win by capturing every opposing piece or by leaving the opponent with no legal move.',
    specialRules: [
      'Captures are mandatory whenever any capture is available.',
      'If a capture leads to another jump with the same piece, you must continue.',
      'A man crowned during a capture ends its turn; it does not continue jumping as a king.',
    ],
    difficultyNotes: {
      beginner: 'Keep pieces protected and remember that a capture can be forced.',
      professional: 'Plan exchanges and multi-jumps while keeping a path open for promotion.',
      expert: 'Count forced capture sequences and avoid leaving a piece exposed after a move.',
    },
    tips: [
      'Kings can move in both diagonal directions.',
      'A piece on the back row cannot be jumped from behind by a man moving forward.',
    ],
  },
  latrunculi: {
    title: 'LATRUNCULI',
    goal: 'Outmaneuver the opposing army and capture its pieces by surrounding them.',
    setup:
      'Play on an 8-by-8 battlefield. Each army begins with sixteen stones arranged in two ranks at opposite ends; Player 1 moves first.',
    howToPlay: [
      'Select one of your stones, then choose any empty square along the same row or column.',
      'A stone cannot pass through another stone.',
      'After a move, any adjacent opposing stone bracketed between your moved stone and another of your stones is captured.',
      'Players alternate turns. Choose two-player mode for pass-and-play or play against the computer.',
    ],
    winning:
      'The default rules award victory when the opponent has no legal move, has no surviving stones, or resigns. If 200 moves pass without a winner, the game is a draw.',
    specialRules: [
      'Movement is orthogonal and may cover any clear distance.',
      'After each move, an adjacent enemy stone bracketed horizontally or vertically between the moved stone and another friendly stone is captured. One move may capture multiple stones.',
      'Diagonal captures are not allowed, and the board edge does not count as a capturing stone. This is the selected reconstruction variant; ancient rules are not known with certainty.',
      'A majority-capture victory is disabled by default and is available only as an explicit future variant rule.',
    ],
    difficultyNotes: {
      beginner: 'The computer plays with a short search and may occasionally make a weaker move.',
      professional: 'The computer looks ahead and balances captures with board control.',
      expert: 'The computer searches deeper and does not deliberately choose a weaker move.',
    },
    tips: [
      'Keep stones near one another so they can support captures.',
      'Watch for enemy stones that can become trapped between two of yours.',
      'An empty route can be as valuable as an immediate capture.',
    ],
  },
  stratego: {
    title: 'Stratego',
    goal: 'Capture the enemy flag while protecting your own army and its hidden strengths.',
    setup:
      'Each player arranges a 10-by-10 battle board with a hidden army of 40 pieces, including scouts, miners, spies, bombs, and a flag. The board starts with each side’s pieces tucked into their own camp.',
    howToPlay: [
      'Take turns moving one piece orthogonally by one square, or move a scout in a straight line through empty spaces.',
      'If you move into an enemy piece, both ranks are revealed; the stronger piece survives and the loser is removed.',
      'A miner defeats a bomb, a spy beats the marshal only when attacking, and a bomb or flag cannot move.',
      'Win by capturing the opposing flag or leaving your opponent without any moveable pieces.',
    ],
    winning:
      'A player wins when they capture the enemy flag or reduce the enemy to no moveable pieces. A drawn board is uncommon in a standard match but can be reported if neither side can advance to a legal win.',
    specialRules: [
      'A scout may continue through empty squares in a straight line until blocked by another piece or the board edge.',
      'When ranks tie, both pieces are removed from the board.',
      'The flag and bomb are immobile and must be guarded from enemy attacks.',
    ],
    difficultyNotes: {
      beginner:
        'Keep your flag away from the front line and look for safe, supporting flips around enemy scouts.',
      professional:
        'Blend forward pressure with quiet protection so the flag is never left exposed.',
      expert:
        'Track hidden piece positions and attack patterns, then use your strongest pieces to force the enemy flag into the open.',
    },
    tips: [
      'Early scouts are good at probing the enemy without committing your heavier troops.',
      'A miner cannot help if you leave your bomb line weak or your flag too close to the attack lane.',
    ],
  },
  sjoelen: {
    title: 'Sjoelen',
    goal: 'Score as many points as possible across three rounds by landing discs in the highest-value lanes.',
    setup:
      'The board has four scoring lanes with values 2, 3, 4, and 1. You throw 30 discs in each round, aiming to collect as many points as possible before the round ends.',
    howToPlay: [
      'Choose one lane to aim at for each throw.',
      'Each disc lands in a lane and adds to that lane’s count.',
      'The round ends after all 30 discs have been thrown.',
      'Use your total across the three rounds to set your best score.',
    ],
    winning:
      'The game is scored by total points across all three rounds. A full set of discs in every lane grants an extra 20-point bonus.',
    specialRules: [
      'Each lane has a different point value: 2, 3, 4, and 1 points respectively.',
      'A wave of 30 discs per round gives a natural challenge even when the aim is imperfect.',
      'A complete set in all four lanes adds a 20-point round bonus.',
    ],
    difficultyNotes: {
      beginner: 'Start by aiming for the middle, high-value lanes to build steady points.',
      professional: 'Balance the 4-point lane with the 2- and 3-point lanes to avoid empty slots.',
      expert:
        'Track the lane totals and chase the bonus by filling every lane before the round closes.',
    },
    tips: [
      'A full set of lanes is worth more than a lucky spike in one category.',
      'The 4-point lane is valuable, but the set bonus matters if every lane is active.',
    ],
  },
  ganzenbord: {
    title: 'Ganzenbord (Game of the Goose)',
    goal: 'Be the first player to reach space 63 exactly.',
    setup:
      'Two to four players share a 63-space winding track and take turns rolling one six-sided die. This app uses a clearly stated house-rule set for spaces whose effects vary between editions.',
    howToPlay: [
      'Roll the die and move forward by the number shown.',
      'If a move would pass space 63, bounce backward by the extra spaces; you must land exactly on 63 to win.',
      'Landing on a Goose space (9, 18, 27, 36, 45, or 54) moves you forward by the same die roll again.',
      'The bridge on 6 advances to 12; the maze on 42 sends you back to 39; Death on 58 returns you to Start.',
      'The inn on 19 costs one turn, while the well on 31 and prison on 52 each cost two turns; press Roll die to skip each missed turn.',
    ],
    winning: 'The first player to reach space 63 exactly wins.',
    specialRules: [
      'Overshooting the finish reflects the player backward from space 63.',
      'This implementation uses fixed lost turns for the inn, well, and prison rather than a wait-until-rescued rule.',
      'Special-space effects apply after Goose movement resolves.',
    ],
    difficultyNotes: {
      beginner: 'Keep track of who is waiting and plan around the spaces that cost turns.',
      professional:
        'Remember that Goose spaces repeat the same die roll and can carry a player several spaces forward.',
      expert:
        'Use the bounce-back finish rule to anticipate how each possible roll affects the final approach.',
    },
    tips: [
      'A Goose space repeats the number from the roll that brought you there.',
      'Landing on a penalty space can cost more than the distance you gain.',
    ],
  },
  battleships: {
    title: 'Battleships',
    goal: 'Find and sink every ship in your opponent’s hidden fleet before they sink yours.',
    setup:
      'Each player hides five straight ships on an 8-by-8 grid: lengths 5, 4, 3, 3, and 2. Ships may be placed horizontally or vertically and cannot overlap.',
    howToPlay: [
      'Take turns choosing one square on the opponent’s grid to fire at.',
      'The defender reports a hit or miss; a ship is sunk when every square it occupies has been hit.',
      'Mark the result on your tracking grid and continue firing at unused squares.',
    ],
    winning: 'The first player to sink all five opposing ships wins.',
    specialRules: [
      'A shot at an already tried square does not count as a new hit.',
      'This version allows ships to touch; only overlap is forbidden.',
    ],
    difficultyNotes: {
      beginner: 'Keep a clear record of every miss, hit, and sunk ship.',
      professional: 'After a hit, test neighboring squares to determine the ship’s direction.',
      expert: 'Use the remaining ship lengths to focus searches on patterns that can still fit.',
    },
    tips: [
      'Ships cannot bend or leave the grid.',
      'Spread early shots over likely ship spaces, then focus around confirmed hits.',
    ],
  },
  mastermind: {
    title: 'Mastermind',
    goal: 'Work out the hidden sequence of symbols before you run out of guesses.',
    setup:
      'One player or the computer chooses a secret code. The usual code has four positions and six symbols; repeats are allowed. Difficulty can change the code length, symbol set, and number of attempts.',
    howToPlay: [
      'Enter a complete sequence of symbols as your guess.',
      'Read the feedback: exact means a symbol is right and in the right position; misplaced means it is in the code but in another position.',
      'Use the feedback to make a new guess and narrow down the possibilities.',
    ],
    winning: 'Find the entire code in the correct order before the last allowed attempt.',
    specialRules: [
      'Repeated symbols are allowed in the secret and guesses.',
      'Feedback tells how many symbols are exact or misplaced, not which positions they belong to.',
    ],
    difficultyNotes: {
      beginner: 'The code has four positions, six symbols, and up to ten attempts.',
      professional: 'The code has four positions and six symbols, with up to eight attempts.',
      expert: 'The code has five positions and eight symbols, with up to ten attempts.',
    },
    tips: [
      'Record what each guess rules out.',
      'A symbol can appear more than once, so test repetition deliberately.',
    ],
  },
  bullscows: {
    title: 'Bulls and Cows',
    goal: 'Crack the hidden sequence of digits using the clues from each guess.',
    setup:
      'The secret is made from digits 0–9 with no repeated digit. Beginner and Professional use four digits; Expert uses five.',
    howToPlay: [
      'Enter a guess with the required number of different digits.',
      'Count the Bulls: digits that are correct and in the correct position.',
      'Count the Cows: digits that are in the secret but in a different position.',
      'Use both counts to choose the next guess before attempts run out.',
    ],
    winning:
      'Win by getting every digit correct and in its correct position. If all attempts are used first, the secret remains unsolved.',
    specialRules: [
      'A digit cannot appear twice in a secret or guess.',
      'Bulls and Cows give counts only; they do not identify which digits matched.',
    ],
    difficultyNotes: {
      beginner: 'Guess four digits with up to 12 attempts and three hints.',
      professional: 'Guess four digits with up to 10 attempts and two hints.',
      expert: 'Guess five digits with up to 10 attempts and one hint.',
    },
    tips: [
      'Keep track of which digits have been tested.',
      'A digit that is a Cow must move to a different position next time.',
    ],
  },
  hangman: {
    title: 'Hangman',
    goal: 'Reveal the hidden word before you make too many incorrect guesses.',
    setup:
      'The computer or another player chooses a word. The screen shows one blank for each letter; the wrong-guess limit depends on difficulty.',
    howToPlay: [
      'Choose one letter of the alphabet.',
      'If it appears in the word, every matching blank is revealed; otherwise, the wrong-guess count increases.',
      'Use the revealed letters to guess the remaining word before the limit is reached.',
    ],
    winning: 'Reveal every letter in the word before reaching the maximum number of wrong guesses.',
    specialRules: [
      'Repeated guesses do not count again.',
      'A correct letter reveals all its occurrences in the word.',
    ],
    difficultyNotes: {
      beginner: 'Words are 4–6 letters and allow up to eight wrong guesses.',
      professional: 'Words are 6–9 letters and allow up to six wrong guesses.',
      expert: 'Words are 8–12 letters and allow up to five wrong guesses.',
    },
    tips: [
      'Start with common vowels, then use the pattern of blanks to narrow down words.',
      'Do not repeat a letter already shown as used.',
    ],
  },
  'dots-and-boxes': {
    title: 'Dots and Boxes',
    goal: 'Claim more boxes than your opponent by completing their four sides.',
    setup:
      'The chosen board has 5 dots across and 5 dots down, making a 4-by-4 grid of boxes. Each player draws one line between neighboring dots on a turn.',
    howToPlay: [
      'Choose one undrawn horizontal or vertical line between adjacent dots.',
      'If your line completes the fourth side of a box, claim that box.',
      'When a line completes a box, take another turn; one line may complete more than one box.',
      'Continue until every line is drawn.',
    ],
    winning: 'The player who owns the most boxes when the board is complete wins.',
    specialRules: [
      'Completing at least one box grants an extra turn.',
      'A line can complete two boxes and claim both.',
    ],
    difficultyNotes: {
      beginner: 'Avoid drawing a third side around a box unless you can claim it next.',
      professional: 'Look for safe lines that do not hand your opponent a long chain of boxes.',
      expert: 'Plan the endgame by counting the boxes in each chain you may have to give away.',
    },
    tips: [
      'Early moves usually add harmless lines; the risky choices come when boxes have three sides.',
      'Count both boxes completed and the extra turn they award.',
    ],
  },
  mancala: {
    title: 'Mancala (Kalah)',
    goal: 'Collect more seeds in your store than your opponent.',
    setup:
      'This Kalah version has two rows of six pits and one store at each end. Put four seeds in each small pit; the stores start empty. Each player controls the six pits nearest them and the store on their right.',
    howToPlay: [
      'Choose one non-empty pit on your side and pick up all its seeds.',
      'Sow one seed at a time into the following pits counter-clockwise, including your own store but skipping your opponent’s store.',
      'If the last seed lands in your store, take another turn.',
      'If the last seed lands in an empty pit on your side and the opposite pit has seeds, capture those seeds and your last seed into your store.',
    ],
    winning:
      'The game ends when one player has no seeds in any of their six pits. The other player moves their remaining pit seeds into their store; the larger store wins.',
    specialRules: [
      'A last seed in your store gives an extra turn.',
      'The empty-pit capture applies only when your last seed lands on your own empty pit and the opposite pit is occupied.',
      'Never sow into the opponent’s store.',
    ],
    difficultyNotes: {
      beginner: 'Count where the last seed will land before selecting a pit.',
      professional:
        'Plan extra turns and captures together rather than treating each move separately.',
      expert:
        'Track the full sowing cycle, including seeds that travel around the board more than once.',
    },
    tips: [
      'A pit with enough seeds to reach your store can earn another move.',
      'Keep seeds on your side when the opponent is close to ending the game.',
    ],
  },
  dominoes: {
    title: 'Dominoes (Double-Six Draw)',
    goal: 'Be the first to empty your hand, or have the fewest pips when no one can play.',
    setup:
      'Use a double-six set of 28 tiles, from 0–0 through 6–6. Shuffle face down; in a two-player game, each player draws seven tiles and the rest form the boneyard.',
    howToPlay: [
      'The player with the highest double starts by placing it; if no one has a double, the highest-value tile starts.',
      'Take turns adding one tile to either open end of the chain, matching the number of pips at that end.',
      'If you have no matching tile, draw from the boneyard until you can play or it is empty.',
      'If the boneyard is empty and you still cannot play, pass.',
    ],
    winning:
      'A round ends when a player uses all their tiles or the game is blocked with no legal play. The player who emptied their hand wins; in a blocked round, the player with fewer pips wins.',
    specialRules: [
      'A double is placed crosswise but still matches its pip count.',
      'If a blocked round has equal pip totals, it is a draw.',
    ],
    difficultyNotes: {
      beginner: 'Match an open end and keep track of which numbers are becoming scarce.',
      professional: 'Keep a variety of pip values so you are less likely to be blocked.',
      expert:
        'Remember played tiles and use them to infer which ends opponents may be unable to match.',
    },
    tips: [
      'A double counts both halves when comparing pip totals.',
      'Use a high-pip tile early if it may be hard to place later.',
    ],
  },
  ludo: {
    title: 'Ludo',
    goal: 'Race all four of your tokens from base, around the track, and into your home row.',
    setup:
      'Each player has four tokens in a matching base and a colored route around the board. Roll one die; the first player is chosen by the game.',
    howToPlay: [
      'Roll the die and move one token the exact number of spaces along its route.',
      'You must roll a six to move a token from base onto its starting square.',
      'Choose a different token if one cannot legally move the full number rolled.',
      'Move a token into your home lane after it completes the circuit.',
    ],
    winning:
      'Be the first player to move all four tokens into the final home space; an exact roll is required to finish each token.',
    specialRules: [
      'Rolling a six grants another roll.',
      'Landing on an opponent’s unprotected token sends it back to base.',
      'Marked safe squares cannot be used to capture a token.',
    ],
    difficultyNotes: {
      beginner: 'Get several tokens onto the track so you have choices each turn.',
      professional: 'Balance racing toward home with the chance to capture a nearby opponent.',
      expert: 'Track opponents’ likely die ranges and avoid leaving tokens exposed near them.',
    },
    tips: [
      'A token cannot pass through an occupied space if the route rules prevent it.',
      'A six is useful both for leaving base and for gaining another roll.',
    ],
  },
  snake: {
    title: 'Snake',
    goal: 'Eat as much food as possible without running the snake into a wall or its own body.',
    setup:
      'A single snake moves around a grid with one piece of food at a time. The snake starts short and grows when it eats.',
    howToPlay: [
      'Choose a direction to steer the moving snake.',
      'Guide its head over the food; the snake grows and new food appears.',
      'Keep steering before each move so the head avoids the edge and the snake’s body.',
    ],
    winning:
      'This version is a score-chasing game: survive and collect food to increase your score. The round ends when the snake hits a wall or itself.',
    specialRules: [
      'Eating food makes the snake longer.',
      'The snake cannot reverse directly into its own neck.',
    ],
    difficultyNotes: {
      beginner: 'Make wide turns and leave open space for the growing body.',
      professional: 'Plan a route that will remain clear after the snake grows.',
      expert: 'Keep a repeatable loop open and avoid trapping yourself in narrow corridors.',
    },
    tips: [
      'Look at the whole path ahead, not only the next food.',
      'The longer the snake gets, the less room remains to turn.',
    ],
  },
  '2048': {
    title: '2048',
    goal: 'Combine equal-numbered tiles until you create a tile worth 2048.',
    setup:
      'The game uses a 4-by-4 grid with numbered tiles. After a valid move, a new low-value tile appears in an empty square.',
    howToPlay: [
      'Choose a direction to slide every tile as far as it can go.',
      'When two equal tiles meet, they merge into one tile with their values added together.',
      'A tile can merge only once during a single move.',
      'Keep the grid open enough to make more moves.',
    ],
    winning:
      'Create a tile worth 2048. The game ends when no empty square or legal merge move remains.',
    specialRules: [
      'Tiles merge only with an equal value.',
      'A move that does not shift or merge any tile is not a valid move.',
    ],
    difficultyNotes: {
      beginner: 'Focus on combining the smallest tiles and avoid filling the grid.',
      professional: 'Build a smooth chain of values toward one corner.',
      expert: 'Keep your largest tile anchored and preserve a route for matching values to meet.',
    },
    tips: [
      'Repeatedly changing directions can scatter large tiles.',
      'Before moving, check whether a merge will block the next useful move.',
    ],
  },
  minesweeper: {
    title: 'Minesweeper',
    goal: 'Reveal every safe square without opening a square that contains a mine.',
    setup:
      'The board hides mines among covered squares. A revealed number tells how many mines touch that square horizontally, vertically, or diagonally.',
    howToPlay: [
      'Reveal a covered square that you believe is safe.',
      'Use its number and neighboring revealed clues to work out where mines must be.',
      'Mark suspected mines with flags if the game provides them, then reveal other safe squares.',
      'Continue until all non-mine squares are revealed.',
    ],
    winning: 'Win by revealing every non-mine square. Revealing a mine ends the round.',
    specialRules: [
      'Each number counts mines in up to eight surrounding squares.',
      'A flag is a reminder, not proof; a wrongly flagged square does not reveal itself.',
    ],
    difficultyNotes: {
      beginner: 'Start with revealed clues that have only one or two covered neighbors.',
      professional: 'Combine clues that share neighboring squares to narrow down safe moves.',
      expert:
        'Compare overlapping number constraints and avoid guessing when another deduction is available.',
    },
    tips: [
      'A zero clue means its neighboring squares contain no mines.',
      'Do not assume a covered square is safe just because nearby squares are marked.',
    ],
  },
} satisfies Record<RulesGameId, GameRules>;

export type RulesGame = (typeof rulesContent)[keyof typeof rulesContent];

export function getRulesContent(gameId: string): GameRules | undefined {
  if (!Object.prototype.hasOwnProperty.call(rulesContent, gameId)) return undefined;
  return rulesContent[gameId as RulesGameId];
}
