import { NextResponse } from "next/server";
import { getGame, saveGame } from "@/lib/gameStore";
import { getPokemonByNameOrId, getSpeciesByNameOrId } from "@/lib/pokeapi";
import { compareGuess } from "@/lib/compare";

export const runtime = "nodejs";

type Body = {
  gameId: string;
  guessName: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gameId = (body.gameId || "").trim();
  const guessName = (body.guessName || "").trim().toLowerCase();

  if (!gameId || !guessName) {
    return NextResponse.json({ error: "Missing gameId or guessName" }, { status: 400 });
  }

  const game = getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found (start a new one)" }, { status: 404 });
  }

  if (game.status !== "playing") {
    return NextResponse.json(
      { error: `Game is already ${game.status}. Start a new game.` },
      { status: 400 }
    );
  }

  if (game.guessCount >= game.maxGuesses) {
    game.status = "lost";
    saveGame(game);
    return NextResponse.json({ error: "No guesses left. Start a new game." }, { status: 400 });
  }

  try {
    const [guessCore, guessSpecies, targetCore, targetSpecies] = await Promise.all([
      getPokemonByNameOrId(guessName),
      getSpeciesByNameOrId(guessName),
      getPokemonByNameOrId(game.targetId),
      getSpeciesByNameOrId(game.targetId),
    ]);

    const feedback = compareGuess(guessCore, guessSpecies, targetCore, targetSpecies);

    game.guessCount += 1;

    if (feedback.isCorrect) {
      game.status = "won";
      game.targetName = targetCore.name;
    } else if (game.guessCount >= game.maxGuesses) {
      game.status = "lost";
      game.targetName = targetCore.name;
    }

    saveGame(game);

    return NextResponse.json({
      feedback,
      game: {
        status: game.status,
        guessCount: game.guessCount,
        maxGuesses: game.maxGuesses,
        mode: game.mode,
      },
      answer: game.status === "lost" ? { name: game.targetName, id: game.targetId } : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not find that Pokémon. Try the PokéAPI slug (e.g., mr-mime)." },
      { status: 400 }
    );
  }
}
