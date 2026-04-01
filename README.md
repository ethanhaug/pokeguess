# Pokeguess

Pokeguess is a full-stack Pokémon guessing game inspired by Wordle-style feedback loops. Players try to identify a hidden Pokémon in a limited number of guesses using structured hints after each attempt.

## Overview

The app supports both:
- **Random mode** — generates a new target Pokémon for each game
- **Daily mode** — selects the same deterministic target for all users on a given day

Each guess returns feedback on:
- National Dex number
- Generation
- Height
- Weight
- Type overlap (all / some / none)

The goal of the project was to build a polished, interactive game experience while practicing full-stack application design, API development, state persistence, and performance optimization.

## Tech Stack

- **Frontend:** Next.js, TypeScript
- **Backend:** Next.js App Router API routes
- **State Persistence:** Upstash Redis
- **External API:** PokéAPI
- **Deployment:** Vercel

## Key Features

- Random and daily game modes
- Redis-backed game sessions with TTL expiration
- Deterministic daily puzzle generation
- Structured hint system for each guess
- PokéAPI integration for live Pokémon data
- Autocomplete suggestions for smoother user input
- Multi-layer caching for improved responsiveness

## How It Works

### Starting a Game
The frontend begins a new game by calling:

- `GET /api/new?mode=random`
- `GET /api/new?mode=daily`

The backend creates a game object containing:
- game ID
- target Pokémon ID
- guess limit
- game status

That state is stored in Redis so gameplay can remain stateless on the server.

### Submitting a Guess
Users submit guesses through:

- `POST /api/guess`

The backend:
1. Loads the game state from Redis
2. Fetches target and guessed Pokémon data from PokéAPI
3. Compares their attributes using a custom comparison engine
4. Updates guess count and win/loss state
5. Saves the new state back to Redis
6. Returns structured feedback for rendering in the frontend

### Feedback System
Each guess returns rich feedback for:
- Dex number direction
- Generation match
- Height comparison
- Weight comparison
- Type overlap

This powers the Wordle-style hint loop and gives players meaningful information after every guess.

## Performance / Design Decisions

A few technical decisions I’m especially proud of:
- **Redis session persistence** keeps game state centralized and scalable
- **Deterministic daily target generation** ensures all users get the same daily puzzle
- **Server-side caching** reduces repeated PokéAPI requests
- **Client-side caching** with localStorage improves autocomplete responsiveness
- **Modular game logic** separates API handling, game state, and comparison logic for maintainability

## Project Structure

```text
app/
  api/
    new/
    guess/
  page.tsx
lib/
  compare.ts
  gameStore.ts
  pokeapi.ts
  redisGameStore.ts
public/

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
