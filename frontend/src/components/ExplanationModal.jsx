import React from 'react';

/**
 * ExplanationModal Component
 * 
 * Defines the "Help" popup that explains how the application works to the user.
 * It covers the three main pillars: Training, Visualizing, and Testing.
 * 
 * Props:
 * - isOpen: Boolean controlling visibility.
 * - onClose: Function to close the modal.
 */
const ExplanationModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#1e293b', padding: '30px', borderRadius: '12px',
                maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                border: '1px solid #334155', color: '#f8fafc', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#38bdf8' }}>How NeuralViz Works</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                <section style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#818cf8', fontSize: '18px' }}>1. Training Process</h3>
                    <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>
                        When you click <strong>START TRAINING</strong>, the backend initializes a neural network (e.g., Simple MLP) and begins feeding it batches of images from the selected dataset (MNIST).
                        The network adjusts its internal "weights" to minimize the error (Loss) between its prediction and the actual label.
                    </p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#818cf8', fontSize: '18px' }}>2. Visualizations</h3>
                    <ul style={{ lineHeight: '1.6', color: '#cbd5e1', paddingLeft: '20px' }}>
                        <li><strong>Architecture:</strong> Shows the active neurons. The connections pulse based on the magnitude of the weights, showing "signal flow".</li>
                        <li><strong>Heatmaps:</strong> Shows the raw 2D weight matrices between layers. Red = positive connection, Blue = negative.</li>
                        <li><strong>Metrics:</strong> "Loss" should go down (less error), "Accuracy" should go up (more correct predictions).</li>
                    </ul>
                </section>

                <section>
                    <h3 style={{ color: '#818cf8', fontSize: '18px' }}>3. Testing & Export</h3>
                    <p style={{ lineHeight: '1.6', color: '#cbd5e1' }}>
                        Once the model learns (even after 1 epoch), use the <strong>Test Model</strong> box. Upload an image of a handwritten digit.
                        The model will run a "forward pass" and output its best guess. You can test as many images as you like!
                        Use <strong>Export</strong> to save the trained model to your computer.
                    </p>
                </section>

                <div style={{ marginTop: '30px', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white',
                        padding: '10px 24px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                    }}>Got it!</button>
                </div>
            </div>
        </div>
    );
};

export default ExplanationModal;
