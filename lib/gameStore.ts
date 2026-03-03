import { randomUUID, createHash } from "crypto";

export type GameMode = "random" | "daily";

export type Game = {
  id: string;
  mode: GameMode;
  targetId: number;
  createdAt: number;
  maxGuesses: number;
  guessCount: number;
  status: "playing" | "won" | "lost";
  targetName?: string;
};

const games = new Map<string, Game>();

const DEFAULT_MAX_GUESSES = 8;
const MAX_DEX = 1025;

function clampDex(id: number) {
  return Math.max(1, Math.min(MAX_DEX, id));
}

export function dailyTargetId(dateISO: string) {
  const hash = createHash("sha256").update(`pokeguess:${dateISO}`).digest("hex");
  const n = parseInt(hash.slice(0, 8), 16);
  return clampDex((n % MAX_DEX) + 1);
}

export function createGame(
  mode: GameMode,
  opts?: { maxGuesses?: number; targetId?: number; dateISO?: string }
): Game {
  const id = randomUUID();
  const maxGuesses = opts?.maxGuesses ?? DEFAULT_MAX_GUESSES;

  let targetId = opts?.targetId ?? 0;
  if (mode === "daily") {
    const dateISO = opts?.dateISO ?? new Date().toISOString().slice(0, 10);
    targetId = dailyTargetId(dateISO);
  } else {
    targetId = opts?.targetId ?? (Math.floor(Math.random() * MAX_DEX) + 1);
  }

  const game: Game = {
    id,
    mode,
    targetId,
    createdAt: Date.now(),
    maxGuesses,
    guessCount: 0,
    status: "playing",
  };

  games.set(id, game);
  return game;
}

export function getGame(gameId: string): Game | null {
  return games.get(gameId) ?? null;
}

export function saveGame(game: Game) {
  games.set(game.id, game);
}

export function deleteGame(gameId: string) {
  games.delete(gameId);
}
