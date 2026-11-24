const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
const LEVEL_TITLES = ['Beginner', 'Explorer', 'Speaker', 'Storyteller', 'Champion', 'Master', 'Legend', 'Guru', 'Pandit', 'Marathi Ratna'];

export function computeLevel(totalXp: number): { level: number; levelTitle: string } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return { level, levelTitle: LEVEL_TITLES[level - 1] };
}

export function isSameDay(a: Date, b: Date): boolean {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return fmt(a) === fmt(b);
}

export function isYesterday(a: Date, b: Date): boolean {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const aDay = new Date(fmt(a)), bDay = new Date(fmt(b));
  return bDay.getTime() - aDay.getTime() === 86400000;
}
