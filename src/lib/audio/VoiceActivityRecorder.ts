import { EventEmitter } from './eventEmitter';
import { createVolumeMeter, type VolumeMeter } from './volumeMeter';
import { pickSupportedMimeType } from './mimeType';
import type {
  RecordedClip,
  VoiceActivityEvent,
  VoiceActivityListener,
  VoiceActivityOptions,
  VoiceRecorderState,
} from './types';

const DEFAULT_OPTIONS: Required<VoiceActivityOptions> = {
  soundThreshold: 0.02,
  silenceDuration: 1200,
  minRecordingDuration: 300,
  fftSize: 2048,
  analysisIntervalMs: 50,
  mimeType: '',
};

let clipIdCounter = 0;

/**
 * Listens to a microphone stream and automatically records whenever the
 * input is louder than `soundThreshold`, stopping once it has been quiet
 * for `silenceDuration` ms. Emits a `RecordedClip` per utterance.
 */
export class VoiceActivityRecorder {
  private readonly options: Required<VoiceActivityOptions>;
  private readonly emitter = new EventEmitter<VoiceActivityEvent>();

  private state: VoiceRecorderState = 'idle';
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private volumeMeter: VolumeMeter | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingStartedAt = 0;
  private lastSoundAt = 0;
  private intervalId: number | null = null;

  constructor(options: VoiceActivityOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): VoiceRecorderState {
    return this.state;
  }

  on(listener: VoiceActivityListener): () => void {
    return this.emitter.on(listener);
  }

  /** Requests microphone access and starts listening for speech. */
  async start(): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'stopped') return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      this.emitError(error);
      throw error;
    }

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.volumeMeter = createVolumeMeter(this.audioContext, source, this.options.fftSize);

    this.setState('listening');
    this.intervalId = window.setInterval(() => this.tick(), this.options.analysisIntervalMs);
  }

  /** Stops listening/recording and releases the microphone. */
  stop(): void {
    if (this.state === 'idle') return;

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];

    this.volumeMeter?.dispose();
    this.volumeMeter = null;

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    void this.audioContext?.close();
    this.audioContext = null;

    this.setState('stopped');
  }

  private tick(): void {
    if (!this.volumeMeter) return;

    const level = this.volumeMeter.getLevel();
    this.emitter.emit({ type: 'level', level });

    const isSound = level >= this.options.soundThreshold;
    const now = performance.now();

    if (this.state === 'listening' && isSound) {
      this.beginRecording(now);
      return;
    }

    if (this.state === 'recording') {
      if (isSound) {
        this.lastSoundAt = now;
        return;
      }
      if (now - this.lastSoundAt >= this.options.silenceDuration) {
        this.endRecording();
      }
    }
  }

  private beginRecording(now: number): void {
    if (!this.stream) return;

    const mimeType = pickSupportedMimeType(this.options.mimeType);
    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.recordedChunks = [];
    this.recordingStartedAt = now;
    this.lastSoundAt = now;

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => this.handleRecordingStopped(mimeType);

    this.mediaRecorder.onerror = (event) => {
      const error = (event as unknown as { error?: Error }).error ?? new Error('MediaRecorder error');
      this.emitError(error);
    };

    this.mediaRecorder.start();
    this.setState('recording');
    this.emitter.emit({ type: 'recording-start' });
  }

  private endRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private handleRecordingStopped(mimeType: string): void {
    const durationMs = performance.now() - this.recordingStartedAt;
    const chunks = this.recordedChunks;
    this.recordedChunks = [];
    this.mediaRecorder = null;

    if (this.state === 'idle' || this.state === 'stopped') return;

    this.setState('listening');

    if (durationMs < this.options.minRecordingDuration || chunks.length === 0) {
      this.emitter.emit({ type: 'recording-discarded', reason: 'too-short' });
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    const clip: RecordedClip = {
      id: `clip-${Date.now()}-${clipIdCounter++}`,
      blob,
      url: URL.createObjectURL(blob),
      mimeType: blob.type,
      durationMs,
      createdAt: Date.now(),
    };

    this.emitter.emit({ type: 'recording-stop', clip });
  }

  private setState(state: VoiceRecorderState): void {
    this.state = state;
    this.emitter.emit({ type: 'state-change', state });
  }

  private emitError(error: unknown): void {
    this.emitter.emit({
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
