import { supabase } from '../lib/supabase';
import { enqueueRequest } from '../hooks/useOfflineSync';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic API response type used throughout the client.
 * `unknown` is used instead of `any` — callers must narrow before use.
 * Using a branded wrapper keeps the eslint no-explicit-any rule satisfied
 * while preserving the flexibility needed for a multi-shape REST API.
 */
export type ApiResponse = Record<string, unknown>;

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Offline: queue mutating requests and return a synthetic pending response
  if (!navigator.onLine && options.method && options.method !== 'GET') {
    let rawReferenceId: unknown;
    try {
      rawReferenceId = options.body ? JSON.parse(options.body as string)?.referenceId : null;
    } catch {
      rawReferenceId = null;
    }
    // Sanitize referenceId — allow only alphanumeric, hyphens, underscores (max 128 chars)
    const referenceId = (typeof rawReferenceId === 'string' && /^[\w-]{1,128}$/.test(rawReferenceId))
      ? rawReferenceId
      : `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Only queue requests targeting our own API paths (must start with /api/)
    if (!path.startsWith('/api/')) {
      throw new Error('Invalid API path');
    }
    await enqueueRequest({
      id: referenceId,
      url: `${BASE}${path}`,
      method: options.method,
      body: (options.body as string) ?? '{}',
      timestamp: Date.now(),
    });
    return { queued: true, referenceId } as unknown as T;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

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

// ─── Quiz answer type (used by quizzesApi.submit) ────────────────────────────
export type QuizAnswer = { questionId: string; answer: string; timeTakenMs?: number };

// ─── Lessons ──────────────────────────────────────────────────────────────────
export const lessonsApi = {
  list: (level?: string, page = 1) => get<ApiResponse>(`/api/lessons?${new URLSearchParams({ ...(level ? { level } : {}), page: String(page), limit: '10' })}`) ,
  get: (id: string) => get<ApiResponse>(`/api/lessons/${id}`),
};

// ─── Progress ─────────────────────────────────────────────────────────────────
export const progressApi = {
  save: (lessonId: string, status: string, score?: number) => post<ApiResponse>('/api/progress', { lessonId, status, score }),
  dashboard: () => get<ApiResponse>('/api/progress/dashboard'),
  childDashboard: (childId: string) => get<ApiResponse>(`/api/progress/child-dashboard?childId=${childId}`),
};

// ─── Speech ───────────────────────────────────────────────────────────────────
export const speechApi = {
  evaluate: async (audioBlob: Blob, expectedText: string, attemptNumber: number, referenceId?: string) => {
    const buffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return post<ApiResponse>('/api/speech?action=transcribe', { audioData: audioBase64, language: 'mr', expectedText, attemptNumber, referenceId });
  },
};

// ─── Writing ──────────────────────────────────────────────────────────────────
export const writingApi = {
  characters: (level?: string, lessonId?: string) => get<ApiResponse>(`/api/writing/characters?${new URLSearchParams({ ...(level ? { level } : {}), ...(lessonId ? { lessonId } : {}) })}`),
  lessons: (level?: string) => get<ApiResponse>(`/api/writing/lessons?${level ? `level=${level}` : ''}`),
  lesson: (id: string) => get<ApiResponse>(`/api/writing/lessons?id=${id}`),
  evaluate: (characterId: string, userStrokes: { x: number; y: number }[][], referenceId?: string) =>
    post<ApiResponse>('/api/writing/evaluate', { characterId, userStrokes, referenceId }),
  progress: () => get<ApiResponse>('/api/writing/progress'),
};

// ─── Reading ──────────────────────────────────────────────────────────────────
export const readingApi = {
  passages: (level?: string, lessonId?: string) => get<ApiResponse>(`/api/reading/passages?${new URLSearchParams({ ...(level ? { level } : {}), ...(lessonId ? { lessonId } : {}) })}`),
  passage: (id: string) => get<ApiResponse>(`/api/reading/passages/${id}`),
  submitReadAloud: (passageId: string, audioBlob: Blob, elapsedSeconds: number) =>
    audioBlob.arrayBuffer().then(buf => {
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return post<ApiResponse>('/api/reading/read-aloud', { passageId, audioBase64, elapsedSeconds });
    }),
  submitComprehension: (passageId: string, answers: { questionId: string; answer: string }[]) =>
    post<ApiResponse>('/api/reading/comprehension', { passageId, answers }),
  progress: () => get<ApiResponse>('/api/reading/progress'),
};

// ─── Gamification ─────────────────────────────────────────────────────────────
export const gamificationApi = {
  xp: () => get<ApiResponse>('/api/gamification/xp'),
  awardXp: (xpAmount: number, source: string, referenceId?: string) =>
    post<ApiResponse>('/api/gamification/xp', { xpAmount, source, referenceId }),
  streak: () => get<ApiResponse>('/api/gamification/streak'),
  recordActivity: () => post<ApiResponse>('/api/gamification/streak', {}),
  useStreakFreeze: () => post<ApiResponse>('/api/gamification/streak/freeze', {}),
  badges: () => get<ApiResponse>('/api/gamification/badges'),
  dailyChallenge: () => get<ApiResponse>('/api/gamification/challenge/today'),
  completeChallenge: (challengeId: string, score: number) =>
    post<ApiResponse>('/api/gamification/challenge/complete', { challengeId, score }),
  leaderboard: () => get<ApiResponse>('/api/gamification/leaderboard'),
};

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzesApi = {
  getByLesson: (lessonId: string) => get<ApiResponse>(`/api/quizzes?lessonId=${lessonId}`),
  submit: (lessonId: string, answers: QuizAnswer[], referenceId?: string) =>
    post<ApiResponse>('/api/quizzes/submit', { lessonId, answers, referenceId }),
};

// ─── Fun Facts ────────────────────────────────────────────────────────────────
export const funFactsApi = {
  today: () => get<ApiResponse>('/api/fun-facts?action=today'),
  random: (category?: string) => get<ApiResponse>(`/api/fun-facts?action=random${category ? `&category=${category}` : ''}`),
  favorites: () => get<ApiResponse>('/api/fun-facts?action=favorites'),
  toggleFavorite: (factId: string) => post<ApiResponse>('/api/fun-facts?action=toggle', { factId }),
  submitQuiz: (factId: string, answer: string, correctAnswer: string) =>
    post<ApiResponse>('/api/fun-facts?action=quiz', { factId, answer, correctAnswer }),
};

// ─── Story ────────────────────────────────────────────────────────────────────
export const storyApi = {
  chapters: () => get<ApiResponse>('/api/story/chapters'),
  scenes: (chapterId: string) => get<ApiResponse>(`/api/story/scenes?chapterId=${chapterId}`),
  saveProgress: (chapterId: string, currentSceneId: string, status: string) =>
    post<ApiResponse>('/api/story/progress', { chapterId, currentSceneId, status }),
};

// ─── Mini Games ───────────────────────────────────────────────────────────────
export const miniGamesApi = {
  get: (type: string, level?: string) => get<ApiResponse>(`/api/mini-games?type=${type}${level ? `&level=${level}` : ''}`),
  submit: (gameId: string, score: number, referenceId?: string) =>
    post<ApiResponse>('/api/mini-games', { gameId, score, referenceId }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  register: (token: string) => post<ApiResponse>('/api/notifications?action=register', { token }),
  preferences: () => get<ApiResponse>('/api/notifications?action=preferences'),
  updatePreferences: (prefs: object) => put<ApiResponse>('/api/notifications?action=preferences', prefs),
  removeDevice: (token: string) => post<ApiResponse>('/api/notifications?action=remove', { token }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  avatar: () => get<ApiResponse>('/api/profile/avatar'),
  updateAvatar: (equippedItems: string[]) => put<ApiResponse>('/api/profile/avatar?action=equip', { equippedItems }),
  unlockItem: (itemId: string) => post<ApiResponse>('/api/profile/avatar?action=unlock', { itemId }),
};

// ─── Journey ──────────────────────────────────────────────────────────────────
export const journeyApi = {
  get: () => get<ApiResponse>('/api/journey/get'),
  start: (routeId: string) => post<ApiResponse>('/api/journey/start', { routeId }),
  update: (xpEarned: number, lessonId?: string) => post<ApiResponse>('/api/journey/update', { xpEarned, lessonId }),
  routes: () => get<ApiResponse>('/api/journey/routes'),
  checkpoint: (id: string) => get<ApiResponse>(`/api/journey/checkpoints/${id}`),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  linkChild: (childEmail: string) => post<ApiResponse>('/api/auth/link-child', { childEmail }),
  unlinkChild: (childId: string) => post<ApiResponse>('/api/auth/unlink-child', { childId }),
};
