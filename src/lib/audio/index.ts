export { VoiceActivityRecorder } from './VoiceActivityRecorder';
export type {
  RecordedClip,
  VoiceActivityEvent,
  VoiceActivityListener,
  VoiceActivityOptions,
  VoiceRecorderState,
} from './types';

/** Frees the object URL backing a recorded clip. Call once you're done with it. */
export function releaseClip(clip: { url: string }): void {
  URL.revokeObjectURL(clip.url);
}
