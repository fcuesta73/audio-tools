export interface VolumeMeter {
  /** Current RMS amplitude of the input signal, in the range 0-1. */
  getLevel(): number;
  /** Disconnects the analyser. Does not close the audio context. */
  dispose(): void;
}

/**
 * Wraps a Web Audio AnalyserNode to expose a simple RMS level reading,
 * used to detect when someone is speaking into the microphone.
 */
export function createVolumeMeter(
  audioContext: AudioContext,
  sourceNode: AudioNode,
  fftSize: number,
): VolumeMeter {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.2;
  sourceNode.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);

  const getLevel = (): number => {
    analyser.getFloatTimeDomainData(buffer);
    let sumOfSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    return Math.sqrt(sumOfSquares / buffer.length);
  };

  const dispose = (): void => {
    sourceNode.disconnect(analyser);
    analyser.disconnect();
  };

  return { getLevel, dispose };
}
