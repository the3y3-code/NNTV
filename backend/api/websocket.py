from flask_socketio import emit
from backend.extensions import socketio

"""
WebSocket Event Handlers
------------------------
Handles the real-time bidirectional communication between Frontend and Backend.
Used primarily for connection status verification.
Note: Training metrics are emitted directly from trainer.py, not here.
"""

@socketio.on('connect')
def handle_connect():
    """Triggered when a client (React Frontend) establishes a WebSocket connection."""
    print('Client connected')
    emit('status', {'msg': 'Connected to NeuralViz Backend'})

@socketio.on('disconnect')
def handle_disconnect():
    """Triggered when the client connection is lost or closed."""
    print('Client disconnected')
