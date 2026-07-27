'use client';

const W = 320;
const H = 118;
const PAD = { top: 12, right: 6, bottom: 18, left: 30 };

function shortDate(key) {
  const [, m, d] = key.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function ProgressChart({ history, unit = 'lb' }) {
  if (!history.length) {
    return (
      <p className="empty">
        No history yet.
        <br />
        Finish a workout and this fills in.
      </p>
    );
  }

  const weights = history.map((p) => p.weight);
  const first = weights[0];
  const current = weights[weights.length - 1];
  const delta = current - first;

  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  const span = hi - lo || Math.max(10, hi * 0.1);
  const yMin = lo - span * 0.25;
  const yMax = hi + span * 0.25;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i) =>
    history.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (i / (history.length - 1)) * plotW;
  const y = (w) => PAD.top + plotH - ((w - yMin) / (yMax - yMin)) * plotH;

  const line = history.map((p, i) => `${x(i)},${y(p.weight)}`).join(' ');
  const area = `${PAD.left},${PAD.top + plotH} ${line} ${x(history.length - 1)},${
    PAD.top + plotH
  }`;

  return (
    <>
      <div className="chart-stats">
        <div>
          <div className="stat-val">
            {current}
            <span style={{ fontSize: 12, color: 'var(--smoke-dim)' }}> {unit}</span>
          </div>
          <div className="stat-label">current</div>
        </div>
        <div>
          <div className={`stat-val${delta > 0 ? ' up' : ''}`}>
            {delta > 0 ? '+' : ''}
            {delta}
          </div>
          <div className="stat-label">all time</div>
        </div>
        <div>
          <div className="stat-val">{history.length}</div>
          <div className="stat-label">
            {history.length === 1 ? 'session' : 'sessions'}
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Weight history, ${first} to ${current} ${unit}`}
        >
          <line
            x1={PAD.left}
            y1={y(hi)}
            x2={W - PAD.right}
            y2={y(hi)}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
          <line
            x1={PAD.left}
            y1={y(lo)}
            x2={W - PAD.right}
            y2={y(lo)}
            stroke="var(--line-soft)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={y(hi)}
            textAnchor="end"
            dominantBaseline="central"
            fill="var(--smoke-dim)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {hi}
          </text>
          {lo !== hi && (
            <text
              x={PAD.left - 6}
              y={y(lo)}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--smoke-dim)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {lo}
            </text>
          )}

          {history.length > 1 && (
            <polygon points={area} fill="var(--sodium)" opacity="0.07" />
          )}
          {history.length > 1 && (
            <polyline
              points={line}
              fill="none"
              stroke="var(--sodium)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {history.map((p, i) => (
            <circle
              key={p.date + i}
              cx={x(i)}
              cy={y(p.weight)}
              r={i === history.length - 1 ? 3.5 : 2.5}
              fill={i === history.length - 1 ? 'var(--sodium)' : 'var(--iron)'}
              stroke="var(--sodium)"
              strokeWidth="1.5"
            />
          ))}

          <text
            x={PAD.left}
            y={H - 4}
            fill="var(--smoke-dim)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {shortDate(history[0].date)}
          </text>
          {history.length > 1 && (
            <text
              x={W - PAD.right}
              y={H - 4}
              textAnchor="end"
              fill="var(--smoke-dim)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {shortDate(history[history.length - 1].date)}
            </text>
          )}
        </svg>
      </div>
    </>
  );
}

/** Tiny inline trend line for the progress list on the home screen. */
export function Sparkline({ history, color = 'var(--smoke)', w = 54, h = 18 }) {
  if (history.length < 2) {
    return (
      <svg width={w} height={h} aria-hidden="true" style={{ display: 'block' }}>
        <line
          x1="2"
          y1={h / 2}
          x2={w - 2}
          y2={h / 2}
          stroke="var(--line)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  const ws = history.map((p) => p.weight);
  const lo = Math.min(...ws);
  const hi = Math.max(...ws);
  const range = hi - lo || 1;
  const pts = history
    .map((p, i) => {
      const x = 2 + (i / (history.length - 1)) * (w - 4);
      const y = h - 3 - ((p.weight - lo) / range) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: 'block' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
