from flask import Blueprint, jsonify, request, send_file
from ..training.trainer import trainer_instance

api = Blueprint('api', __name__)

@api.route('/datasets', methods=['GET'])
def get_datasets():
    """
    Returns a list of available datasets.
    These are the options displayed in the dropdown menu on the frontend.
    """
    return jsonify(["MNIST", "Fashion-MNIST", "CIFAR-10"])

@api.route('/create-model', methods=['POST'])
def create_model():
    """
    Initializes a new model configuration.
    Currently a placeholder as the training loop handles initialization dynamically,
    but useful for future expansion (e.g., verifying architecture before starting).
    """
    data = request.json
    return jsonify({"model_id": "model_1", "status": "ready"})

@api.route('/start-training', methods=['POST'])
def start_training():
    """
    Starts the training process.
    Receives configuration (dataset, architecture, hyperparameters) from the frontend
    and triggers the background training thread.
    """
    data = request.json
    if not trainer_instance.is_running:
        trainer_instance.start(data)
        return jsonify({"status": "started"})
    return jsonify({"status": "already_running"}), 400

@api.route('/stop-training', methods=['POST'])
def stop_training():
    """
    Stops the currently running training session.
    It sets a flag that the training loop checks to exit gracefully.
    """
    trainer_instance.stop()
    return jsonify({"status": "stopped"})

@api.route('/weights', methods=['GET'])
def get_weights():
    """
    Fetches the raw weights of a specific layer (or all layers).
    Used by the HeatmapViewer to visualize the internal state of the network.
    """
    layer = request.args.get('layer')
    return jsonify(trainer_instance.get_weights(layer))

@api.route('/upload-image', methods=['POST'])
def upload_image():
    """
    Handles image uploads for testing/prediction.
    1. Receives the image file.
    2. preprocessing (resize/grayscale) via the processing utility.
    3. Runs it through the trained model.
    4. Returns the classification result and confidence.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    result = trainer_instance.predict(file)
    return jsonify(result)

@api.route('/export-model', methods=['GET'])
def export_model():
    """
    Exports the trained model as a .pth file.
    Allows the user to download their work.
    """
    path = trainer_instance.save_model()
    if path:
        return send_file(path, as_attachment=True, download_name='model.pth')
    return jsonify({"error": "No model to export"}), 404
