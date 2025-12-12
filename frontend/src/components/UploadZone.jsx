import React, { useState } from 'react';
import config from '../config';

/**
 * UploadZone Component
 * 
 * Allows users to upload their own images to test the model in real-time.
 * 
 * Workflow:
 * 1. User selects file.
 * 2. File is previewed locally.
 * 3. File is sent to `/api/upload-image`.
 * 4. Backend processes it (Image Processing Utils) and runs prediction.
 * 5. Returns prediction class, confidence, and the "AI View" (how the network saw the image).
 */
const UploadZone = () => {
    const [prediction, setPrediction] = useState(null);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create local preview
        setImage(URL.createObjectURL(file));
        setLoading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${config.API_URL}/api/upload-image`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setPrediction(data);
        } catch (err) {
            console.error(err);
            alert("Prediction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-zone" style={{ position: 'absolute', bottom: '20px', right: '20px', background: '#333', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', width: '250px', color: 'white' }}>
            <h4>Test Model</h4>
            <input type="file" onChange={handleFileChange} accept="image/*" />

            {/* Local Preview */}
            {image && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={image} alt="Preview" style={{ maxWidth: '100px', borderRadius: '4px' }} />
                </div>
            )}

            {loading && <p>Predicting...</p>}

            {/* Prediction Results */}
            {prediction && (
                <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#4fc3f7' }}>
                        Prediction: {prediction.prediction}
                    </p>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>
                        Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                    {/* Visual Debugging: Show what the model actually "saw" after processing */}
                    {prediction.processed_image && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>AI View (Processed):</p>
                            <img src={prediction.processed_image} alt="AI View" style={{ width: '56px', height: '56px', border: '1px solid #4fc3f7', borderRadius: '4px', background: 'black' }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UploadZone;
