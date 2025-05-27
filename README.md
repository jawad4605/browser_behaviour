# Mouse Behavior Authentication System

![Demo Screenshot](https://github.com/jawad4605/browser_behaviour/blob/master/public/image.png)

A client-side application that authenticates users based on their unique mouse movement patterns using TensorFlow.js.

## Features
   
- 🖱️ Real-time mouse movement tracking (position, speed, acceleration)
- 🧠 Neural network model training in the browser
- 🔐 Behavioral biometric authentication
- 📊 Advanced metrics visualization
- 👥 Multiple user profile support
- 🎨 Interactive mouse path visualization

## How It Works

1. **Data Collection**:
   - Tracks mouse movements (x, y coordinates and timestamps)
   - Calculates derived metrics (speed, acceleration, direction changes)

2. **Model Training**:
   - Uses a 4-layer neural network with dropout regularization
   - Normalizes features using z-score standardization
   - Trains on browser using TensorFlow.js

3. **Authentication**:
   - Compares new movements to trained patterns
   - Generates confidence scores (0-100%)
   - Provides visual feedback on verification results

## Technical Specifications

### Model Architecture
Input Layer (4 features)
→ Dense (16 units, ReLU, L2 regularization)
→ Dropout (20%)
→ Dense (8 units, ReLU)
→ Dropout (10%)
→ Dense (4 units, ReLU)
→ Output (1 unit, Sigmoid)


### Tracked Features
1. Movement speed (px/ms)
2. Acceleration (px/ms²)
3. Direction changes (radians)
4. Total distance traveled (px)

## Installation

1. Clone the repository:
            git clone https://github.com/yourusername/mouse-authentication.git
cd mouse-authentication
Install dependencies:

bash
            npm install
Start the development server:

bash
               npm run dev
Open your browser to:

         http://localhost:3000
Usage
Start Tracking:

Click "Start Tracking" to begin collecting mouse data

Move your mouse naturally to build a behavior profile

Train Model:

After collecting sufficient data (≥100 points), click "Train Model"

Wait for training to complete (typically 20-30 seconds)

Verify Identity:

Continue moving your mouse

Click "Verify Identity" to get a confidence score

Scores ≥85% indicate likely match

File Structure
         /src/
            ├── pages/               # Next.js pages
            │   └── index.js         # Main application
            ├── styles/              # CSS modules
            │   └── Home.module.css  # Component styles
Dependencies
TensorFlow.js - Browser-based ML library

Next.js - React framework

React - UI library

Browser Support
Chrome (latest)

Firefox (latest)

Edge (latest)

Safari (latest)

Note: Performance may vary on mobile devices

License
MIT License

Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Acknowledgments
TensorFlow.js team for making ML accessible in the browser

Next.js for the excellent React framework

The open source community for countless supporting libraries

