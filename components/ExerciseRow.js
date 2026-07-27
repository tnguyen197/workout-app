'use client';

import { useState } from 'react';

function WeightInput({ value, onCommit }) {
  const [draft, setDraft] = useState(null);

  return (
    <input
      className="step-val"
      type="text"
      inputMode="decimal"
      value={draft ?? value}
      onFocus={(e) => {
        setDraft(String(value));
        e.target.select();
      }}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
      onBlur={() => {
        const n = parseFloat(draft);
        if (!Number.isNaN(n) && n >= 0) onCommit(n);
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
      aria-label="Weight"
    />
  );
}

export default function ExerciseRow({
  exercise,
  sharedWith,
  increment,
  onChange,
  onOpenChart,
  pulsing,
}) {
  const isShared = sharedWith.length > 0;

  return (
    <article className="exrow">
      <div className="exrow-head">
        <h3 className="exrow-name">{exercise.name}</h3>
        {isShared && (
          <span
            className={`linkbadge${pulsing ? ' pulse' : ''}`}
            title={`Also in ${sharedWith.join(', ')}`}
          >
            LINKED
          </span>
        )}
        <button
          className="exrow-chart"
          onClick={() => onOpenChart(exercise.id)}
          aria-label={`Progress for ${exercise.name}`}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M1.5 11.5L5 7.5L8 9.5L13.5 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {exercise.variants.map((v) => (
        <div className="vrow" key={v.id}>
          <span className="vtag">{v.label || 'Working weight'}</span>
          <div className="stepper">
            <button
              className="step-btn"
              onClick={() =>
                onChange(exercise.id, v.id, Math.max(0, v.weight - increment))
              }
              aria-label={`Decrease ${exercise.name}${v.label ? ` ${v.label}` : ''}`}
            >
              &minus;
            </button>
            <WeightInput
              value={v.weight}
              onCommit={(n) => onChange(exercise.id, v.id, n)}
            />
            <button
              className="step-btn"
              onClick={() => onChange(exercise.id, v.id, v.weight + increment)}
              aria-label={`Increase ${exercise.name}${v.label ? ` ${v.label}` : ''}`}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </article>
  );
}
