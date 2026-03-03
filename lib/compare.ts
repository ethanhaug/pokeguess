import type { PokemonCore, PokemonSpecies } from "./pokeapi";

export type Arrow = "higher" | "lower" | "equal";
export type TypeMatch = "all" | "some" | "none";

export type GuessFeedback = {
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

function arrow(guessVal: number, targetVal: number): Arrow {
  if (guessVal === targetVal) return "equal";
  return guessVal > targetVal ? "higher" : "lower";
}

function computeTypeMatch(guessTypes: string[], targetTypes: string[]) {
  const g = new Set(guessTypes);
  const t = new Set(targetTypes);

  const matched: string[] = [];
  for (const x of g) if (t.has(x)) matched.push(x);

  let typeMatch: TypeMatch = "none";
  if (matched.length === 0) typeMatch = "none";
  else if (matched.length === t.size) typeMatch = "all";
  else typeMatch = "some";

  return { typeMatch, matchedTypes: matched };
}

export function compareGuess(
  guessCore: PokemonCore,
  guessSpecies: PokemonSpecies,
  targetCore: PokemonCore,
  targetSpecies: PokemonSpecies
): GuessFeedback {
  const dexArrow = arrow(guessCore.id, targetCore.id);
  const genArrow = arrow(guessSpecies.generation, targetSpecies.generation);
  const heightArrow = arrow(guessCore.height, targetCore.height);
  const weightArrow = arrow(guessCore.weight, targetCore.weight);

  const { typeMatch, matchedTypes } = computeTypeMatch(guessCore.types, targetCore.types);

  const isCorrect = guessCore.id === targetCore.id;

  return {
    guess: {
      name: guessCore.name,
      sprite: guessCore.sprite,
      types: guessCore.types,
      id: guessCore.id,
      generation: guessSpecies.generation,
      height: guessCore.height,
      weight: guessCore.weight,
    },
    dex: dexArrow,
    generation: genArrow,
    height: heightArrow,
    weight: weightArrow,
    typeMatch,
    matchedTypes,
    isCorrect,
  };
}
