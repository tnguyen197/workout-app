'use client';

// Every piece of UI chrome is drawn as SVG rather than a text glyph.
// Archivo's latin subset has no arrows, no U+2212 minus and no chevrons,
// so those characters fell back to whatever the OS provided and rendered
// inconsistently on iOS.

const PATHS = {
  minus: 'M4 10h12',
  plus: 'M10 4v12M4 10h12',
  close: 'M5 5l10 10M15 5L5 15',
  left: 'M12 4l-6 6 6 6',
  right: 'M8 4l6 6-6 6',
  up: 'M4 12l6-6 6 6',
  down: 'M4 8l6 6 6-6',
  arrowLeft: 'M16 10H4M9 5l-5 5 5 5',
  arrowRight: 'M4 10h12M11 5l5 5-5 5',
  arrowUp: 'M10 16V4M5 9l5-5 5 5',
  arrowDown: 'M10 4v12M5 11l5 5 5-5',
  chart: 'M3 14l4-5 3 2.5L17 4',
  swap: 'M4 7h11l-3-3M16 13H5l3 3',
};

export default function Icon({ name, size = 18, stroke = 1.75, style }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
