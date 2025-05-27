# Mouse Behavior Analysis App

A minimal browser application that tracks mouse movements and analyzes behavior patterns to determine if new movements match the initially trained pattern.

## Features

- Tracks mouse movements (position and timestamp)
- Calculates movement speed and direction between points
- Trains a simple similarity-based model on initial behavior
- Computes confidence scores (0-100%) for new behavior patterns
- Entirely client-side implementation with no backend
- Clean, responsive UI with CSS modules

## Technologies Used

- Next.js (React framework)
- CSS Modules for styling
- Client-side JavaScript for data processing and modeling

## How It Works

1. **Data Collection**:
   - Records mouse position (x,y) and timestamp at each movement
   - Calculates speed (pixels/second) between consecutive points
   - Maintains a rolling window of the last 100 data points

2. **Feature Extraction**:
   - Extracts speed and direction (angle) features
   - Normalizes features (speed to [0,1], angle to [-1,1])

3. **Model Training**:
   - Calculates average patterns and variance from training data
   - Uses Gaussian similarity measure based on variance

4. **Prediction**:
   - Compares new behavior patterns to trained patterns
   - Returns confidence score of similarity (0-100%)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mouse-behavior-analysis.git
   cd mouse-behavior-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Start Tracking" to begin collecting mouse movement data
2. Move your mouse naturally to build up data points
3. Click "Normalize & Train" when you have at least 20 data points
4. Continue moving your mouse to collect new data
5. Click "Calculate Confidence" to see similarity score

## Customization

You can adjust these parameters in the code:

- `dataRef.current.slice(-100)` - Number of data points to retain
- `recentSpeeds.slice(-10)` - Number of recent speeds to display
- `mouseData.slice(-20)` - Window size for confidence calculation
