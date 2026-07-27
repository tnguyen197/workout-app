'use client';

import { useState } from 'react';

function slugify(name, taken) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'exercise';
  let id = base;
  let n = 2;
  while (taken[id]) id = `${base}-${n++}`;
  return id;
}

function ExerciseCard({ ex, usedBy, mutate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="libcard">
      <div className="libcard-head">
        <input
          className="libname"
          value={ex.name}
          onChange={(e) =>
            mutate((s) => {
              s.exercises[ex.id].name = e.target.value;
            })
          }
          aria-label="Exercise name"
        />
        <button
          className="icon-btn"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse' : 'Expand'}
          aria-expanded={open}
        >
          {open ? '\u2227' : '\u2228'}
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            if (!confirm(`Delete ${ex.name} from every day?`)) return;
            mutate((s) => {
              delete s.exercises[ex.id];
              s.days.forEach((d) => {
                d.exerciseIds = d.exerciseIds.filter((i) => i !== ex.id);
              });
            });
          }}
          aria-label={`Delete ${ex.name}`}
        >
          &times;
        </button>
      </div>

      {!open && (
        <div className="libused">
          {ex.variants.map((v) => (v.label ? `${v.label} ${v.weight}` : v.weight)).join('  \u00b7  ')}
        </div>
      )}

      {open && (
        <>
          {ex.variants.map((v, i) => (
            <div className="vedit" key={v.id}>
              <input
                type="text"
                value={v.label ?? ''}
                placeholder="no label"
                onChange={(e) =>
                  mutate((s) => {
                    s.exercises[ex.id].variants[i].label = e.target.value || null;
                  })
                }
                aria-label="Variant label"
              />
              <input
                type="number"
                value={v.weight}
                onChange={(e) =>
                  mutate((s) => {
                    s.exercises[ex.id].variants[i].weight =
                      Number(e.target.value) || 0;
                  })
                }
                aria-label="Variant weight"
              />
              <button
                className="icon-btn"
                disabled={ex.variants.length === 1}
                style={{ opacity: ex.variants.length === 1 ? 0.25 : 1 }}
                onClick={() =>
                  mutate((s) => {
                    s.exercises[ex.id].variants.splice(i, 1);
                  })
                }
                aria-label="Remove variant"
              >
                &times;
              </button>
            </div>
          ))}

          <div className="btn-row">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                mutate((s) => {
                  const vs = s.exercises[ex.id].variants;
                  vs.push({
                    id: `v${Date.now().toString(36)}`,
                    label: 'New',
                    weight: vs[vs.length - 1]?.weight ?? 0,
                  });
                })
              }
            >
              + Add variant
            </button>
          </div>

          <div className="libused">
            USED IN {usedBy.length ? usedBy.join(', ').toUpperCase() : 'NO DAYS'}
          </div>
        </>
      )}
    </div>
  );
}

