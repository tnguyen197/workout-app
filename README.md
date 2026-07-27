# Gym Log

A weight tracker for a four-day anterior/posterior split, built from your notes.

Twenty-six exercise slots across four days, but only seventeen distinct exercises —
nine of them appear in two days each. Those nine exist once in the data and are
referenced by id, so changing a weight anywhere changes it everywhere. That is the
whole point of the app.

---

## Deploy to Vercel

You need the code on GitHub first, then Vercel builds from it.

### 1. Push to GitHub

```bash
cd gym-log
git init
git add .
git commit -m "Gym Log"
```

Make an empty repo on github.com (no README, no .gitignore — this project has one),
then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/gym-log.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

Go to [vercel.com/new](https://vercel.com/new), pick the repo, and press Deploy.
Every setting can stay on its default — Vercel detects Next.js on its own. There are
no environment variables and no database to provision.

You get a URL like `gym-log-yourname.vercel.app` in about a minute. Pushing to `main`
redeploys automatically from then on.

### Alternative: deploy without GitHub

```bash
npm i -g vercel
cd gym-log
vercel
```

Answer the prompts and it deploys straight from your machine.

---

## Put it on your phone's home screen

It's a PWA, so it installs without an app store and opens fullscreen with no browser
chrome.

**iPhone** — open the URL in Safari (this only works in Safari, not Chrome), tap the
Share button, then "Add to Home Screen."

**Android** — open in Chrome, tap the three-dot menu, then "Install app" or "Add to
Home screen."

---

## Running it locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## How it works

**Starting a workout.** Tap one of the four day cards. You get that day's lifts in
order, each with a minus/plus stepper. Tap the number itself to type an exact weight
instead of stepping to it.

**Linked lifts.** Exercises that appear in more than one day carry a `LINKED` badge.
Change one and a toast tells you which other day just changed. Nine of your
seventeen exercises are linked this way.

**Finishing.** Tapping "Finish workout" stamps today's date and snapshots every weight
on screen. This is the only thing that writes history — the progress charts and the
week strip both read from it. Skip it and that session doesn't exist as far as the app
is concerned.

**The week strip.** Monday through Sunday, filled in sodium yellow for days you
trained. Arrows page back through previous weeks. Tapping a past day you didn't log
lets you backfill it; tapping a logged day lets you delete the log.

**Progress charts.** The small chart icon on any exercise opens its weight history.
Multi-variant exercises get a chip per variant, so you can look at Calf Raises plate
loaded separately from cable.

**Rest timer.** Docked at the bottom during a session. The ±15 buttons change your
saved default, not just this one rest. It beeps and vibrates when it runs out.

---

## Customizing

Everything is editable in the app under **Edit** — you shouldn't need to touch code.

- **Exercises tab** — rename anything, change weights, add or remove variants
  (Machine / Cable / DB / whatever), add new exercises, delete old ones. Each card
  shows which days use it.
- **Days tab** — rename days, reorder lifts with the arrows, remove lifts, add any
  exercise from your library.
- **Data tab** — rest timer default, weight step (2.5 / 5 / 10 lb), backup, and reset.

To change what a fresh install starts with, edit `lib/seed.js`.

---

## Your data

It lives in this browser's local storage on this device. Nothing is uploaded, there's
no account, and there's no server holding a copy.

The tradeoff: clearing your browser data or site data erases it, and it doesn't sync
to other devices. **Use Export file in the Data tab now and then.** The file it saves
restores onto any device through Import file, which is also how you'd move to a new
phone.

---

## Two things I changed from your notes

Your notes had drifted in two places, since the same lift was written down twice. I
took the heavier value in both cases — correct them in the app if I guessed wrong:

| Exercise | Anterior A | Anterior B | Used |
|---|---|---|---|
| Cable Crunch | 135 | 130 | **135** |
| Leg Extension (Machine) | 55 | 45 | **55** |

Calf Raises was written as "130 / Standing 270 / Extension 310" in Posterior A and
"Plate loaded 130 / Cable 270 / Extension 310" in Posterior B. I read those as the
same three variants and labeled them Plate Loaded / Cable / Extension.

"Leg Extension" and "Leg Extensions" were merged into one exercise.

---

## File map

```
app/
  layout.js       fonts, PWA metadata, viewport
  page.js         view routing, session logging, export/import
  globals.css     the entire design system
lib/
  seed.js         your 17 exercises and 4 days
  store.js        local storage, date maths, history queries
components/
  WeekStrip.js    Monday-Sunday training calendar
  Session.js      workout view, propagation toast
  ExerciseRow.js  steppers, tap-to-type, linked badge
  RestTimer.js    countdown, beep, vibrate
  ProgressChart.js hand-rolled SVG line chart
  Library.js      exercise / day / settings editor
public/           icons and web manifest
```

No chart library, no state library, no CSS framework. Dependencies are Next, React,
and two self-hosted font packages.

---

## Notes on the build

Fonts are self-hosted via `@fontsource` rather than fetched from Google at build time,
so the app never calls out to Google — it loads fine on gym wifi that barely works.

Archivo is set with tabular figures throughout, which means digits are all the same
width and the numbers don't shift around as you step a weight up and down.
