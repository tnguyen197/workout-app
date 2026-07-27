'use client';

import { weekDays, todayKey, tint } from '@/lib/store';
import Icon from './Icon';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekStrip({ sessions, days, offset, onOffset, onPickDate }) {
  const dates = weekDays(offset);
  const today = todayKey();
  const byDate = new Map(sessions.map((s) => [s.date, s]));
  const colorOf = new Map(days.map((d) => [d.id, d.color]));
  const trainedCount = dates.filter((d) => byDate.has(todayKey(d))).length;

  const rangeLabel =
    offset === 0
      ? 'This week'
      : offset === -1
        ? 'Last week'
        : `${Math.abs(offset)} weeks ago`;

  return (
    <section className="week">
      <div className="week-head">
        <div className="week-count">
          <b>{trainedCount}</b> {trainedCount === 1 ? 'day' : 'days'} &middot;{' '}
          {rangeLabel}
        </div>
        <div className="week-nav">
          <button onClick={() => onOffset(offset - 1)} aria-label="Previous week">
            <Icon name="left" size={16} />
          </button>
          <button
            onClick={() => onOffset(offset + 1)}
            disabled={offset >= 0}
            aria-label="Next week"
          >
            <Icon name="right" size={16} />
          </button>
        </div>
      </div>

      <div className="week-grid">
        {dates.map((d, i) => {
          const key = todayKey(d);
          const session = byDate.get(key);
          const color = session ? colorOf.get(session.dayId) : null;
          const isToday = key === today;
          const isFuture = key > today;

          const style = color
            ? {
                background: tint(color, 0.15),
                borderColor: tint(color, isToday ? 0.85 : 0.45),
              }
            : isToday
              ? { borderColor: 'var(--smoke-dim)' }
              : undefined;

          return (
            <button
              key={key}
              className={`wday${isFuture ? ' future' : ''}`}
              style={style}
              disabled={isFuture}
              onClick={() => onPickDate(key, session)}
              aria-label={`${key}${session ? ', trained' : ', no session'}`}
            >
              <span
                className="wday-label"
                style={color ? { color: tint(color, 0.8) } : undefined}
              >
                {LABELS[i]}
              </span>
              <span className="wday-num" style={color ? { color } : undefined}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
