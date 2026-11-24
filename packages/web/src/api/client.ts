import { supabase } from '../lib/supabase';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthenticated'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });

// ─── Lessons ──────────────────────────────────────────────────────────────────
export const lessonsApi = {
  list: (level?: string, page = 1) => get<any>(`/api/lessons?${new URLSearchParams({ ...(level ? { level } : {}), page: String(page), limit: '10' })}`),
  get: (id: string) => get<any>(`/api/lessons/${id}`),
};

// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressApi = {
  save: (lessonId: string, status: string, score?: number) => post<any>('/api/progress/save', { lessonId, status, score }),
  dashboard: () => get<any>('/api/progress/dashboard'),
};

// ─── Speech ───────────────────────────────────────────────────────────────────
export const speechApi = {
  evaluate: async (audioBlob: Blob, expectedText: string, attemptNumber: number, referenceId?: string) => {
    const buffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return post<any>('/api/speech?action=transcribe', { audioData: audioBase64, language: 'mr', expectedText, attemptNumber, referenceId });
  },
};

// ─── Writing ──────────────────────────────────────────────────────────────────
export const writingApi = {
  characters: (level?: string, lessonId?: string) => get<any>(`/api/writing/characters?${new URLSearchParams({ ...(level ? { level } : {}), ...(lessonId ? { lessonId } : {}) })}`),
  lessons: (level?: string) => get<any>(`/api/writing/lessons?${level ? `level=${level}` : ''}`),
  lesson: (id: string) => get<any>(`/api/writing/lessons?id=${id}`),
  evaluate: (characterId: string, userStrokes: { x: number; y: number }[][], referenceId?: string) =>
    post<any>('/api/writing/evaluate', { characterId, userStrokes, referenceId }),
  progress: () => get<any>('/api/writing/progress'),
};

// ─── Reading ──────────────────────────────────────────────────────────────────
export const readingApi = {
  passages: (level?: string, lessonId?: string) => get<any>(`/api/reading/passages?${new URLSearchParams({ ...(level ? { level } : {}), ...(lessonId ? { lessonId } : {}) })}`),
  passage: (id: string) => get<any>(`/api/reading/passages/${id}`),
  submitReadAloud: (passageId: string, audioBlob: Blob, elapsedSeconds: number) =>
    audioBlob.arrayBuffer().then(buf => {
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return post<any>('/api/reading/read-aloud', { passageId, audioBase64, elapsedSeconds });
    }),
  submitComprehension: (passageId: string, answers: { questionId: string; answer: string }[]) =>
    post<any>('/api/reading/comprehension', { passageId, answers }),
  progress: () => get<any>('/api/reading/progress'),
};

// ─── Gamification ─────────────────────────────────────────────────────────────
export const gamificationApi = {
  xp: () => get<any>('/api/gamification/xp/get'),
  awardXp: (xpAmount: number, source: string, referenceId?: string) =>
    post<any>('/api/gamification/xp/award', { xpAmount, source, referenceId }),
  streak: () => get<any>('/api/gamification/streak/get'),
  recordActivity: () => post<any>('/api/gamification/streak/record', {}),
  badges: () => get<any>('/api/gamification/badges/get'),
  dailyChallenge: () => get<any>('/api/gamification/challenge/today'),
  completeChallenge: (challengeId: string, score: number) =>
    post<any>('/api/gamification/challenge/complete', { challengeId, score }),
  leaderboard: () => get<any>('/api/gamification/leaderboard'),
};

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzesApi = {
  getByLesson: (lessonId: string) => get<any>(`/api/quizzes?lessonId=${lessonId}`),
  submit: (lessonId: string, answers: any[], referenceId?: string) =>
    post<any>('/api/quizzes/submit', { lessonId, answers, referenceId }),
};

// ─── Fun Facts ────────────────────────────────────────────────────────────────
export const funFactsApi = {
  today: () => get<any>('/api/fun-facts?action=today'),
  random: (category?: string) => get<any>(`/api/fun-facts?action=random${category ? `&category=${category}` : ''}`),
  favorites: () => get<any>('/api/fun-facts?action=favorites'),
  toggleFavorite: (factId: string) => post<any>('/api/fun-facts?action=toggle', { factId }),
  submitQuiz: (_factId: string, answer: string, correctAnswer: string) =>
    post<any>('/api/fun-facts?action=quiz', { answer, correctAnswer }),
};

// ─── Story ────────────────────────────────────────────────────────────────────
export const storyApi = {
  chapters: () => get<any>('/api/story/chapters'),
  scenes: (chapterId: string) => get<any>(`/api/story/scenes?chapterId=${chapterId}`),
  saveProgress: (chapterId: string, currentSceneId: string, status: string) =>
    post<any>('/api/story/progress', { chapterId, currentSceneId, status }),
};

// ─── Mini Games ───────────────────────────────────────────────────────────────
export const miniGamesApi = {
  get: (type: string, level?: string) => get<any>(`/api/mini-games?type=${type}${level ? `&level=${level}` : ''}`),
  submit: (gameId: string, score: number, referenceId?: string) =>
    post<any>('/api/mini-games', { gameId, score, referenceId }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  register: (token: string) => post<any>('/api/notifications?action=register', { token }),
  preferences: () => get<any>('/api/notifications?action=preferences'),
  updatePreferences: (prefs: object) => put<any>('/api/notifications?action=preferences', prefs),
  removeDevice: (token: string) => post<any>('/api/notifications?action=remove', { token }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  avatar: () => get<any>('/api/profile/avatar'),
  updateAvatar: (equippedItems: string[]) => put<any>('/api/profile/avatar?action=equip', { equippedItems }),
  unlockItem: (itemId: string) => post<any>('/api/profile/avatar?action=unlock', { itemId }),
};

// ─── Journey ──────────────────────────────────────────────────────────────────
export const journeyApi = {
  get: () => get<any>('/api/journey/get'),
  start: (routeId: string) => post<any>('/api/journey/start', { routeId }),
  update: (xpEarned: number, lessonId?: string) => post<any>('/api/journey/update', { xpEarned, lessonId }),
  routes: () => get<any>('/api/journey/routes'),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  linkChild: (childEmail: string) => post<any>('/api/auth/link-child', { childEmail }),
};
