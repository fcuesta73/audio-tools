const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

/**
 * Picks a mimeType MediaRecorder can actually record with in this browser,
 * preferring the caller's choice when supported.
 */
export function pickSupportedMimeType(preferred?: string): string {
  const candidates = preferred
    ? [preferred, ...CANDIDATE_MIME_TYPES]
    : CANDIDATE_MIME_TYPES;

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}
