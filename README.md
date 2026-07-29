# Gym Log

A weight tracker for my personaltraining split, built to
replace a notes-app page that was getting frustrating to use.

## The problem

My original notes listed four workout days, each with its own exercise list
and working weights. There were 26 entries in total but only seventeen distinct
exercises because nine of them appeared on two different days.

Writing the same lift down twice meant the two copies drifted apart. When I would add weight to an exercise I would have to do
it in multiple places, leading to mismatches occurring. This flow overall was annoying to use, leading to the development of this app.

## The approach

Each exercise exists once. Days hold references to exercise IDs rather than
their own copies of the data:

```
exercises: { "incline-press": { name, variants: [{ label, weight }] }, ... }
days:      [ { name: "Anterior A", exerciseIds: ["incline-press", ...] }, ... ]
```

Changing a weight writes to one object, so both days read the new value
immediately. Duplication becomes impossible rather than something I would have to remember to do.

## Design decisions

- **Local storage is the source of truth.** Reads and writes stay on-device, so
  the app is instant and usable with no signal.
- **Cloud backup, not sync.** Single-user, single-device by design. Changes are
  backed up to Redis after a short delay. Backup failures show in the UI and
  retry on the next change and local use is never blocked.
- **Weight only.** My notes tracked working weight, so the app does too.
  Progress charts use weight snapshots saved when a workout is marked finished.
- **Small surface area.** No UI framework and no chart library: one screen,
  plain React, custom SVG chart, minimal runtime dependencies.

## Stack

Next.js (Vercel), React, Upstash Redis, self-hosted fonts. Client-rendered and
installable as a PWA.

```
app/         routes, API handlers, global stylesheet
lib/         seed data, storage, date helpers, backup client
components/  week strip, session, exercise row, rest timer, chart, editor
```

Run locally with:

```bash
npm install
npm run dev
```
