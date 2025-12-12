import React, { useState, useEffect, useRef } from 'react';
import config from '../config';

/**
 * HeatmapViewer Component
 * 
 * Provides a deep-dive look into the "brain" of the neural network by visualizing
 * the actual weight matrices of the Linear layers.
 * 
 * Logic:
 * 1. Polls the backend for weight data of the selected layer.
 * 2. Renders the matrix as a heatmap on an HTML Canvas.
 * 3. Red pixels = Positive weights (Excitory), Blue pixels = Negative weights (Inhibitory).
 */
const HeatmapViewer = ({ appConfig, isTraining }) => {
    const [layer, setLayer] = useState(appConfig && appConfig.architecture === 'lenet' ? 'conv1.weight' : 'fc1.weight');
    const [data, setData] = useState(null);
    const canvasRef = useRef(null);

    // Dynamic Layer List based on Architecture
    // This resolves the issue where ResNet/LeNet layermaps were broken.
    const ARCH_LAYERS = {
        'mlp': [
            { id: 'fc1.weight', name: 'FC1 (Input -> Hidden 1)' },
            { id: 'fc2.weight', name: 'FC2 (Hidden 1 -> Hidden 2)' },
            { id: 'fc3.weight', name: 'FC3 (Hidden 2 -> Output)' }
        ],
        'lenet': [
            { id: 'conv1.weight', name: 'Conv1 (Input -> FeatMap 1)' },
            { id: 'conv2.weight', name: 'Conv2 (FeatMap 1 -> FeatMap 2)' },
            { id: 'fc1.weight', name: 'FC1 (FeatMap -> Hidden)' },
            { id: 'fc2.weight', name: 'FC2 (Hidden -> Output)' }
        ],
        'resnet': [
            { id: 'model.conv1.weight', name: 'Conv1 (Initial)' },
            { id: 'model.layer1.0.conv1.weight', name: 'Block1 Conv1' },
            { id: 'model.layer2.0.conv1.weight', name: 'Block2 Conv1' },
            { id: 'model.fc.weight', name: 'FC (Final Output)' }
        ]
    };

    const currentLayers = (appConfig && ARCH_LAYERS[appConfig.architecture]) || ARCH_LAYERS['mlp'];

    // Update selected layer if architecture changes
    useEffect(() => {
        if (appConfig && ARCH_LAYERS[appConfig.architecture]) {
            setLayer(ARCH_LAYERS[appConfig.architecture][0].id);
        }
    }, [appConfig]);

    // --- Effect 1: Data Polling ---
    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const fetchWeights = async () => {
            try {
                const start = Date.now();
                // Add timestamp to prevent browser caching which causes "frozen" heatmaps
                const res = await fetch(`${config.API_URL}/api/weights?layer=${layer}&_t=${start}`);
                const json = await res.json();
                if (isMounted && json[layer]) {
                    const newData = json[layer];
                    // DEBUG: Check if data is actually changing
                    if (newData.length > 0 && newData[0].length > 0) {
                        console.log(`Heatmap Update [${layer}]:`, newData[0][0]);
                    }
                    setData(newData);
                }

                // Adaptive polling: Wait longer if request was slow, but not too long.
                const duration = Date.now() - start;
                // Wait the same amount of time the request took (1:1 duty cycle), max 2s wait.
                const delay = Math.min(2000, Math.max(500, duration));

                if (isMounted) timeoutId = setTimeout(fetchWeights, delay);
            } catch (err) {
                console.error("Failed to fetch weights", err);
                if (isMounted) timeoutId = setTimeout(fetchWeights, 3000); // Retry slow on error
            }
        };

        // Start polling only if training is active
        if (isTraining) {
            fetchWeights();
        }

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [layer, isTraining]);

    // --- Effect 2: Canvas Rendering ---
    useEffect(() => {
        if (!data || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Validate data dimensions
        if (!data || !Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
            console.warn("HeatmapViewer: Invalid data format", data);
            return;
        }

        const rows = data.length; // Output dim (Neurons in this layer)
        const cols = data[0].length; // Input dim (Neurons in previous layer)

        const width = canvas.width;
        const height = canvas.height;
        const cellWidth = width / cols;
        const cellHeight = height / rows;

        ctx.clearRect(0, 0, width, height);

        // Normalize data for better color contrast
        let maxVal = 0;
        data.forEach(row => {
            if (Array.isArray(row)) {
                row.forEach(v => maxVal = Math.max(maxVal, Math.abs(v)));
            }
        });

        // Draw pixel by pixel
        // Note: For very large matrices, this might need optimization (offscreen canvas or WebGL)
        for (let i = 0; i < rows; i++) {
            if (!Array.isArray(data[i])) continue; // Safety check for row
            for (let j = 0; j < cols; j++) {
                const val = data[i][j];
                const normVal = val / (maxVal || 1); // Normalize to -1..1

                // Color mapping: 
                // Blue (-) -> White (0) -> Red (+)
                let r = 255, g = 255, b = 255;
                if (normVal > 0) {
                    g = b = 255 * (1 - normVal); // Fade out G/B to get Red
                } else {
                    r = g = 255 * (1 + normVal); // Fade out R/G to get Blue
                }

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }

    }, [data]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#020617', borderRadius: '12px', padding: '15px' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#e2e8f0', fontWeight: '600' }}>Layer Weights Heatmap</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ color: '#94a3b8', fontSize: '14px' }}>Layer:</label>
                    <select value={layer} onChange={e => setLayer(e.target.value)} style={{
                        marginLeft: '5px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}>
                        {currentLayers.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, border: '1px solid #334155', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas ref={canvasRef} width={800} height={400} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '15px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                Displaying {data ? `${data.length}x${data[0].length}` : '...'} matrix.
                Red = Positive, Blue = Negative.
                <span style={{ marginLeft: '15px', color: '#4ade80', fontWeight: '500' }}>
                    Live Stats: Max Val = {data ? Math.max(...data.flat().map(Math.abs)).toFixed(5) : '0.00'}
                    {' | '}
                    Updated: {new Date().toLocaleTimeString()}
                </span>
            </p>
        </div>
    );
};

export default HeatmapViewer;
