import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';

interface JourneyProgress {
  currentPosition: { x: number; y: number };
  currentCheckpointIndex: number;
  totalXpEarned: number;
  progressPercentage: number;
  lastUpdated: number;
}

interface CheckpointUnlock {
  checkpointId: string;
  lessons: string[];
  trivia: string[];
  badges: string[];
}

interface JourneyUpdateResult {
  success: boolean;
  newPosition: { x: number; y: number };
  progressPercentage: number;
  newUnlocks: CheckpointUnlock[];
  journeyCompleted: boolean;
}

export const useJourneyProgression = () => {
  const [journeyProgress, setJourneyProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevXpRef = useRef<number>(0);

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;

      // Initial fetch
      const { data, error: fetchError } = await supabase
        .from('journey_progress')
        .select('current_position, current_checkpoint_index, total_xp_earned, progress_percentage, updated_at')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        setError('Failed to load journey progress');
      } else if (data) {
        prevXpRef.current = data.total_xp_earned;
        setJourneyProgress({
          currentPosition: data.current_position,
          currentCheckpointIndex: data.current_checkpoint_index,
          totalXpEarned: data.total_xp_earned,
          progressPercentage: data.progress_percentage,
          lastUpdated: new Date(data.updated_at).getTime(),
        });
      }
      setLoading(false);

      // Realtime subscription — filter by user_id after we have it
      channel = supabase
        .channel(`journey_progress:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'journey_progress',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const d = payload.new;
            prevXpRef.current = d.total_xp_earned;
            setJourneyProgress({
              currentPosition: d.current_position,
              currentCheckpointIndex: d.current_checkpoint_index,
              totalXpEarned: d.total_xp_earned,
              progressPercentage: d.progress_percentage,
              lastUpdated: new Date(d.updated_at).getTime(),
            });
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const updateProgress = useCallback(async (xpEarned: number, lessonId?: string): Promise<JourneyUpdateResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ xpEarned, lessonId }),
    });

    if (!res.ok) throw new Error('Failed to update journey progress');
    const result: JourneyUpdateResult = await res.json();

    if (result.journeyCompleted) triggerJourneyCompletion();
    if (result.newUnlocks.length > 0) triggerCheckpointUnlocks(result.newUnlocks);

    return result;
  }, []);

  const calculateProgress = useCallback((currentXp: number, totalXpRequired: number) =>
    Math.min((currentXp / totalXpRequired) * 100, 100), []);

  const shouldUnlockCheckpoint = useCallback((userXp: number, requiredXp: number) =>
    userXp >= requiredXp, []);

  const getDistanceToNextCheckpoint = useCallback((currentXp: number, nextCheckpointXp: number) =>
    Math.max(0, nextCheckpointXp - currentXp), []);

  const triggerJourneyCompletion = useCallback(() => {
    console.log('🎉 Journey completed!');
  }, []);

  const triggerCheckpointUnlocks = useCallback((unlocks: CheckpointUnlock[]) => {
    unlocks.forEach((u) => console.log(`🔓 Checkpoint unlocked: ${u.checkpointId}`));
  }, []);

  const getJourneyStats = useCallback(() => {
    if (!journeyProgress) return null;
    return {
      totalXp: journeyProgress.totalXpEarned,
      progress: journeyProgress.progressPercentage,
      currentCheckpoint: journeyProgress.currentCheckpointIndex,
      lastUpdated: new Date(journeyProgress.lastUpdated),
    };
  }, [journeyProgress]);

  const resetJourney = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    console.log('Resetting journey...');
  }, []);

  return {
    journeyProgress, loading, error,
    updateProgress, calculateProgress,
    shouldUnlockCheckpoint, getDistanceToNextCheckpoint,
    getJourneyStats, resetJourney,
  };
};

export const useAutoJourneyUpdate = () => {
  const { updateProgress } = useJourneyProgression();
  const prevXpRef = useRef<number>(0);

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Seed prevXp from current user row
      const { data } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', userId)
        .single();
      if (data) prevXpRef.current = data.total_xp ?? 0;

      channel = supabase
        .channel(`users_xp:${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
          async (payload) => {
            const newTotalXp: number = payload.new.total_xp ?? 0;
            const xpDelta = newTotalXp - prevXpRef.current;
            prevXpRef.current = newTotalXp;
            if (xpDelta > 0) {
              try { await updateProgress(xpDelta); }
              catch (e) { console.error('Error auto-updating journey:', e); }
            }
          }
        )
        .subscribe();
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [updateProgress]);
};

export const useCheckpointOperations = () => {
  const [unlockedCheckpoints, setUnlockedCheckpoints] = useState<string[]>([]);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('journey_progress')
        .select('unlocked_checkpoints, completed_checkpoints')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUnlockedCheckpoints(data.unlocked_checkpoints ?? []);
        setCompletedCheckpoints(data.completed_checkpoints ?? []);
      }
    };
    load();
  }, []);

  const isCheckpointUnlocked = useCallback((id: string) => unlockedCheckpoints.includes(id), [unlockedCheckpoints]);
  const isCheckpointCompleted = useCallback((id: string) => completedCheckpoints.includes(id), [completedCheckpoints]);
  const getNextCheckpoint = useCallback((all: string[]) =>
    all.find((id) => !isCheckpointCompleted(id)) ?? null, [completedCheckpoints, isCheckpointCompleted]);

  return { unlockedCheckpoints, completedCheckpoints, isCheckpointUnlocked, isCheckpointCompleted, getNextCheckpoint };
};
