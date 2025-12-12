# NNTV - Neural Network Training Visualizer

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

### Backend
![Python](https://img.shields.io/badge/python-3.9%20%7C%203.10%20%7C%203.11-blue)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=flat&logo=flask&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-%23EE4C2C.svg?style=flat&logo=PyTorch&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat&logo=css3&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)

A professional, real-time visualization tool for understanding how Neural Networks learn. Watch weights evolve, signal propagate, and loss converge directly in your browser.

## ✨ Features

- **Live Architecture Visualization**: Watch signals propagate through the network with dynamic, multi-colored particle effects.
- **Deep Insight Heatmaps**: Real-time heatmaps of weight matrices allowing you to see the "brain" structure forming.
- **Interactive Training Control**:
    - **Pause/Resume** training instantly.
    - **Adjust Hyperparameters** (Learning Rate, Batch Size) on the fly.
    - **Switch Architectures**: Compare MLP, LeNet-5 (CNN), and ResNet-18.
- **Dataset Playground**: Train on MNIST (Digits), Fashion-MNIST (Clothing), or CIFAR-10 (Objects).
- **Drag-and-Drop Testing**: Upload your own images to test the model's predictions in real-time.

---

## 🚀 Installation Guide

### Prerequisites
- **Python 3.9+** (Recommended: 3.10)
- **Node.js 18+** & **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/NNTV.git
cd NNTV
```

### 2. Backend Setup (Python/Flask)
We recommend using a virtual environment.

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

Install the dependencies:
```bash
pip install -r backend/requirements.txt
```

### 3. Frontend Setup (React/Vite)
Navigate to the frontend directory and install packages.

```bash
cd frontend
npm install
```

---

## 🎮 How to Run

You need two terminals open (one for Backend, one for Frontend).

**Terminal 1: Backend**
```bash
# Ensure .venv is active
python backend/main.py
```
*Server will start at `http://localhost:5000`*

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```
*App will launch at `http://localhost:5173`*

---

## ⚡ GPU Acceleration Guide (CUDA)

This application supports NVIDIA GPU acceleration via PyTorch. Using a GPU significantly speeds up training, especially for ResNet-18.

**1. Check your GPU**
Ensure you have an NVIDIA GPU and updated drivers.

**2. Install the correct PyTorch version**
By default, `pip install torch` might install the CPU-only version. To enable CUDA:

1.  Visit [PyTorch Get Started](https://pytorch.org/get-started/locally/).
2.  Select your OS, Package (`Pip`), Language (`Python`), and **Compute Platform** (e.g., CUDA 11.8 or 12.1).
3.  Run the command provided.

**Example (Windows + CUDA 12.1):**
```bash
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

**Verification:**
When you start training in NNTV, look at the logs. It will explicitly say:
> `🚀 Device: CUDA (NVIDIA GeForce RTX 3080)`

If it says `CPU`, your PyTorch installation does not support CUDA or drivers are missing.

---

## 🛠️ Architecture Overview

- **Frontend**: React, D3.js (Architecture Graph), Chart.js (Metrics), Socket.io-client.
- **Backend**: Flask, Flask-SocketIO (Eventlet), PyTorch (Modeling).
- **Communication**: Real-time WebSockets for per-batch metrics updates.

## 📄 License
MIT License. Free for educational and personal use.
