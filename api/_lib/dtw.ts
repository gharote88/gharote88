type Point = { x: number; y: number };
type Stroke = Point[];

function euclidean(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function dtw(s: Stroke, t: Stroke): number {
  const n = s.length, m = t.length;
  const dp: number[][] = Array.from({ length: n }, () => Array(m).fill(Infinity));
  dp[0][0] = euclidean(s[0], t[0]);
  for (let i = 1; i < n; i++) dp[i][0] = dp[i - 1][0] + euclidean(s[i], t[0]);
  for (let j = 1; j < m; j++) dp[0][j] = dp[0][j - 1] + euclidean(s[0], t[j]);
  for (let i = 1; i < n; i++)
    for (let j = 1; j < m; j++)
      dp[i][j] = euclidean(s[i], t[j]) + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[n - 1][m - 1];
}

export function dtwScore(refStrokes: Stroke[], userStrokes: Stroke[], penalty = 20): number {
  if (!refStrokes.length || !userStrokes.length) return 0;
  const count = Math.min(refStrokes.length, userStrokes.length);
  let total = 0;
  for (let i = 0; i < count; i++) {
    const ref = refStrokes[i], user = userStrokes[i];
    if (!ref.length || !user.length) continue;
    const dist = dtw(ref, user);
    total += Math.max(0, 1 - dist / (Math.max(ref.length, user.length) * 100)) * 100;
  }
  const missing = Math.max(0, refStrokes.length - userStrokes.length);
  return Math.max(0, Math.min(100, Math.round(total / count - missing * penalty)));
}
