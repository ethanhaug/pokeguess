import { Redis } from "@upstash/redis";
import type { Game } from "./gameStore";

const redis = Redis.fromEnv();

const key = (id: string) => `pokeguess:game:${id}`;

export async function redisGetGame(id: string): Promise<Game | null> {
  return await redis.get<Game>(key(id));
}

export async function redisSaveGame(game: Game): Promise<void> {
  // expire after 2 days
  await redis.set(key(game.id), game, { ex: 60 * 60 * 24 * 2 });
}

export async function redisDeleteGame(id: string): Promise<void> {
  await redis.del(key(id));
}
