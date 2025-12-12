from torchvision import datasets, transforms
from torch.utils.data import DataLoader

def get_dataloader(dataset_name, batch_size=64, train=True):
    """
    Creates a PyTorch DataLoader for the specified dataset.
    Handles normalizing, resizing, and preparation so the model gets consistent input.
    """
    # Default transforms for MNIST: Convert to Tensor and Normalize 
    # (Subtract mean 0.1307, Divide by std 0.3081) to center data around 0.
    transform_list = [
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ]

    dataset_class = datasets.MNIST
    
    # Select dataset class based on string name
    if dataset_name.lower() == "fashion-mnist":
        dataset_class = datasets.FashionMNIST
        
    elif dataset_name.lower() == "cifar-10":
        dataset_class = datasets.CIFAR10
        # SPECIAL CASE: CIFAR-10 is color (RGB) and larger (32x32).
        # To make it work with our existing simple models (which expect 1-channel 28x28),
        # we forcibly grayscale and resize it. This is a simplification for educational demo purposes.
        transform_list = [
            transforms.Grayscale(num_output_channels=1),
            transforms.Resize((28, 28)),
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,)) # Simple normalization for general data
        ]

    # Combine the list of transforms into a single pipeline
    transform = transforms.Compose(transform_list)
        
    # Download the dataset if missing and apply the transforms
    dataset = dataset_class('./data', train=train, download=True, transform=transform)
        
    # Return loading iterator (shuffled for training to prevent ordering bias)
    # drop_last=True prevents BatchNorm errors if the last batch has size 1
    # num_workers=2 speeds up data loading for GPU usage
    import os
    workers = 2 if os.name != 'nt' else 0 # Windows sometimes struggles with workers > 0 in certain envs, let's keep 0 for safety or user can try 2
    # Actually, let's try 0 for now to be safe against Windows spawn errors, but mention it.
    # The low usage is likely batch size.
    return DataLoader(dataset, batch_size=batch_size, shuffle=train, drop_last=True, num_workers=0)
