import { useCallback, useEffect, useRef, useState } from 'react';
import {
  releaseClip,
  VoiceActivityRecorder,
  type RecordedClip,
  type VoiceActivityOptions,
  type VoiceRecorderState,
} from '../lib/audio';

export interface UseVoiceRecorderResult {
  state: VoiceRecorderState;
  level: number;
  clips: RecordedClip[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  deleteClip: (id: string) => void;
}

/**
 * React binding for VoiceActivityRecorder: keeps a list of recorded clips
 * in state and cleans up object URLs / the microphone on unmount.
 */
export function useVoiceRecorder(options?: VoiceActivityOptions): UseVoiceRecorderResult {
  const recorderRef = useRef<VoiceActivityRecorder | null>(null);
  if (!recorderRef.current) {
    recorderRef.current = new VoiceActivityRecorder(options);
  }

  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [level, setLevel] = useState(0);
  const [clips, setClips] = useState<RecordedClip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const recorder = recorderRef.current!;
    const unsubscribe = recorder.on((event) => {
      switch (event.type) {
        case 'state-change':
          setState(event.state);
          break;
        case 'level':
          setLevel(event.level);
          break;
        case 'recording-stop':
          setClips((prev) => [event.clip, ...prev]);
          break;
        case 'error':
          setError(event.error.message);
          break;
      }
    });

    return () => {
      unsubscribe();
      recorder.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const clip of clips) releaseClip(clip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setError(null);
    await recorderRef.current!.start();
  }, []);

  const stop = useCallback(() => {
    recorderRef.current!.stop();
  }, []);

  const deleteClip = useCallback((id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip) releaseClip(clip);
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  return { state, level, clips, error, start, stop, deleteClip };
}
