'use client';

import { useEffect, useRef, useState } from 'react';
import ExerciseRow from './ExerciseRow';
import RestTimer from './RestTimer';
import Icon from './Icon';
import {
  otherDaysUsing,
  lastSessionFor,
  relativeDay,
  todayKey,
  tint,
} from '@/lib/store';

export default function Session({
  day,
  state,
  onChangeWeight,
  onFinish,
  onBack,
  onOpenChart,
  onSetRest,
}) {
  const [toast, setToast] = useState(null);
  const [pulsing, setPulsing] = useState(null);
  const [restEnd, setRestEnd] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const last = lastSessionFor(state.sessions, day.id);
  const loggedToday = state.sessions.some(
    (s) => s.dayId === day.id && s.date === todayKey()
  );

  function handleChange(exerciseId, variantId, weight) {
    onChangeWeight(exerciseId, variantId, weight);

    const also = otherDaysUsing(state.days, exerciseId, day.id);
    if (also.length) {
      const name = state.exercises[exerciseId].name;
      setToast({ name, days: also });
      setPulsing(exerciseId);
      timers.current.forEach(clearTimeout);
      timers.current = [
        setTimeout(() => setToast(null), 2600),
        setTimeout(() => setPulsing(null), 900),
      ];
    }
  }

  const restSeconds = state.settings.restSeconds;

  return (
    <>
      <div className="sess-head">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrowLeft" size={19} />
        </button>
        <span
          className="daycard-bar"
          style={{ background: day.color, minHeight: 22 }}
        />
        <h1 className="sess-title">{day.name}</h1>
      </div>
      <p className="sess-sub">
        {day.exerciseIds.length} lifts &middot; last done{' '}
        {relativeDay(last?.date)}
      </p>

      <div className="exlist">
        {day.exerciseIds.map((id) => {
          const ex = state.exercises[id];
          if (!ex) return null;
          return (
            <ExerciseRow
              key={id}
              exercise={ex}
              sharedWith={otherDaysUsing(state.days, id, day.id)}
              increment={state.settings.increment}
              onChange={handleChange}
              onOpenChart={onOpenChart}
              pulsing={pulsing === id}
            />
          );
        })}
      </div>

      <div className="btn-row">
        <button
          className="btn btn-primary btn-full"
          style={{ background: day.color }}
          onClick={onFinish}
        >
          {loggedToday ? 'Update today\u2019s log' : 'Finish workout'}
        </button>
      </div>
      <p className="note">
        Finishing records today&rsquo;s date and snapshots every weight above, which
        is what the progress charts read from.
      </p>

      {toast && (
        <div
          className="toast"
          role="status"
          style={{
            background: tint(day.color, 0.14),
            borderColor: tint(day.color, 0.45),
            color: tint(day.color, 0.95),
          }}
        >
          <Icon name="swap" size={16} />
          <span>
            <b style={{ color: day.color }}>{toast.name}</b> also updated in{' '}
            {toast.days.join(' and ')}
          </span>
        </div>
      )}

      <RestTimer
        duration={restSeconds}
        endsAt={restEnd}
        color={day.color}
        onStart={() => setRestEnd(Date.now() + restSeconds * 1000)}
        onStop={() => setRestEnd(null)}
        onAdjust={(delta) =>
          onSetRest(Math.max(15, Math.min(600, restSeconds + delta)))
        }
      />
    </>
  );
}
