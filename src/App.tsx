import { RecordingsList } from './components/RecordingsList';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import './App.css';

const STATE_LABEL: Record<string, string> = {
  idle: 'Not started',
  listening: 'Listening for sound…',
  recording: 'Recording',
  stopped: 'Stopped',
};

function App() {
  const { state, level, clips, error, start, stop, deleteClip } = useVoiceRecorder();

  const isActive = state === 'listening' || state === 'recording';
  const levelPercent = Math.min(100, Math.round(level * 400));

  return (
    <div className="app">
      <h1>Voice Activity Recorder</h1>
      <p className="subtitle">
        Start listening, then just speak — recording begins automatically on
        sound and stops on silence.
      </p>

      <div className="controls">
        <button
          type="button"
          className={isActive ? 'stop-button' : 'start-button'}
          onClick={isActive ? stop : () => void start()}
        >
          {isActive ? 'Stop Listening' : 'Start Listening'}
        </button>
        <span className={`status status-${state}`}>{STATE_LABEL[state]}</span>
      </div>

      {isActive && (
        <div className="level-meter" aria-hidden="true">
          <div className="level-meter-fill" style={{ width: `${levelPercent}%` }} />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <h2>Recordings</h2>
      <RecordingsList clips={clips} onDelete={deleteClip} />
    </div>
  );
}

export default App;
