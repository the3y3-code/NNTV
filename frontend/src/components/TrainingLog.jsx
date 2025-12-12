import React, { useEffect, useRef } from 'react';

/**
 * TrainingLog Component
 * 
 * Displays a scrolling terminal-like log of backend events.
 * It automatically scrolls to the bottom when new logs are added to keep the latest info visible.
 */
const TrainingLog = ({ logs }) => {
    const logRef = useRef(null);

    // Auto-scroll effect
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="training-log" style={{ height: '180px', minWidth: '85ch', background: '#222', color: '#0f0', borderTop: '1px solid #444', fontFamily: 'monospace', padding: '10px', overflowY: 'auto' }}>
            <div ref={logRef}>
                {logs.map((log, index) => (
                    <div key={index} className="log-entry">
                        <span style={{ color: '#888' }}>[{log.time}]</span> {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrainingLog;
