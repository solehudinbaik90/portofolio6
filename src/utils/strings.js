export const MAGIC_8_YES = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
];

export const MAGIC_8_MAYBE = [
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
];

export const MAGIC_8_NO = [
  "Don't count on it.",
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.',
];

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const HINT_HOVER = 'Hover, drag, and click to explore.';
export const HINT_TOUCH = 'Drag and tap to explore.';

export const DISCOVERY_HINTS = [
  (n) => `Only ${n} to go.`,
  (n) => `${n} more to find.`,
  (n) => `Just ${n} left.`,
  () => 'Try going East.',
  () => 'Have you looked left?',
  () => 'Could go righter.',
  () => 'Try changing categories.',
  () => 'Up is down, down is up.',
  () => 'So much to see.',
  () => 'Plenty more to uncover.',
];

export function pickDiscoveryHint(remaining) {
  const fn = DISCOVERY_HINTS[Math.floor(Math.random() * DISCOVERY_HINTS.length)];
  return fn(remaining);
}
