"use client";

import { useEffect, useMemo, useState } from "react";

type Arrow = "higher" | "lower" | "equal";
type TypeMatch = "all" | "some" | "none";
type Mode = "random" | "daily";

type GuessFeedback = {
  guess: {
    name: string;
    sprite: string | null;
    types: string[];
    id: number;
    generation: number;
    height: number;
    weight: number;
  };
  dex: Arrow;
  generation: Arrow;
  height: Arrow;
  weight: Arrow;
  typeMatch: TypeMatch;
  matchedTypes: string[];
  isCorrect: boolean;
};

function arrowIcon(a: Arrow) {
  if (a === "equal") return "✅";
  return a === "higher" ? "⬇️" : "⬆️";
}

function typeBadge(tm: TypeMatch) {
  if (tm === "all") return { text: "Types: ALL", cls: "bg-green-200" };
  if (tm === "some") return { text: "Types: SOME", cls: "bg-yellow-200" };
  return { text: "Types: NONE", cls: "bg-red-200" };
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("random");
  const [gameId, setGameId] = useState<string>("");
  const [maxGuesses, setMaxGuesses] = useState<number>(8);
  const [guessCount, setGuessCount] = useState<number>(0);

  const [pokemonList, setPokemonList] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [answer, setAnswer] = useState<{ name: string; id: number } | null>(null);
  const [error, setError] = useState<string>("");

  const guessesLeft = maxGuesses - guessCount;

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q || pokemonList.length === 0) return [];
    return pokemonList.filter((n) => n.startsWith(q)).slice(0, 8);
  }, [input, pokemonList]);

  async function startNewGame(nextMode: Mode = mode) {
    setError("");
    setInput("");
    setGuesses([]);
    setStatus("playing");
    setAnswer(null);
    setGuessCount(0);

    const res = await fetch(`/api/new?mode=${nextMode}`);
    const data = await res.json();
    setGameId(data.gameId);
    setMaxGuesses(data.maxGuesses ?? 8);
  }

  async function loadPokemonListOnce() {
    try {
      const cached = localStorage.getItem("pokemonListV1");
      if (cached) {
        setPokemonList(JSON.parse(cached));
        return;
      }
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
      const data = await res.json();
      const names: string[] = (data.results ?? []).map((r: any) => r.name).filter(Boolean);
      setPokemonList(names);
      localStorage.setItem("pokemonListV1", JSON.stringify(names));
    } catch {
      // not fatal
    }
  }

  async function submitGuess(name?: string) {
    if (status !== "playing") return;
    setError("");

    const guessName = (name ?? input).trim().toLowerCase();
    if (!guessName) return;

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, guessName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Guess failed");
      return;
    }

    const fb: GuessFeedback = data.feedback;
    setGuesses((prev) => [fb, ...prev]);
    setInput("");

    // server truth
    setStatus(data.game?.status ?? "playing");
    setGuessCount(data.game?.guessCount ?? 0);
    setMaxGuesses(data.game?.maxGuesses ?? maxGuesses);

    if (data.answer) setAnswer(data.answer);
  }

  useEffect(() => {
    startNewGame("random");
    loadPokemonListOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerModeLabel = mode === "daily" ? "Daily" : "Random";

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold">PokéGuess</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mode:</span>
          <button
            className={`border rounded px-3 py-1 text-sm ${mode === "random" ? "bg-gray-100" : ""}`}
            onClick={() => {
              setMode("random");
              startNewGame("random");
            }}
          >
            Random
          </button>
          <button
            className={`border rounded px-3 py-1 text-sm ${mode === "daily" ? "bg-gray-100" : ""}`}
            onClick={() => {
              setMode("daily");
              startNewGame("daily");
            }}
          >
            Daily
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Guess the Pokémon. Get feedback on Dex #, generation, height, weight, and types. ({headerModeLabel})
      </p>

      <div className="flex gap-2 items-center mb-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Enter Pokémon name (e.g., pikachu, mr-mime)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitGuess();
          }}
          disabled={status !== "playing"}
        />
        <button className="border rounded px-4 py-2" onClick={() => submitGuess()} disabled={status !== "playing"}>
          Guess
        </button>
        <button className="border rounded px-4 py-2" onClick={() => startNewGame(mode)}>
          New
        </button>
      </div>

      {suggestions.length > 0 && status === "playing" && (
        <div className="border rounded p-2 mb-4 bg-white">
          <div className="text-xs text-gray-500 mb-2">Suggestions</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                className="text-sm border rounded px-2 py-1 hover:bg-gray-50"
                onClick={() => submitGuess(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm">
          Game: <span className="font-mono">{gameId.slice(0, 8)}…</span>
        </div>
        <div className="text-sm">
          Guesses left: <span className="font-semibold">{Math.max(0, guessesLeft)}</span>
        </div>
      </div>

      {status !== "playing" && (
        <div className="border rounded p-4 mb-6">
          {status === "won" ? (
            <div className="font-semibold">You got it! 🎉</div>
          ) : (
            <div className="space-y-2">
              <div className="font-semibold">Out of guesses 😭</div>
              {answer && (
                <div className="text-sm">
                  Answer was: <span className="font-mono font-semibold">{answer.name}</span> (#{answer.id})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {guesses.map((g, idx) => {
          const tb = typeBadge(g.typeMatch);
          const matched = new Set(g.matchedTypes);

          return (
            <div key={`${g.guess.name}-${idx}`} className="border rounded p-3 flex gap-3">
              <div className="w-16 flex flex-col items-center justify-center">
                {g.guess.sprite ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.guess.sprite} alt={g.guess.name} className="w-14 h-14" />
                ) : (
                  <div className="w-14 h-14 border rounded flex items-center justify-center text-xs">no sprite</div>
                )}
                <div className="text-xs mt-1 font-mono">{g.guess.name}</div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${tb.cls}`}>{tb.text}</span>
                  {g.guess.types.map((t) => (
                    <span
                      key={t}
                      className={`text-xs px-2 py-1 rounded ${
                        matched.has(t) ? "bg-green-100 border border-green-300" : "bg-gray-100"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="border rounded p-2">
                    <div className="text-xs text-gray-500">Dex #</div>
                    <div className="font-semibold">
                      {g.guess.id} {arrowIcon(g.dex)}
                    </div>
                  </div>

                  <div className="border rounded p-2">
                    <div className="text-xs text-gray-500">Generation</div>
                    <div className="font-semibold">
                      {g.guess.generation} {arrowIcon(g.generation)}
                    </div>
                  </div>

                  <div className="border rounded p-2">
                    <div className="text-xs text-gray-500">Height (dm)</div>
                    <div className="font-semibold">
                      {g.guess.height} {arrowIcon(g.height)}
                    </div>
                  </div>

                  <div className="border rounded p-2">
                    <div className="text-xs text-gray-500">Weight (hg)</div>
                    <div className="font-semibold">
                      {g.guess.weight} {arrowIcon(g.weight)}
                    </div>
                  </div>
                </div>

                {g.isCorrect && <div className="mt-2 text-green-700 font-semibold">Correct!</div>}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}