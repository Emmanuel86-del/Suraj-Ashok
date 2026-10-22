# TransportHub — Suraj Ashok Limited
Vite + React + TypeScript + Supabase.

## Setup
1. `cp .env.example .env` and fill in your Supabase URL + anon key
2. Supabase SQL Editor: run `supabase/schema.sql` (needs existing `vehicles` table with `plate` and `drivers` table with `full_name`)
3. `npm install && npm run dev`
4. Create a user in Supabase Auth, then set their `role` in `profiles` (corporate_admin / manager / staff)

## Deploy
Push to GitHub, import into Vercel, add the two VITE_ env vars.

## Included
Auth gate, role-based sidebar, Tyres (register, add, search, badges), Compliance (cards, vehicle/driver tabs, day colouring).

## Next (from the build plan)
Sub-account portals, trips/fuel/spares, reports, live monitor, tyre history + rotation panel.
