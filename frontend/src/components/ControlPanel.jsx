import React from 'react';


/**
 * ControlPanel Component
 * 
 * Provides the user interface for configuring the Neural Network parameters.
 * Allows users to select Datasets, Architectures, and Hyperparameters (Learning Rate, Epochs, Batch Size).
 * Also contains the Start/Stop training controls and Model Export function.
 */
const ControlPanel = ({ config: appConfig, setConfig, onStart, onStop, isTraining }) => {

    // Generic handler for all form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        // Convert numeric inputs safely
        if (name === 'lr') finalValue = parseFloat(value);
        if (name === 'epochs' || name === 'batch_size') finalValue = parseInt(value, 10);

        setConfig(prev => ({ ...prev, [name]: finalValue }));
    };

    return (
        <div className="control-panel" style={{ padding: '20px', background: '#1e293b', height: '100%', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            <h3 style={{ color: '#38bdf8', marginBottom: '15px' }}>Configuration</h3>

            {/* Dataset Selection */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Dataset</label>
                <select name="dataset" value={appConfig.dataset} onChange={handleChange} disabled={isTraining} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '14px' }}>
                    <option value="mnist">MNIST (Digits)</option>
                    <option value="fashion-mnist">Fashion-MNIST (Clothing)</option>
                    <option value="cifar-10">CIFAR-10 (Objects)</option>
                </select>
            </div>

            {/* Architecture Selection */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Architecture</label>
                <select name="architecture" value={appConfig.architecture} onChange={handleChange} disabled={isTraining} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '14px' }}>
                    <option value="mlp">Simple MLP (Fast)</option>
                    <option value="lenet">LeNet-5 (Classic CNN)</option>
                    <option value="resnet">Mini ResNet (Deep)</option>
                </select>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.2' }}>
                    {appConfig.architecture === 'mlp' && "Basic fully connected network. Best for simple tabular/digit data."}
                    {appConfig.architecture === 'lenet' && "Convolutional network. Excellent for spatial patterns like images."}
                    {appConfig.architecture === 'resnet' && "Deep residual network. State-of-the-art for complex image recognition."}
                </p>
            </div>

            {/* Hyperparameters: Learning Rate */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Learning Rate: <span style={{ color: '#38bdf8' }}>{appConfig.lr}</span></label>
                <input
                    type="range"
                    name="lr"
                    min="0.0001"
                    max="0.1"
                    step="0.0001"
                    value={appConfig.lr}
                    onChange={handleChange}
                    style={{ width: '100%', accentColor: '#38bdf8', height: '4px' }}
                />
                <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Lower = slower but more precise. Higher = faster but unstable.</p>
            </div>

            {/* Hyperparameters: Epochs */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Epochs</label>
                <input
                    type="number"
                    name="epochs"
                    value={appConfig.epochs}
                    onChange={handleChange}
                    disabled={isTraining}
                    min="1"
                    max="100"
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                />
            </div>

            {/* Hyperparameters: Batch Size */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px' }}>Batch Size</label>
                <select name="batch_size" value={appConfig.batch_size} onChange={handleChange} disabled={isTraining} style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '14px' }}>
                    <option value="32">32 (Small)</option>
                    <option value="64">64 (Standard)</option>
                    <option value="128">128 (GPU Optimized)</option>
                    <option value="256">256 (Max Speed)</option>
                </select>
            </div>

            {/* Action Buttons */}
            <div className="form-group" style={{ marginTop: 'auto' }}>
                {isTraining ? (
                    <button onClick={onStop} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', width: '100%', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', fontSize: '14px' }}>
                        STOP TRAINING
                    </button>
                ) : (
                    <button onClick={onStart} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', width: '100%', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)', fontSize: '14px' }}>
                        START TRAINING
                    </button>
                )}
            </div>


        </div>
    );
};

export default ControlPanel;
