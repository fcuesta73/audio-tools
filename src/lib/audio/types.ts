export type VoiceRecorderState = 'idle' | 'listening' | 'recording' | 'stopped';

export interface VoiceActivityOptions {
  /**
   * RMS amplitude (0-1) above which audio is considered "sound".
   * Mic noise floor is usually well under 0.02; raise this in noisy rooms.
   */
  soundThreshold?: number;
  /** Milliseconds of continuous silence required to end a recording. */
  silenceDuration?: number;
  /** Recordings shorter than this (ms) are discarded as noise blips. */
  minRecordingDuration?: number;
  /** FFT size for the analyser node driving level detection. */
  fftSize?: number;
  /** How often (ms) the audio level is sampled. */
  analysisIntervalMs?: number;
  /** Preferred MediaRecorder mimeType; falls back to a supported one. */
  mimeType?: string;
}

export interface RecordedClip {
  id: string;
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
  createdAt: number;
}

export type VoiceActivityEvent =
  | { type: 'state-change'; state: VoiceRecorderState }
  | { type: 'level'; level: number }
  | { type: 'recording-start' }
  | { type: 'recording-stop'; clip: RecordedClip }
  | { type: 'recording-discarded'; reason: 'too-short' }
  | { type: 'error'; error: Error };

export type VoiceActivityListener = (event: VoiceActivityEvent) => void;
