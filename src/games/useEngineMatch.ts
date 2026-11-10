import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Difficulty } from '@/engine/difficulty';
import { AIRequestCancelledError, requestMove } from '@/engine/aiClient';
import type { GameEngine, Player } from '@/engine/types';
import { useFeedback } from '@/hooks/useFeedback';
import { useStats } from '@/hooks/useStats';
import type { MatchConfig } from '@/games/matchConfig';
import { NO_SCORES, type MatchScores } from '@/games/matchOutcome';
import { isWorkerGameId } from '@/games/aiRegistry';

interface EngineMatchOptions<State, Move> {
  engine: GameEngine<State, Move>;
  config: MatchConfig;
  chooseMove: (state: State, difficulty: Difficulty) => Move | null;
  enableUndo?: boolean;
  initialState?: () => State;
  thinkingDelayMs?: number;
}

export function useEngineMatch<State, Move>({
  engine,
  config,
  chooseMove,
  enableUndo = false,
  initialState = engine.initialState,
  thinkingDelayMs,
}: EngineMatchOptions<State, Move>) {
  const { place, win, lose, draw } = useFeedback();
  const { recordResult } = useStats();
  const matchInstance = useId();
  const matchNumber = useRef(0);
  const recordedMatch = useRef<string | null>(null);

  const humanSide: Player = config.mode === 'computer' && !config.humanFirst ? 1 : 0;
  const computerSide: Player | null = config.mode === 'computer' ? (humanSide === 0 ? 1 : 0) : null;
  const difficulty = config.mode === 'computer' ? config.difficulty : null;

  const [state, setState] = useState<State>(initialState);
  const [pastStates, setPastStates] = useState<State[]>([]);
  const [moveHistory, setMoveHistory] = useState<Array<{ move: Move; player: Player }>>([]);
  const [scores, setScores] = useState<MatchScores>(NO_SCORES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);

  const result = engine.winner(state);
  const over = result !== null;
  const turn = engine.currentPlayer(state);
  const computerTurn = computerSide !== null && !over && turn === computerSide;

  const commit = useCallback(
    (next: State, move?: Move) => {
      if (enableUndo) {
        setPastStates((previous) => [...previous, state]);
        if (move !== undefined) {
          setMoveHistory((previous) => [
            ...previous,
            { move, player: engine.currentPlayer(state) },
          ]);
        }
      }
      setState(next);
      place();
      const finished = engine.winner(next);
      if (finished === null) return;
      setScores((prev) =>
        finished === 'draw'
          ? { ...prev, draws: prev.draws + 1 }
          : { ...prev, [finished]: prev[finished] + 1 },
      );
      if (finished === 'draw') draw();
      else if (config.mode === 'two-player' || finished === humanSide) win();
      else lose();
      setDialogOpen(true);
    },
    [config.mode, draw, enableUndo, engine, humanSide, lose, place, state, win],
  );

  useEffect(() => {
    if (result === null) return;
    const resultId = `${engine.id}:${matchInstance}:${matchNumber.current}`;
    if (recordedMatch.current === resultId) return;
    recordedMatch.current = resultId;

    const outcome = result === 'draw' ? 'draw' : result === humanSide ? 'win' : 'lose';
    setPointsEarned(
      recordResult({
        resultId,
        gameId: engine.id,
        mode: config.mode,
        ...(config.mode === 'computer' ? { difficulty: config.difficulty } : {}),
        outcome,
      }),
    );
  }, [config, engine.id, humanSide, recordResult, result, matchInstance]);

  useEffect(() => {
    if (!computerTurn || difficulty === null) return;
    let active = true;
    const controller = new AbortController();
    const delay = thinkingDelayMs ?? 400 + Math.random() * 400;
    const timer = window.setTimeout(() => {
      const search = isWorkerGameId(engine.id)
        ? requestMove<State, Move>(engine.id, state, difficulty, controller.signal)
        : Promise.resolve(chooseMove(state, difficulty));

      void search
        .then((move) => {
          if (!active || move === null) return;
          const legal = engine
            .legalMoves(state)
            .some(
              (candidate) => engine.movesEqual?.(candidate, move) ?? Object.is(candidate, move),
            );
          if (!legal) throw new Error(`AI returned an illegal move for ${engine.id}`);
          setAiError(null);
          commit(engine.applyMove(state, move), move);
        })
        .catch((error: unknown) => {
          if (!active || error instanceof AIRequestCancelledError) return;
          console.error(`Unable to select an AI move for ${engine.id}:`, error);
          setAiError(error instanceof Error ? error.message : 'Unable to select a computer move.');
        });
    }, delay);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [chooseMove, commit, computerTurn, difficulty, engine, state, thinkingDelayMs]);

  useEffect(() => {
    if (over || !engine.passTurn || engine.legalMoves(state).length > 0) return;
    commit(engine.passTurn(state));
  }, [commit, engine, over, state]);

  const playMove = (move: Move) => {
    if (computerTurn || over) return;
    const legal = engine.legalMoves(state);
    if (
      !legal.some((candidate) => engine.movesEqual?.(candidate, move) ?? Object.is(candidate, move))
    )
      return;
    commit(engine.applyMove(state, move), move);
  };

  const restart = () => {
    matchNumber.current++;
    setState(initialState());
    setPastStates([]);
    setMoveHistory([]);
    setDialogOpen(false);
    setPointsEarned(0);
    setAiError(null);
  };

  const canUndo = enableUndo && !computerTurn && !over && moveHistory.length > 0;
  const undoMove = useCallback(() => {
    if (!canUndo) return;
    const lastMove = moveHistory[moveHistory.length - 1];
    const movesToUndo =
      config.mode === 'computer' && lastMove?.player !== humanSide
        ? Math.min(2, moveHistory.length)
        : 1;
    const previousStateIndex = pastStates.length - movesToUndo;
    const previousState = pastStates[previousStateIndex];
    if (previousState === undefined) return;

    setState(previousState);
    setPastStates((previous) => previous.slice(0, previousStateIndex));
    setMoveHistory((previous) => previous.slice(0, previous.length - movesToUndo));
    setDialogOpen(false);
  }, [canUndo, config.mode, humanSide, moveHistory, pastStates]);

  return {
    state,
    result,
    over,
    turn,
    humanSide,
    computerTurn,
    scores,
    dialogOpen,
    pointsEarned,
    aiError,
    moveHistory,
    canUndo,
    closeDialog: () => setDialogOpen(false),
    playMove,
    restart,
    undoMove,
    finish: (next: State) => commit(next),
  };
}
