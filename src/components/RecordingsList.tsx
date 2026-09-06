import type { RecordedClip } from '../lib/audio';
import { formatDuration, formatTime } from '../utils/format';

interface RecordingsListProps {
  clips: RecordedClip[];
  onDelete: (id: string) => void;
}

export function RecordingsList({ clips, onDelete }: RecordingsListProps) {
  if (clips.length === 0) {
    return <p className="recordings-empty">No recordings yet — speak into the mic to create one.</p>;
  }

  return (
    <ul className="recordings-list">
      {clips.map((clip) => (
        <li key={clip.id} className="recording-item">
          <div className="recording-meta">
            <span className="recording-time">{formatTime(clip.createdAt)}</span>
            <span className="recording-duration">{formatDuration(clip.durationMs)}</span>
          </div>
          <audio controls src={clip.url} className="recording-player" />
          <button
            type="button"
            className="delete-button"
            onClick={() => onDelete(clip.id)}
            aria-label="Delete recording"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
