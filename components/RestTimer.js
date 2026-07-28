'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

function mmss(total) {
  const s = Math.max(0, Math.ceil(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function RestTimer({
  duration,
  endsAt,
  color,
  onStart,
  onStop,
  onAdjust,
}) {
  // Deliberately not holding the current time in state. Doing that captured
  // Date.now() at mount, so the first render after pressing start showed
  // duration + however long the screen had been open before the interval
  // caught up. The tick only forces a re-render; the clock is read fresh
  // below, so a stale timestamp is impossible.
  const [, tick] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);
  const audioRef = useRef(null);

  // iOS will not let a page create or resume an AudioContext outside a user
  // gesture. Opening it on the Start tap keeps it alive for later, so the
  // chime still plays when the rest ends after coming back from another app.
  function unlockAudio() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioRef.current) audioRef.current = new Ctx();
      if (audioRef.current.state === 'suspended') audioRef.current.resume();
      return audioRef.current;
    } catch {
      return null;
    }
  }

  function chime() {
    const ctx = unlockAudio();
    if (!ctx) return;
    [0, 0.2, 0.4].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 620 + i * 130;
      const at = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.17);
      osc.start(at);
      osc.stop(at + 0.2);
    });
  }

  useEffect(() => {
    if (!endsAt) return;
    firedRef.current = false;
    setDismissed(false);
    const id = setInterval(() => {
      tick((t) => t + 1);
      if (Date.now() >= endsAt) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // Coming back from another app is the normal case at the gym. iOS suspends
  // the page while it is backgrounded, so force a render the moment it is
  // visible again rather than waiting on an interval that may not have
  // survived. The remaining time is wall-clock maths, so it is already right.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') tick((t) => t + 1);
    }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, []);

  const remaining = endsAt ? (endsAt - Date.now()) / 1000 : duration;
  const done = endsAt != null && remaining <= 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      chime();
      if (navigator.vibrate) navigator.vibrate([140, 80, 140]);
    }
  }, [done]);

  const pct = endsAt ? Math.max(0, Math.min(1, remaining / duration)) : 1;
  const R = 15;
  const C = 2 * Math.PI * R;
  const accent = color || 'var(--sodium)';

  return (
    <>
      {done && !dismissed && (
        <button
          className="rest-over"
          onClick={() => setDismissed(true)}
          style={{ '--accent': accent }}
          aria-label="Dismiss rest finished"
        >
          <span className="rest-over-ring">
            <Icon name="check" size={44} stroke={2.2} />
          </span>
          <span className="rest-over-title">Rest done</span>
          <span className="rest-over-sub">
            {mmss(duration)} elapsed &middot; tap anywhere for the next set
          </span>
        </button>
      )}

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
              stroke={done ? accent : 'var(--chalk)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 19 19)"
            />
          </svg>

          <div className="timer-read">
            <div
              className="timer-time"
              style={done ? { color: accent } : undefined}
            >
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
                  -15
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ background: accent }}
                  onClick={() => {
                    unlockAudio();
                    onStart();
                  }}
                >
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
    </>
  );
}
