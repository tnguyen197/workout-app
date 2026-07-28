'use client';

import { useEffect, useRef, useState } from 'react';
import WeekStrip from '@/components/WeekStrip';
import Session from '@/components/Session';
import Library from '@/components/Library';
import ProgressChart, { Sparkline } from '@/components/ProgressChart';
import Icon from '@/components/Icon';
import { freshState } from '@/lib/seed';
import {
  fetchStatus,
  savedKey,
  rememberKey,
  pushBackup,
  pullBackup,
  inspectBackup,
} from '@/lib/backup';
import {
  loadState,
  saveState,
  todayKey,
  historyFor,
  lastSessionFor,
  relativeDay,
  tint,
} from '@/lib/store';

export default function Page() {
  const [state, setState] = useState(null);
  const [view, setView] = useState('home');
  const [activeDayId, setActiveDayId] = useState(null);
  const [chartId, setChartId] = useState(null);
  const [chartVariant, setChartVariant] = useState(null);
  const [dateSheet, setDateSheet] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [progressOpen, setProgressOpen] = useState(false);
  const [backup, setBackup] = useState({
    configured: false,
    hasStore: false,
    hasSecret: false,
    key: '',
    status: 'idle',
    updatedAt: null,
    error: null,
  });
  const fileRef = useRef(null);
  const skipFirstBackup = useRef(true);

  useEffect(() => {
    const initial = loadState();
    setState(initial);
    saveState(initial);
  }, []);

  useEffect(() => {
    fetchStatus().then((s) =>
      setBackup((b) => ({ ...b, ...s, key: savedKey() }))
    );
  }, []);

  // Push a copy up whenever the data changes, a couple of seconds after you
  // stop tapping. Failures are surfaced but never block anything local.
  useEffect(() => {
    if (!state || !backup.configured || !backup.key) return;
    if (skipFirstBackup.current) {
      skipFirstBackup.current = false;
      return;
    }
    const id = setTimeout(async () => {
      setBackup((b) => ({ ...b, status: 'saving' }));
      try {
        const updatedAt = await pushBackup(backup.key, state);
        setBackup((b) => ({ ...b, status: 'saved', updatedAt, error: null }));
      } catch (e) {
        setBackup((b) => ({ ...b, status: 'error', error: e.message }));
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [state, backup.configured, backup.key]);

  async function connectBackup(key) {
    setBackup((b) => ({ ...b, status: 'saving', error: null }));
    try {
      const updatedAt = await pushBackup(key, state);
      rememberKey(key);
      setBackup((b) => ({ ...b, key, status: 'saved', updatedAt, error: null }));
    } catch (e) {
      setBackup((b) => ({ ...b, status: 'error', error: e.message }));
    }
  }

  async function restoreBackup() {
    setBackup((b) => ({ ...b, status: 'saving', error: null }));
    try {
      const got = await pullBackup(backup.key);
      if (!got) {
        setBackup((b) => ({
          ...b,
          status: 'error',
          error: 'Nothing has been backed up yet.',
        }));
        return;
      }
      skipFirstBackup.current = true;
      setState(got.data);
      saveState(got.data);
      setBackup((b) => ({
        ...b,
        status: 'saved',
        updatedAt: got.updatedAt,
        error: null,
      }));
    } catch (e) {
      setBackup((b) => ({ ...b, status: 'error', error: e.message }));
    }
  }

  async function checkBackup() {
    setBackup((b) => ({ ...b, status: 'saving', error: null, meta: null }));
    try {
      const meta = await inspectBackup(backup.key);
      setBackup((b) => ({ ...b, status: 'saved', meta, error: null }));
    } catch (e) {
      setBackup((b) => ({ ...b, status: 'error', error: e.message }));
    }
  }

  function disconnectBackup() {
    rememberKey('');
    setBackup((b) => ({ ...b, key: '', status: 'idle', error: null }));
  }

  function mutate(recipe) {
    setState((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      saveState(next);
      return next;
    });
  }

  function changeWeight(exerciseId, variantId, weight) {
    mutate((s) => {
      const v = s.exercises[exerciseId]?.variants.find((x) => x.id === variantId);
      if (v) v.weight = weight;
    });
  }

  function snapshot(s, dayId) {
    const day = s.days.find((d) => d.id === dayId);
    const weights = {};
    day.exerciseIds.forEach((id) => {
      const ex = s.exercises[id];
      if (!ex) return;
      weights[id] = Object.fromEntries(ex.variants.map((v) => [v.id, v.weight]));
    });
    return weights;
  }

  function logSession(dayId, date) {
    mutate((s) => {
      const weights = snapshot(s, dayId);
      const existing = s.sessions.find(
        (x) => x.date === date && x.dayId === dayId
      );
      if (existing) {
        existing.weights = weights;
      } else {
        s.sessions.push({
          id: `${date}-${dayId}`,
          date,
          dayId,
          weights,
        });
      }
    });
  }

  function finishWorkout() {
    logSession(activeDayId, todayKey());
    setView('home');
    setWeekOffset(0);
  }

  function exportFile() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-log-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.exercises || !parsed.days) throw new Error('bad shape');
        setState(parsed);
        saveState(parsed);
        alert('Backup restored.');
      } catch {
        alert("That file isn't a Gym Log backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  if (!state) {
    return (
      <main className="shell">
        <div className="topbar">
          <h1 className="wordmark">
            GYM<span>/</span>LOG
          </h1>
        </div>
      </main>
    );
  }

  const activeDay = state.days.find((d) => d.id === activeDayId);
  const chartEx = chartId ? state.exercises[chartId] : null;
  const variantId =
    chartVariant && chartEx?.variants.some((v) => v.id === chartVariant)
      ? chartVariant
      : chartEx?.variants[0]?.id;

  return (
    <main className="shell">
      {view === 'session' && activeDay ? (
        <Session
          day={activeDay}
          state={state}
          onChangeWeight={changeWeight}
          onFinish={finishWorkout}
          onBack={() => setView('home')}
          onOpenChart={(id) => {
            setChartId(id);
            setChartVariant(null);
          }}
          onSetRest={(secs) =>
            mutate((s) => {
              s.settings.restSeconds = secs;
            })
          }
        />
      ) : (
        <>
          <div className="topbar">
            <h1 className="wordmark">
              GYM<span>/</span>LOG
            </h1>
            <button
              className="topbar-meta"
              onClick={() => setView(view === 'library' ? 'home' : 'library')}
            >
              {view === 'library' ? 'Done' : 'Edit'}
            </button>
          </div>

          {view === 'library' ? (
            <Library
              state={state}
              mutate={mutate}
              backup={backup}
              onConnectBackup={connectBackup}
              onRestoreBackup={restoreBackup}
              onCheckBackup={checkBackup}
              onDisconnectBackup={disconnectBackup}
              onExport={exportFile}
              onImport={() => fileRef.current?.click()}
              onReset={() => {
                if (!confirm('Erase everything and start from the original notes?'))
                  return;
                const next = freshState();
                setState(next);
                saveState(next);
              }}
            />
          ) : (
            <>
              <WeekStrip
                sessions={state.sessions}
                days={state.days}
                offset={weekOffset}
                onOffset={setWeekOffset}
                onPickDate={(date, session) => setDateSheet({ date, session })}
              />

              <p className="eyebrow">Start a workout</p>
              {state.days.map((d) => {
                const last = lastSessionFor(state.sessions, d.id);
                return (
                  <button
                    key={d.id}
                    className="daycard"
                    onClick={() => {
                      setActiveDayId(d.id);
                      setView('session');
                    }}
                  >
                    <span
                      className="daycard-bar"
                      style={{ background: d.color }}
                    />
                    <span className="daycard-body">
                      <span className="daycard-name">{d.name}</span>
                      <span className="daycard-sub">
                        {d.exerciseIds.length} lifts &middot;{' '}
                        {relativeDay(last?.date)}
                      </span>
                    </span>
                    <span className="daycard-go">
                      <Icon name="arrowRight" size={17} />
                    </span>
                  </button>
                );
              })}

              <button
                className="section-toggle"
                onClick={() => setProgressOpen((o) => !o)}
                aria-expanded={progressOpen}
              >
                <span className="section-title">Weight progress</span>
                <span className="section-meta">
                  {Object.keys(state.exercises).length} lifts
                </span>
                <Icon name={progressOpen ? 'up' : 'down'} size={16} />
              </button>
              {progressOpen &&
                Object.values(state.exercises).map((ex) => {
                const v = ex.variants[0];
                const hist = historyFor(state.sessions, ex.id, v.id);
                const delta = hist.length > 1
                  ? hist[hist.length - 1].weight - hist[0].weight
                  : 0;
                const owner = state.days.find((d) =>
                  d.exerciseIds.includes(ex.id)
                );
                return (
                  <button
                    key={ex.id}
                    className="prog-row"
                    onClick={() => {
                      setChartId(ex.id);
                      setChartVariant(null);
                    }}
                  >
                    <span className="prog-name">{ex.name}</span>
                    <Sparkline
                      history={hist}
                      color={owner ? owner.color : 'var(--smoke)'}
                    />
                    <span className="prog-weight">{v.weight}</span>
                    <span className={`prog-delta${delta > 0 ? ' up' : ''}`}>
                      {delta > 0 ? `+${delta}` : delta < 0 ? delta : '\u2013'}
                    </span>
                    </button>
                  );
                })}
            </>
          )}
        </>
      )}

      {view !== 'session' && (
        <footer
          className="build-tag"
          title={`${process.env.NEXT_PUBLIC_STAMP} \u00b7 ${process.env.NEXT_PUBLIC_SHA}`}
        >
          {process.env.NEXT_PUBLIC_VERSION} &middot;{' '}
          {process.env.NEXT_PUBLIC_BUILT_AT}
        </footer>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={importFile}
        style={{ display: 'none' }}
      />

      {chartEx && (
        <div className="scrim" onClick={() => setChartId(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <h2 className="sheet-title">{chartEx.name}</h2>
              </div>
              <button
                className="sheet-close"
                onClick={() => setChartId(null)}
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <p className="sheet-sub">Weight logged at each finished workout</p>

            {chartEx.variants.length > 1 && (
              <div className="picker" style={{ marginBottom: 16 }}>
                {chartEx.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`chip${v.id === variantId ? ' on' : ''}`}
                    onClick={() => setChartVariant(v.id)}
                  >
                    {v.label || 'Working weight'}
                  </button>
                ))}
              </div>
            )}

            <ProgressChart
              history={historyFor(state.sessions, chartEx.id, variantId)}
              unit={state.settings.unit}
            />
          </div>
        </div>
      )}

      {dateSheet && (
        <div className="scrim" onClick={() => setDateSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2 className="sheet-title">{dateSheet.date}</h2>
              <button
                className="sheet-close"
                onClick={() => setDateSheet(null)}
                aria-label="Close"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            {dateSheet.session ? (
              <>
                <p className="sheet-sub">
                  You did{' '}
                  <b
                    style={{
                      color: state.days.find(
                        (d) => d.id === dateSheet.session.dayId
                      )?.color,
                      fontWeight: 600,
                    }}
                  >
                    {state.days.find((d) => d.id === dateSheet.session.dayId)
                      ?.name || 'a workout'}
                  </b>
                  .
                </p>
                <button
                  className="btn btn-ghost btn-danger btn-full"
                  onClick={() => {
                    mutate((s) => {
                      s.sessions = s.sessions.filter(
                        (x) => x.id !== dateSheet.session.id
                      );
                    });
                    setDateSheet(null);
                  }}
                >
                  Remove this log
                </button>
              </>
            ) : (
              <>
                <p className="sheet-sub">
                  Nothing logged. Pick what you did to backfill it.
                </p>
                <div className="picker">
                  {state.days.map((d) => (
                    <button
                      key={d.id}
                      className="chip"
                      onClick={() => {
                        logSession(d.id, dateSheet.date);
                        setDateSheet(null);
                      }}
                    >
                      <span className="chip-dot" style={{ background: d.color }} />
                      {d.name}
                    </button>
                  ))}
                </div>
                <p className="note">
                  Backfilling uses today&rsquo;s weights, since the app has no record
                  of what you actually lifted that day.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
