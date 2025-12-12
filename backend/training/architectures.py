import torch.nn as nn
import torch.nn.functional as F

class SimpleMLP(nn.Module):
    """
    A simple Multi-Layer Perceptron (MLP).
    Best suited for flattening 2D images into vectors and learning simple patterns.
    Fast to train but loses spatial information.
    """
    def __init__(self):
        super(SimpleMLP, self).__init__()
        # 784 input features (28x28 pixels flattened)
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10) # 10 output classes (digits 0-9)

    def forward(self, x):
        # Flatten the image tensor
        x = x.view(-1, 784)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

class LeNet(nn.Module):
    """
    LeNet-5: A classic Convolutional Neural Network (CNN).
    Matches the original architecture for 32x32 inputs (via padding) to preserve param counts (~60k).
    """
    def __init__(self):
        super(LeNet, self).__init__()
        # Input: 1x28x28 -> Padding=2 -> 1x32x32
        # C1: 6 filters, 5x5 kernel -> 6x28x28
        self.conv1 = nn.Conv2d(1, 6, 5, padding=2)
        # S2: Avg Pooling (Original used Avg, Modern uses Max, but let's stick to standard structure)
        # Using MaxPool for better gradient flow in this demo.
        
        # C3: 16 filters, 5x5 -> 16x10x10
        self.conv2 = nn.Conv2d(6, 16, 5)
        
        # C5: Fully connected linear layer 120 units
        # Input to FC1 is 16*5*5 = 400
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        # 1. C1 + S2
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)
        # 2. C3 + S4
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        
        # Flatten
        x = x.view(-1, 16 * 5 * 5)
        
        # 3. C5 (FC)
        x = F.relu(self.fc1(x))
        # 4. F6
        x = F.relu(self.fc2(x))
        # 5. Output
        x = self.fc3(x)
        return x

class ResNet18(nn.Module):
    """
    Standard ResNet-18 adapted for 1-channel input (MNIST).
    Puts the 'Deep' in 'Deep Learning' with ~11.2M parameters.
    """
    def __init__(self):
        super(ResNet18, self).__init__()
        # Import standard ResNet18
        from torchvision.models import resnet18
        self.model = resnet18(num_classes=10)
        
        # Adapt first layer for grayscale (1 channel) instead of RGB (3 channels)
        # We keep the stride/kernel/padding of standard ResNet (7x7) to match the parameter count strictly,
        # even though 7x7 is aggressive for 28x28 images.
        self.model.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        
    def forward(self, x):
        return self.model(x)

def get_architecture(name):
    """Factory function to instantiate models by name."""
    if name == "lenet":
        return LeNet()
    if name == "resnet":
        return ResNet18()
    return SimpleMLP()
