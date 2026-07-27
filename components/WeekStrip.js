'use client';

import { weekDays, todayKey } from '@/lib/store';

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekStrip({ sessions, offset, onOffset, onPickDate }) {
  const days = weekDays(offset);
  const today = todayKey();
  const byDate = new Map(sessions.map((s) => [s.date, s]));
  const trainedCount = days.filter((d) => byDate.has(todayKey(d))).length;

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
            &#8249;
          </button>
          <button
            onClick={() => onOffset(offset + 1)}
            disabled={offset >= 0}
            aria-label="Next week"
          >
            &#8250;
          </button>
        </div>
      </div>

      <div className="week-grid">
        {days.map((d, i) => {
          const key = todayKey(d);
          const session = byDate.get(key);
          const isToday = key === today;
          const isFuture = key > today;
          const cls = [
            'wday',
            session ? 'trained' : '',
            isToday ? 'today' : '',
            isFuture ? 'future' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={key}
              className={cls}
              disabled={isFuture}
              onClick={() => onPickDate(key, session)}
              aria-label={`${key}${session ? `, trained` : ', no session'}`}
            >
              <span className="wday-label">{LABELS[i]}</span>
              <span className="wday-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
