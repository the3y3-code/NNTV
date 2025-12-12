import React, { useState, useEffect } from 'react';
import './App.css'; // Import global app styles
import ControlPanel from './components/ControlPanel';
import MetricsPanel from './components/MetricsPanel';
import ArchitectureCanvas from './components/ArchitectureCanvas';
import HeatmapViewer from './components/HeatmapViewer';
import ExplanationModal from './components/ExplanationModal';

import TrainingLog from './components/TrainingLog';
import UploadZone from './components/UploadZone';
import { socket, connectSocket, disconnectSocket } from './utils/websocket';
import config from './config';

/**
 * App.jsx
 * 
 * The main container for the Neural Network Training Visualizer.
 * It manages the global application state including:
 * 1. Configuration (Dataset, Model, Hyperparameters)
 * 2. Training Status (Idle, Training, Complete)
 * 3. Real-time Metrics (Loss, Accuracy, Weights)
 * 4. WebSocket connection for live updates
 */
function App() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('architecture'); // Toggle between Graph and Heatmap
  const [showHelp, setShowHelp] = useState(false);

  // --- Training Configuration ---
  // We use 'appConfig' to avoid naming collision with the imported 'config' file.
  const [appConfig, setAppConfig] = useState({
    dataset: 'mnist',
    architecture: 'mlp',
    lr: 0.001,
    epochs: 10,
    batch_size: 64
  });

  // --- Real-time Data State ---
  const [status, setStatus] = useState('idle');
  const [metrics, setMetrics] = useState(null); // The latest data packet from backend
  const [history, setHistory] = useState([]);   // Accumulated history for charts
  const [logs, setLogs] = useState([]);

  // Helper to add timestamped logs to the console panel
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message: msg }]);
  };

  // --- WebSocket Setup ---
  // --- WebSocket Setup ---
  const isMounted = React.useRef(false);

  useEffect(() => {
    // Prevent double-connection/logging in StrictMode (dev)
    if (!socket.connected) {
      connectSocket();
      addLog("Connecting to server...");
    }

    // Define handlers so they can be removed by reference (though anonymous wrappers w/ socket.off(name) work too for all)
    // For simplicity in this codebase, strict event name removal works well since we have single listeners per event type usually.

    socket.on('status', (data) => addLog(data.msg));
    socket.on('log', (data) => addLog(data.message)); // Display backend debug logs

    // Listen for the high-frequency training updates (every 10 batches or so)
    socket.on('training_update', (data) => {
      setMetrics(data);
      setHistory(prev => [...prev, data]);
      // Only log occasionally to avoid spamming the log panel
      if (data.batch % 100 === 0) {
        addLog(`Epoch ${data.epoch} | Batch ${data.batch}/${data.total_batches} | Loss: ${data.loss.toFixed(4)}`);
      }
    });

    socket.on('training_complete', () => {
      setStatus('complete');
      addLog("Training Complete!");
    });

    // Cleanup on unmount
    return () => {
      socket.off('status');
      socket.off('log');
      socket.off('training_update');
      socket.off('training_complete');
      disconnectSocket();
    };
  }, []);

  // --- Handlers ---
  const handleStart = async () => {
    try {
      addLog(`Starting training with ${appConfig.architecture} on ${appConfig.dataset}...`);
      // Send the configuration to the backend to initialize the Trainer
      const response = await fetch(`${config.API_URL}/api/start-training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appConfig)
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('training');
        setHistory([]); // Reset charts for new run
      } else {
        const msg = data.message || data.error || data.status || "Unknown error";
        addLog("Error starting: " + msg);
        alert("Error starting: " + msg);
      }
    } catch (error) {
      console.error("Failed to start training:", error);
      addLog("Failed to start training: " + error.message);
    }
  };

  const handleStop = async () => {
    try {
      addLog("Stopping training...");
      await fetch(`${config.API_URL}/api/stop-training`, { method: 'POST' });
      setStatus('idle');
      addLog("Training stopped by user.");
    } catch (error) {
      console.error("Failed to stop training:", error);
    }
  };

  return (
    <div className="app-container">
      {/* Header with Tabs and Help */}
      <header className="app-header">
        <h1>NNTV</h1>
        <div className="tabs">
          <button
            className={`nav-btn ${activeTab === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveTab('architecture')}
          >Architecture</button>
          <button
            className={`nav-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >Heatmaps</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setShowHelp(true)} className="help-btn">?</button>
          <span className="status-badge" style={{ textTransform: 'uppercase' }}>{status}</span>
        </div>
      </header>

      <ExplanationModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Main 3-Column Layout */}
      <main className="main-content" style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', padding: '20px', gap: '20px' }}>

        {/* Left Sidebar: Controls */}
        <aside className="left-sidebar" style={{ width: '300px', background: '#0f172a', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <ControlPanel config={appConfig} setConfig={setAppConfig} onStart={handleStart} onStop={handleStop} isTraining={status === 'training'} />

          {/* Export Section at bottom of sidebar */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #334155' }}>
            <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>Export</h4>
            <button className="btn secondary" style={{ width: '100%' }}>Download Model (.pth)</button>
          </div>
        </aside>

        {/* Center: Visualization Canvas */}
        <div className="center-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
          <section className="center-view" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}> {/* Wrapper to contain canvas/heatmap */}
              {activeTab === 'architecture' && <ArchitectureCanvas config={appConfig} weights={metrics} isTraining={status === 'training'} />}
              {activeTab === 'heatmap' && <HeatmapViewer appConfig={appConfig} weights={metrics} isTraining={status === 'training'} />}
            </div>
          </section>

          <TrainingLog logs={logs} />
        </div>

        {/* Right: Charts & Stats */}
        <aside className="right-sidebar" style={{ width: '350px', minWidth: '350px', flexShrink: 0, background: '#0f172a', padding: '20px', borderRadius: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
          <MetricsPanel metrics={metrics} history={history} />

        </aside>

        {/* Floating Upload Widget (Only visible when model exists/training started) */}
        {status !== 'idle' && <UploadZone />}
      </main>
    </div>
  );
}

export default App;
