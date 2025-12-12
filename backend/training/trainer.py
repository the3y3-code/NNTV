import torch
import torch.nn as nn
import torch.optim as optim
import time
import eventlet
import base64
import io
import os
import traceback
from PIL import Image
from backend.extensions import socketio
from .architectures import get_architecture
from .datasets import get_dataloader

class Trainer:
    """
    The Trainer class orchestrates the entire lifecycle of the neural network training.
    It handles data loading, model initialization, the training loop, and real-time metric emission.
    """
    def __init__(self):
        self.model = None
        self.optimizer = None
        self.criterion = nn.CrossEntropyLoss()
        self.is_running = False
        self.config = {}
        # Automatically detect if we have a GPU available (CUDA) or default to CPU
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def start(self, config):
        """
        Initializes the model and kicks off the training process in a background thread.
        This prevents blocking the main Flask application so the UI remains responsive.
        """
        self.config = config
        self.is_running = True
        
        # Instantiate the requested model architecture (e.g., MLP, LeNet, ResNet)
        self.model = get_architecture(config.get('architecture', 'mlp')).to(self.device)
        self.optimizer = optim.Adam(self.model.parameters(), lr=config.get('lr', 0.001))
        
        # Prepare the dataset loader
        dataset_name = config.get('dataset', 'mnist')
        batch_size = config.get('batch_size', 64)
        
        # User Logic: If ResNet + GPU, default to 128 for better saturation (unless user explicitly picked something else like 32 or 256)
        # We assume '64' is the generic default coming from the UI.
        if self.device.type == 'cuda' and config.get('architecture') == 'resnet' and int(batch_size) == 64:
             print("Auto-scaling batch size to 128 for ResNet on GPU")
             batch_size = 128
        
        # OPTIMIZATION: If on CPU and using heavy ResNet, reduce batch size to prevent UI freeze
        # ResNet-18 on unoptimized CPU is painfully slow. batch_size=1 ensures we yield control frequently.
        if self.device.type == 'cpu' and config.get('architecture') == 'resnet':
            print("Auto-optimizing batch size for CPU ResNet")
            batch_size = 2 # BatchNorm requires > 1 sample. 2 is the minimum safe value.
            
        train_loader = get_dataloader(dataset_name, batch_size=batch_size, train=True)
        epochs = config.get('epochs', 10)

        print(f"Starting training: {config} on {self.device}")
        
        # Detailed Device Diagnostics for User
        device_msg = f"🚀 Device: {str(self.device).upper()}"
        if self.device.type == 'cuda':
             device_msg += f" ({torch.cuda.get_device_name(0)})"
        else:
             device_msg += f" (Note: GPU not detected. Ensure CUDA is installed.)"
             
        socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': device_msg})
        if self.device.type == 'cpu':
             socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"⚠️ ResNet on CPU is slow. Reduced batch size to {batch_size} for responsiveness."})
        
        # Start the heavy lifting in a background task managed by Socket.IO/Eventlet
        socketio.start_background_task(self._training_loop, train_loader, epochs)

    def stop(self):
        """
        Signals the training loop to terminate gracefully at the next available check.
        """
        self.is_running = False
        print("Stopping training")

    def _training_loop(self, train_loader, epochs):
        """
        The core training logic. It iterates through epochs and batches, performing forward/backward passes.
        Crucially, it captures intermediate states (activations, inputs) to send to the frontend for visualization.
        """
        total_batches = len(train_loader)
        start_time = time.time()
        
        socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"DEBUG: Starting loop. Epochs: {epochs}, Batches: {total_batches}"})

        hooks = []
        try:
            # --- Visualization Hooks Setup ---
            # We need to peek inside the "black box" of the neural network.
            activations = {}
            def get_activation(name):
                def hook(model, input, output):
                    activations[name] = output.detach().cpu()
                return hook

            if self.model:
                for name, layer in self.model.named_modules():
                    # We mainly care about Linear (Full Connected) and Conv2d layers for the visual flow
                    if isinstance(layer, (nn.Linear, nn.Conv2d)):
                        hooks.append(layer.register_forward_hook(get_activation(name)))

            # --- Main Loop ---
            for epoch in range(1, epochs + 1):
                socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"DEBUG: Starting Epoch {epoch}"})
                
                if not self.is_running:
                    socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': "DEBUG: Loop stopped by flag (outer)"})
                    break
                    
                for batch_idx, (data, target) in enumerate(train_loader):
                    if batch_idx == 0:
                        socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"DEBUG: Processing first batch of epoch {epoch}"})
                    
                    # Check for stop signal inside the batch loop for faster response
                    if not self.is_running:
                        socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': "DEBUG: Loop stopped by flag (inner)"})
                        break
                
                    # Move data to the active device (GPU or CPU)
                    data, target = data.to(self.device), target.to(self.device)
                    self.optimizer.zero_grad()
                    
                    # 1. Forward Pass: Compute predictions
                    output = self.model(data)
                    
                    if not self.is_running: break
                    eventlet.sleep(0) # Yield to network thread to catch stop signal

                    # 2. Calculate Loss: How wrong were we?
                    loss = self.criterion(output, target)
                    
                    if not self.is_running: break
                    eventlet.sleep(0)

                    # 3. Backward Pass: Calculate gradients (Backpropagation)
                    loss.backward()
                    
                    if not self.is_running: break
                    eventlet.sleep(0)

                    # 4. Optimization: Update weights using gradients
                    self.optimizer.step()
                
                # --- Real-time Updates ---
                    # We don't want to flood the websocket, so we emit updates every 10 batches.
                    if batch_idx % 10 == 0:
                        pred = output.argmax(dim=1, keepdim=True)
                        correct = pred.eq(target.view_as(pred)).sum().item()
                        accuracy = 100. * correct / len(data)
                        
                        
                        # Compute simplified weight norms for the "heatmap" awareness
                        with torch.no_grad():
                            weights_data = {}
                            for name, param in self.model.named_parameters():
                                if 'weight' in name:
                                    weights_data[name] = param.norm().item()
                                    
                            # --- Prepare Visualization Data ---
                            # We take the FIRST sample from the current batch to show as a live example 
                            sample_img_data = None
                            sample_output = None
                            sample_activations = {}
                            
                            try:
                                # Capture Input Image
                                img_tensor = data[0].cpu().numpy()
                                # normalize for display (min-max scaling to 0-255)
                                img_min, img_max = img_tensor.min(), img_tensor.max()
                                img_scaled = (img_tensor - img_min) / (img_max - img_min + 1e-5) * 255
                                img_pil = Image.fromarray(img_scaled.squeeze().astype('uint8'), mode='L')
                                buffered = io.BytesIO()
                                img_pil.save(buffered, format="PNG")
                                sample_img_data = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"
                                
                                # Capture Output Probabilities (Softmax)
                                probs = torch.nn.functional.softmax(output[0], dim=0)
                                sample_output = probs.detach().cpu().numpy().tolist()
                            
                                # Capture Layer Activations (Mean intensity)
                                # This drives the "pulse" effect in the architecture diagram.
                                sample_activations_raw = {}
                                for name, act in activations.items():
                                    if act.nelement() > 0:
                                        sample_act = act[0]
                                        sample_activations_raw[name] = float(sample_act.abs().mean())
                                
                                # Re-map to short names for visual cleanliness
                                sample_activations = {}
                                for name, val in sample_activations_raw.items():
                                    # Simplify names: layer1.0.conv1 -> L1.0.Cv1, etc.
                                    short_name = name.replace("layer", "L").replace("conv", "Cv").replace("downsample", "DS").replace("bn", "Bn").replace("fc", "FC")
                                    sample_activations[short_name] = val
                                    
                            except Exception as e:
                                print(f"Error processing sample for viz: {e}")
                                socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"Viz Error: {str(e)}"})

                        elapsed = time.time() - start_time
                        metrics = {
                            "epoch": epoch,
                            "batch": batch_idx,
                            "total_batches": total_batches,
                            "loss": loss.item(),
                            "accuracy": accuracy,
                            "weights": weights_data,
                            "sample_input": sample_img_data,
                            "sample_output": sample_output,
                            "sample_activations": sample_activations,
                            "time_elapsed": elapsed,
                            "eta": 0 
                        }
                        socketio.emit('training_update', metrics)
                    
                    # Yield control EVERY batch to prevent server freeze
                    eventlet.sleep(0)

            print(f"Epoch {epoch} complete")
            socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"Epoch {epoch} complete"})
            
        except BaseException as e:
            traceback.print_exc()
            print(f"Critical Training Error: {e}")
            socketio.emit('log', {'time': time.strftime('%H:%M:%S'), 'message': f"CRITICAL: {str(e)}"})
            socketio.emit('training_error', {"error": str(e)})
        finally:
            # Cleanup hooks to prevent memory leaks or duplicate logic if restarted
            for h in hooks:
                h.remove()
                
            self.is_running = False
            socketio.emit('training_complete', {"status": "complete"})

    def get_weights(self, layer_name=None):
        """Retrieve raw weights for heatmap visualization."""
        if not self.model: return {}
        with torch.no_grad():
            if layer_name:
                for name, param in self.model.named_parameters():
                    if name == layer_name:
                        # Flatten if > 2D (e.g. Conv2d [Out, In, H, W] -> [Out, In*H*W] for 2D visualization)
                        data = param
                        if data.dim() > 2:
                             data = data.view(data.size(0), -1)
                        return {name: data.cpu().numpy().tolist()}
                
                # DEBUG: If we loop through everything and don't find it, print what we HAVE.
                print(f"DEBUG: Requested layer '{layer_name}' NOT FOUND. Available: {[n for n, _ in self.model.named_parameters() if 'weight' in n][:5]}...")
                return {} # Return empty to avoid sending 300MB of data!
            
            # Return all weights (flattened) - ONLY if no layer_name was specified
            weights = {}
            for name, param in self.model.named_parameters():
                if 'weight' in name:
                    data = param
                    if data.dim() > 2:
                        data = data.view(data.size(0), -1)
                    weights[name] = data.cpu().numpy().tolist()
            return weights

    def predict(self, image_file):
        """
        Run a single prediction on an uploaded image file.
        Uses the shared image processing utility to ensure the input matches training data.
        """
        if not self.model: return {"prediction": -1, "confidence": 0, "processed_image": None}
        
        try:
            from backend.utils.image_processing import process_image_for_prediction, image_to_base64, get_transform
            
            # Preprocess the uploaded image (Resize, Center, Grayscale)
            processed_img = process_image_for_prediction(image_file)
            if not processed_img:
                raise ValueError("Image processing failed")

            # Convert to Tensor for PyTorch
            transform = get_transform()
            img_tensor = transform(processed_img).unsqueeze(0).to(self.device)
            
            # Forward pass only (no training)
            # CRITICAL: Must be in eval mode for ResNet BatchNorm to work with batch_size=1
            was_training = self.model.training
            self.model.eval()
            try:
                with torch.no_grad():
                    output = self.model(img_tensor)
                    probs = torch.nn.functional.softmax(output, dim=1)
                    pred_idx = probs.argmax().item()
                    confidence = probs[0][pred_idx].item()
            finally:
                # Restore original state (in case training is paused or running)
                if was_training:
                    self.model.train()
                
            img_str = image_to_base64(processed_img)
                
            return {
                "prediction": pred_idx, 
                "confidence": confidence, 
                "processed_image": f"data:image/png;base64,{img_str}"
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {"prediction": -1, "confidence": 0, "processed_image": None}

    def save_model(self):
        """Save the current model state to disk."""
        if not self.model: return None
        path = os.path.abspath("model.pth")
        torch.save(self.model.state_dict(), path)
        return path

# Global singleton instance to share state between routes
trainer_instance = Trainer()
