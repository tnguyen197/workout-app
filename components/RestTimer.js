'use client';

import { useEffect, useRef, useState } from 'react';

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.52);
    setTimeout(() => ctx.close(), 900);
  } catch {
    // Audio blocked before user interaction. The vibration and visual
    // state still fire, so this is safe to swallow.
  }
}

function mmss(total) {
  const s = Math.max(0, Math.ceil(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function RestTimer({ duration, endsAt, onStart, onStop, onAdjust }) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    if (!endsAt) return;
    firedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt ? (endsAt - now) / 1000 : duration;
  const done = endsAt != null && remaining <= 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      beep();
      if (navigator.vibrate) navigator.vibrate([120, 70, 120]);
    }
  }, [done]);

  const pct = endsAt ? Math.max(0, Math.min(1, remaining / duration)) : 1;
  const R = 15;
  const C = 2 * Math.PI * R;

  return (
    <div className="timerbar">
      <div className="timerbar-inner">
        <svg className="timer-dial" width="38" height="38" viewBox="0 0 38 38">
          <circle
            cx="19"
            cy="19"
            r={R}
            fill="none"
            stroke="var(--line)"
            strokeWidth="3"
          />
          <circle
            cx="19"
            cy="19"
            r={R}
            fill="none"
            stroke={done ? 'var(--sodium)' : 'var(--chalk)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 19 19)"
          />
        </svg>

        <div className="timer-read">
          <div className={`timer-time${done ? ' done' : ''}`}>
            {done ? 'Rest done' : mmss(remaining)}
          </div>
          <div className="timer-label">
            {endsAt ? (done ? 'tap start for next set' : 'resting') : 'rest timer'}
          </div>
        </div>

        <div className="timer-actions">
          {!endsAt || done ? (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onAdjust(-15)}
                aria-label="Decrease rest by 15 seconds"
              >
                &minus;15
              </button>
              <button className="btn btn-primary btn-sm" onClick={onStart}>
                Start rest
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onAdjust(15)}
                aria-label="Increase rest by 15 seconds"
              >
                +15
              </button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={onStop}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
