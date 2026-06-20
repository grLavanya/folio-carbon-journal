# Folio 🌿 — A Carbon Journal

Built for **Prompt Wars Virtual Challenge 3: Carbon Footprint Awareness Platform** (Hack2skill x Google for Developers).

## Chosen Vertical
Carbon Footprint Awareness Platform — reimagined as a personal journal rather than a tracker.

## Approach & Logic
Most carbon footprint apps ask users to log and quantify every action, which creates pressure to be "accurate" and invites gaming the system (logging positive actions just to raise a score). Folio sidesteps this by framing the experience as a **journal**, not a tracker.

Users write freeform entries about everyday eco-actions ("Took the metro instead of an Ola today"). Each entry is analyzed for:
- **Category** (Transport, Water, Waste, Lifestyle, etc.)
- **Mood** (Proud, Concerned, Motivated, Hopeful, Neutral)

The combination of category + mood — not category alone — determines the entry's impact score. The same action can score differently depending on how the user felt about it, reflecting the real story behind the action rather than a flat tag.

This impact score updates a persistent **World Health Score** (0–100), which visually reshapes a 2D illustrated world: sky color, tree fullness, and water clarity all shift based on health. Especially positive entries trigger a flower bloom animation.

Design principles:
- **No streak/decay mechanics** — punishing inactivity creates guilt, which drives users away rather than engaging them. The world persists honestly instead.
- **Rule-based fallback** — if the Gemini API is unavailable, a deterministic category + mood rule set still produces a sensible impact score, so the app degrades gracefully rather than breaking.
- **World health recalculation on delete** — deleting an entry recalculates the world health score from scratch across all remaining entries, rather than subtracting the deleted entry's score, to avoid compounding rounding errors over time.

## How the Solution Works
1. User signs in (Supabase Auth)
2. User writes a journal entry, selecting a category and mood
3. Entry is analyzed via the Gemini API (gemini-1.5-flash) for impact scoring, with a rule-based fallback if the API call fails
4. The impact score adjusts the World Health Score, which is persisted in Supabase
5. The illustrated world (built in SVG) re-renders based on the updated health score, with sky/tree/water visuals shifting accordingly
6. Exceptional positive entries trigger a flower bloom, which is also persisted (via localStorage) so it survives page refreshes within the same browser

## Tech Stack
- **Frontend:** React, TypeScript, Vite
- **Backend:** Supabase (auth + persistence)
- **AI:** Gemini API (gemini-1.5-flash) with rule-based fallback
- **Build tools:** Bolt.new (initial scaffolding) → Google Antigravity (continued development after reaching Bolt's free-tier token limit)
- **Deployment:** Vercel

## Assumptions Made
- Users are journaling about real personal actions in good faith; the journal framing is intended to make gaming the system unappealing rather than impossible to detect
- Flower bloom persistence is scoped to the browser (via localStorage), not the user account — multi-device sync of this specific visual effect was out of scope given the project timeline
- Impact scoring is a rule-informed heuristic, not a scientifically precise carbon calculation

## Live Demo
[https://folio-carbon-journal.vercel.app](https://folio-carbon-journal.vercel.app)

## Open in Bolt.new
[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-fy5al8vt)
