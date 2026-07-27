// Default library, transcribed from the original notes.
// Nine exercises appear in two days each; they exist once here and are
// referenced by id, which is what makes weights propagate between days.
//
// Two conflicts were resolved to the heavier value:
//   Leg Extension (Machine): 55 in Anterior A vs 45 in Anterior B -> 55
//   Cable Crunch:            135 in Anterior A vs 130 in Anterior B -> 135

export const SEED_EXERCISES = {
  'incline-press': {
    id: 'incline-press',
    name: 'Incline Press',
    variants: [{ id: 'machine', label: 'Machine', weight: 100 }],
  },
  'shoulder-press': {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    variants: [
      { id: 'machine', label: 'Machine', weight: 90 },
      { id: 'db', label: 'DB', weight: 60 },
    ],
  },
  'hack-squat': {
    id: 'hack-squat',
    name: 'Hack Squat',
    variants: [{ id: 'main', label: null, weight: 135 }],
  },
  'lateral-raise': {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    variants: [{ id: 'main', label: null, weight: 40 }],
  },
  'tricep-pushdown': {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    variants: [{ id: 'main', label: null, weight: 130 }],
  },
  'leg-extension': {
    id: 'leg-extension',
    name: 'Leg Extension',
    variants: [
      { id: 'machine', label: 'Machine', weight: 55 },
      { id: 'cable', label: 'Cable', weight: 230 },
    ],
  },
  'cable-crunch': {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    variants: [{ id: 'main', label: null, weight: 135 }],
  },
  'cable-curl': {
    id: 'cable-curl',
    name: 'Cable Curl',
    variants: [{ id: 'main', label: null, weight: 25 }],
  },
  'upper-row': {
    id: 'upper-row',
    name: 'Upper Row',
    variants: [
      { id: 'plate', label: 'Plate Loaded', weight: 90 },
      { id: 'cable', label: 'Cable', weight: 115 },
    ],
  },
  'lat-pulldown': {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    variants: [{ id: 'main', label: null, weight: 135 }],
  },
  'archer-pull': {
    id: 'archer-pull',
    name: 'Archer Pull',
    variants: [{ id: 'main', label: null, weight: 50 }],
  },
  'hamstring-curl': {
    id: 'hamstring-curl',
    name: 'Hamstring Curl',
    variants: [{ id: 'main', label: null, weight: 145 }],
  },
  'calf-raises': {
    id: 'calf-raises',
    name: 'Calf Raises',
    variants: [
      { id: 'plate', label: 'Plate Loaded', weight: 130 },
      { id: 'cable', label: 'Cable', weight: 270 },
      { id: 'extension', label: 'Extension', weight: 310 },
    ],
  },
  'jm-press': {
    id: 'jm-press',
    name: 'JM Press',
    variants: [{ id: 'main', label: null, weight: 75 }],
  },
  'chest-fly': {
    id: 'chest-fly',
    name: 'Chest Fly',
    variants: [{ id: 'main', label: null, weight: 140 }],
  },
  'rdl': {
    id: 'rdl',
    name: 'RDL',
    variants: [{ id: 'dumbbell', label: 'Dumbbell', weight: 55 }],
  },
  'hammer-curl': {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    variants: [{ id: 'main', label: null, weight: 65 }],
  },
};

// Warm hues for anterior (push), cool for posterior (pull), so the
// week strip reads as push/pull at a glance and A/B by exact hue.
export const DAY_PALETTE = [
  '#F0B429',
  '#35B5A8',
  '#E8654A',
  '#7C86F0',
  '#C88BE0',
  '#7FB236',
];

export const SEED_DAYS = [
  {
    id: 'anterior-a',
    name: 'Anterior A',
    color: '#F0B429',
    exerciseIds: [
      'incline-press',
      'shoulder-press',
      'hack-squat',
      'lateral-raise',
      'tricep-pushdown',
      'leg-extension',
      'cable-crunch',
    ],
  },
  {
    id: 'posterior-a',
    name: 'Posterior A',
    color: '#35B5A8',
    exerciseIds: [
      'cable-curl',
      'upper-row',
      'lat-pulldown',
      'archer-pull',
      'hamstring-curl',
      'calf-raises',
    ],
  },
  {
    id: 'anterior-b',
    name: 'Anterior B',
    color: '#E8654A',
    exerciseIds: [
      'jm-press',
      'incline-press',
      'hack-squat',
      'chest-fly',
      'lateral-raise',
      'leg-extension',
      'cable-crunch',
    ],
  },
  {
    id: 'posterior-b',
    name: 'Posterior B',
    color: '#7C86F0',
    exerciseIds: [
      'lat-pulldown',
      'upper-row',
      'rdl',
      'hammer-curl',
      'hamstring-curl',
      'calf-raises',
    ],
  },
];

export const SEED_SETTINGS = {
  restSeconds: 90,
  increment: 5,
  unit: 'lb',
};

export function freshState() {
  return {
    version: 1,
    exercises: structuredClone(SEED_EXERCISES),
    days: structuredClone(SEED_DAYS),
    sessions: [],
    settings: { ...SEED_SETTINGS },
  };
}