function DayEditor({ state, mutate }) {
  const [activeId, setActiveId] = useState(state.days[0]?.id);
  const day = state.days.find((d) => d.id === activeId) || state.days[0];
  if (!day) return null;

  const dayIndex = state.days.findIndex((d) => d.id === day.id);
  const available = Object.values(state.exercises).filter(
    (e) => !day.exerciseIds.includes(e.id)
  );

  return (
    <>
      <div className="picker" style={{ marginBottom: 16 }}>
        {state.days.map((d) => (
          <button
            key={d.id}
            className={`chip${d.id === day.id ? ' on' : ''}`}
            onClick={() => setActiveId(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="libcard">
        <div className="libcard-head">
          <input
            className="libname"
            value={day.name}
            onChange={(e) =>
              mutate((s) => {
                s.days[dayIndex].name = e.target.value;
              })
            }
            aria-label="Day name"
          />
        </div>
      </div>

      {day.exerciseIds.map((id, i) => {
        const ex = state.exercises[id];
        if (!ex) return null;
        return (
          <div className="libcard" key={id}>
            <div className="libcard-head">
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
                {ex.name}
              </span>
              <button
                className="icon-btn"
                disabled={i === 0}
                style={{ opacity: i === 0 ? 0.25 : 1 }}
                onClick={() =>
                  mutate((s) => {
                    const arr = s.days[dayIndex].exerciseIds;
                    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  })
                }
                aria-label="Move up"
              >
                &uarr;
              </button>
              <button
                className="icon-btn"
                disabled={i === day.exerciseIds.length - 1}
                style={{ opacity: i === day.exerciseIds.length - 1 ? 0.25 : 1 }}
                onClick={() =>
                  mutate((s) => {
                    const arr = s.days[dayIndex].exerciseIds;
                    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                  })
                }
                aria-label="Move down"
              >
                &darr;
              </button>
              <button
                className="icon-btn"
                onClick={() =>
                  mutate((s) => {
                    s.days[dayIndex].exerciseIds = s.days[
                      dayIndex
                    ].exerciseIds.filter((x) => x !== id);
                  })
                }
                aria-label={`Remove ${ex.name} from ${day.name}`}
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}

      {available.length > 0 && (
        <>
          <p className="eyebrow">Add to {day.name}</p>
          <div className="picker">
            {available.map((e) => (
              <button
                key={e.id}
                className="chip"
                onClick={() =>
                  mutate((s) => {
                    s.days[dayIndex].exerciseIds.push(e.id);
                  })
                }
              >
                + {e.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function Library({ state, mutate, onExport, onImport, onReset }) {
  const [tab, setTab] = useState('exercises');
  const [newName, setNewName] = useState('');

  const usage = {};
  Object.keys(state.exercises).forEach((id) => {
    usage[id] = state.days.filter((d) => d.exerciseIds.includes(id)).map((d) => d.name);
  });

  return (
    <>
      <div className="tabs">
        <button
          className={`tab${tab === 'exercises' ? ' on' : ''}`}
          onClick={() => setTab('exercises')}
        >
          Exercises
        </button>
        <button
          className={`tab${tab === 'days' ? ' on' : ''}`}
          onClick={() => setTab('days')}
        >
          Days
        </button>
        <button
          className={`tab${tab === 'data' ? ' on' : ''}`}
          onClick={() => setTab('data')}
        >
          Data
        </button>
      </div>

      {tab === 'exercises' && (
        <>
          <p className="eyebrow">
            {Object.keys(state.exercises).length} exercises
          </p>
          {Object.values(state.exercises).map((ex) => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              usedBy={usage[ex.id]}
              mutate={mutate}
            />
          ))}

          <p className="eyebrow">New exercise</p>
          <div className="vedit">
            <input
              type="text"
              value={newName}
              placeholder="NAME"
              onChange={(e) => setNewName(e.target.value)}
              style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14 }}
              aria-label="New exercise name"
            />
            <button
              className="btn btn-ghost btn-sm"
              disabled={!newName.trim()}
              onClick={() => {
                const name = newName.trim();
                if (!name) return;
                mutate((s) => {
                  const id = slugify(name, s.exercises);
                  s.exercises[id] = {
                    id,
                    name,
                    variants: [{ id: 'main', label: null, weight: 0 }],
                  };
                });
                setNewName('');
              }}
            >
              Add
            </button>
          </div>
          <p className="note">
            New exercises start unassigned. Put them into a day from the Days tab.
          </p>
        </>
      )}

      {tab === 'days' && <DayEditor state={state} mutate={mutate} />}

      {tab === 'data' && (
        <>
          <p className="eyebrow">Rest timer default</p>
          <div className="picker">
            {[60, 90, 120, 150, 180].map((s) => (
              <button
                key={s}
                className={`chip${state.settings.restSeconds === s ? ' on' : ''}`}
                onClick={() =>
                  mutate((d) => {
                    d.settings.restSeconds = s;
                  })
                }
              >
                {s < 120 ? `${s}s` : `${s / 60} min`}
              </button>
            ))}
          </div>

          <p className="eyebrow">Weight step</p>
          <div className="picker">
            {[2.5, 5, 10].map((s) => (
              <button
                key={s}
                className={`chip${state.settings.increment === s ? ' on' : ''}`}
                onClick={() =>
                  mutate((d) => {
                    d.settings.increment = s;
                  })
                }
              >
                {s} {state.settings.unit}
              </button>
            ))}
          </div>

          <hr className="divider" />

          <p className="eyebrow">Backup</p>
          <p className="note" style={{ marginBottom: 12 }}>
            Everything lives in this browser only. Clearing site data wipes it, so
            export a copy now and then. The file restores onto any device.
          </p>
          <div className="btn-row">
            <button className="btn btn-ghost btn-full" onClick={onExport}>
              Export file
            </button>
            <button className="btn btn-ghost btn-full" onClick={onImport}>
              Import file
            </button>
          </div>

          <hr className="divider" />
          <button className="btn btn-ghost btn-danger btn-full" onClick={onReset}>
            Reset to original notes
          </button>
          <p className="note">
            Restores the 17 exercises and 4 days you started with. Logged sessions
            are erased too.
          </p>
        </>
      )}
    </>
  );
}
