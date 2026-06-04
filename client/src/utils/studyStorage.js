const OPTIONS_KEY = 'memora_study_options';
const LAST_TOPIC_KEY = 'memora_last_topic';

export const DEFAULT_STUDY_OPTIONS = {
  shuffle: true,
  weakOnly: false,
  types: { MCQ: true, TRUE_FALSE: true, FILL_BLANK: true },
  autoAdvance: false,
  timerMinutes: 0,
};

export function getStudyOptions(topicId) {
  try {
    const all = JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}');
    return { ...DEFAULT_STUDY_OPTIONS, ...all[topicId] };
  } catch {
    return { ...DEFAULT_STUDY_OPTIONS };
  }
}

export function saveStudyOptions(topicId, options) {
  try {
    const all = JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}');
    all[topicId] = { ...DEFAULT_STUDY_OPTIONS, ...all[topicId], ...options };
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function buildFlashcardsQuery(mode, options) {
  const params = new URLSearchParams();
  params.set('mode', mode);
  params.set('shuffle', options.shuffle ? 'true' : 'false');
  if (options.weakOnly) params.set('weakOnly', 'true');
  const types = Object.entries(options.types || {})
    .filter(([, on]) => on)
    .map(([t]) => t);
  if (types.length > 0 && types.length < 3) {
    params.set('types', types.join(','));
  }
  return params.toString();
}

export function saveLastTopic(topic) {
  if (!topic?.id) return;
  localStorage.setItem(
    LAST_TOPIC_KEY,
    JSON.stringify({
      topicId: topic.id,
      topicName: topic.name,
      subjectId: topic.subjectId,
      subjectName: topic.subjectName,
      at: Date.now(),
    })
  );
}

export function getLastTopic() {
  try {
    return JSON.parse(localStorage.getItem(LAST_TOPIC_KEY) || 'null');
  } catch {
    return null;
  }
}

/**
 * Subject colors: spread across teal → cyan → forest → olive (earthy greens).
 * Same theme family, clearly distinguishable on the dashboard.
 */
const SUBJECT_PALETTE = [
  { h: 172, s: 58, l: 36, h2: 188, s2: 52, l2: 42 },
  { h: 142, s: 50, l: 30, h2: 158, s2: 48, l2: 38 },
  { h: 195, s: 55, l: 38, h2: 205, s2: 48, l2: 32 },
  { h: 128, s: 45, l: 34, h2: 108, s2: 40, l2: 40 },
  { h: 92, s: 42, l: 38, h2: 78, s2: 38, l2: 32 },
  { h: 160, s: 32, l: 46, h2: 175, s2: 40, l2: 40 },
];

export function subjectAccent(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const p = SUBJECT_PALETTE[Math.abs(hash) % SUBJECT_PALETTE.length];
  return {
    gradient: `linear-gradient(135deg, hsl(${p.h} ${p.s}% ${p.l}%) 0%, hsl(${p.h2} ${p.s2}% ${p.l2}%) 100%)`,
    glow: `hsla(${p.h}, ${p.s}%, ${p.l}%, 0.24)`,
  };
}
