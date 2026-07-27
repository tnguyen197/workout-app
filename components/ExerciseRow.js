'use client';

import { useState } from 'react';
import Icon from './Icon';

function WeightInput({ value, onCommit }) {
  const [draft, setDraft] = useState(null);

  return (
    <input
      className="step-val"
      type="text"
      size={4}
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
      <button
        className="exrow-head"
        onClick={() => onOpenChart(exercise.id)}
        aria-label={`${exercise.name} weight history`}
      >
        <h3 className="exrow-name">{exercise.name}</h3>
        {isShared && (
          <span
            className={`linkbadge${pulsing ? ' pulse' : ''}`}
            title={`Also in ${sharedWith.join(', ')}`}
          >
            LINKED
          </span>
        )}
        <span className="exrow-chart">
          <Icon name="chart" size={16} />
        </span>
      </button>

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
              <Icon name="minus" size={20} stroke={2} />
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
              <Icon name="plus" size={20} stroke={2} />
            </button>
          </div>
        </div>
      ))}
    </article>
  );
}
