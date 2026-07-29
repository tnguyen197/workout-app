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

**Local storage as the source of truth.** Every read hits the device. The
network is never in the path of anything you do standing at a machine, so the
app is instant and works in a basement with no signal.

**Cloud backup, not sync.** One device means one writer, which means no merge
conflicts and no accounts. Data is pushed to Redis two seconds after changes
settle. A failed backup surfaces in the UI and retries on the next change; it
never blocks anything local. This covers losing the phone or having storage
cleared, which are the failure modes that actually happen to one person.

**Weight only, no rep logging.** The original notes tracked working weight and
nothing else, and the app is faster for it. Progress charts read from weight
snapshots taken when a workout is marked finished.

**No UI framework and no chart library.** Roughly 600 lines of CSS and a
hand-rolled SVG chart, against three runtime dependencies. For a single-screen
app the configuration and bundle cost of pulling in more would exceed what it
saved.

## Trade-offs I'd flag

The cloud backup keeps one slot and overwrites it, so there is no version
history. If local data were corrupted, the corruption would be replicated two
seconds later. JSON export covers this — it produces a snapshot nothing can
overwrite — but rotating the last few backups under separate keys would close
the gap properly.

Device-local storage means iOS Safari's seven-day storage eviction applies. It
does not apply to home-screen web apps, which is how this is meant to be
installed, but a user who only ever opened it in a Safari tab could lose data
after a week away.

Backfilling a missed session records today's weights, since the app has no idea
what was actually lifted that day. It says so in the UI rather than quietly
guessing.

## Stack

Next.js on Vercel, React, Upstash Redis for backup, self-hosted fonts. Client
rendered, installable as a PWA. Fonts are self-hosted rather than fetched from
Google so the app makes no third-party requests on load.

```
app/       routes, API handlers, global stylesheet
lib/       seed data, storage, date helpers, backup client
components/  week strip, session, exercise row, rest timer, chart, editor
```

Run locally with `npm install && npm run dev`.
