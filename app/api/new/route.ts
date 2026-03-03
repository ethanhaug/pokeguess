import { NextResponse } from "next/server";
import { createGame, GameMode } from "@/lib/gameStore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "random") as GameMode;

  const game = createGame(mode);

  return NextResponse.json({
    gameId: game.id,
    mode: game.mode,
    maxGuesses: game.maxGuesses,
  });
}
