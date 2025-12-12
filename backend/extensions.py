from flask_socketio import SocketIO

# Initialize SocketIO separately here to avoid circular dependencies.
# This allows 'app.py' to import it for initialization, 
# and 'trainer.py' to import it for emitting events, without creating an import loop.
socketio = SocketIO(cors_allowed_origins="*")
