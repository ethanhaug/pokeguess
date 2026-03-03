import { getCache, setCache } from "./cache";

const POKEAPI = "https://pokeapi.co/api/v2";
const ONE_DAY = 24 * 60 * 60 * 1000;

export type PokemonCore = {
  id: number;
  name: string;
  height: number; // decimeters
  weight: number; // hectograms
  sprite: string | null;
  types: string[];
};

export type PokemonSpecies = {
  generation: number; // 1..9
};

function genNameToNumber(genName: string): number {
  const roman = genName.split("-").pop() || "";
  const map: Record<string, number> = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
  };
  return map[roman.toLowerCase()] ?? 0;
}

async function fetchJson<T>(url: string): Promise<T> {
  const cached = getCache<T>(url);
  if (cached) return cached;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);

  const data = (await res.json()) as T;
  setCache(url, data, ONE_DAY);
  return data;
}

export async function getPokemonByNameOrId(nameOrId: string | number): Promise<PokemonCore> {
  const url = `${POKEAPI}/pokemon/${String(nameOrId).toLowerCase()}`;
  const p = await fetchJson<any>(url);

  return {
    id: p.id,
    name: p.name,
    height: p.height,
    weight: p.weight,
    sprite: p.sprites?.front_default ?? null,
    types: (p.types ?? [])
      .sort((a: any, b: any) => (a.slot ?? 0) - (b.slot ?? 0))
      .map((t: any) => t.type?.name)
      .filter(Boolean),
  };
}

export async function getSpeciesByNameOrId(nameOrId: string | number): Promise<PokemonSpecies> {
  const url = `${POKEAPI}/pokemon-species/${String(nameOrId).toLowerCase()}`;
  const s = await fetchJson<any>(url);

  return {
    generation: genNameToNumber(s.generation?.name ?? ""),
  };
}
