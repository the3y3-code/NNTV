import eventlet
# Patch standard library to support async operations with Eventlet (required for Flask-SocketIO)
eventlet.monkey_patch()

from flask import Flask
from flask_cors import CORS
from backend.extensions import socketio

app = Flask(__name__)
app.config['SECRET_KEY'] = 'neuralviz_secret!' # Security key for sessions (change in production)

# Enable CORS (Cross-Origin Resource Sharing) to allow the React frontend to talk to this API
CORS(app)

# Initialize SocketIO with the Flask app
socketio.init_app(app)

# Import and register API routes
# We do this here to avoid circular imports (Routes need the 'app' or 'socketio' context)
from backend.api.routes import api
import backend.api.websocket # Register socket handlers
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    print("Starting NeuralViz Backend on http://localhost:5000")
    # Run using the SocketIO web server wrapper (eventlet typically)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
