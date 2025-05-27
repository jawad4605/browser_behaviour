import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';
import { trainModel, predict } from '../utils/model';

export default function Home() {
  const [mouseData, setMouseData] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [recentSpeeds, setRecentSpeeds] = useState([]);
  const dataRef = useRef([]);
  const modelRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleMouseMove = (e) => {
    const timestamp = Date.now();
    const newDataPoint = {
      x: e.clientX,
      y: e.clientY,
      timestamp,
    };

    if (dataRef.current.length > 0) {
      const lastPoint = dataRef.current[dataRef.current.length - 1];
      const timeDiff = (timestamp - lastPoint.timestamp) / 1000; // in seconds
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastPoint.x, 2) + 
        Math.pow(e.clientY - lastPoint.y, 2)
      );
      const speed = timeDiff > 0 ? distance / timeDiff : 0;

      setRecentSpeeds(prev => {
        const updated = [...prev, Math.round(speed)];
        return updated.slice(-10); // Keep last 10 speeds
      });
    }

    dataRef.current = [...dataRef.current, newDataPoint].slice(-100); // Keep last 100 points
    setMouseData(dataRef.current);
  };

  const startTracking = () => {
    dataRef.current = [];
    setMouseData([]);
    setRecentSpeeds([]);
    window.addEventListener('mousemove', handleMouseMove);
    setIsTracking(true);
  };

  const stopTracking = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    setIsTracking(false);
  };

  const normalizeAndTrain = () => {
    if (mouseData.length < 20) {
      alert('Need at least 20 data points to train');
      return;
    }

    setIsTraining(true);
    
    // Extract features (speed and direction changes)
    const features = [];
    for (let i = 1; i < mouseData.length; i++) {
      const prev = mouseData[i - 1];
      const curr = mouseData[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2)
      );
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      features.push({ speed, angle });
    }

    // Normalize data
    const speeds = features.map(f => f.speed);
    const angles = features.map(f => f.angle);
    
    const maxSpeed = Math.max(...speeds);
    const normalizedFeatures = features.map(f => ({
      speed: maxSpeed > 0 ? f.speed / maxSpeed : 0,
      angle: f.angle / Math.PI // Normalize angle to [-1, 1]
    }));

    setTrainingData(normalizedFeatures);
    modelRef.current = trainModel(normalizedFeatures);
    setIsTraining(false);
    console.log('Training complete!');
  };

  const calculateConfidence = () => {
    if (!modelRef.current || mouseData.length < 20) {
      alert('Train the model first and collect enough data');
      return;
    }

    // Extract features from recent data
    const recentFeatures = [];
    const recentPoints = mouseData.slice(-20); // Last 20 points
    for (let i = 1; i < recentPoints.length; i++) {
      const prev = recentPoints[i - 1];
      const curr = recentPoints[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2)
      );
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      
      // Normalize using same factors as training
      const maxSpeed = Math.max(...trainingData.map(t => t.speed * (1/0.01))); // Inverse of normalization
      const normalizedSpeed = maxSpeed > 0 ? speed / maxSpeed : 0;
      const normalizedAngle = angle / Math.PI;
      
      recentFeatures.push({ speed: normalizedSpeed, angle: normalizedAngle });
    }

    const score = predict(modelRef.current, recentFeatures);
    setConfidence(Math.round(score * 100));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mouse Behavior Analysis</h1>
      
      <div className={styles.controls}>
        {!isTracking ? (
          <button onClick={startTracking} className={styles.button}>
            Start Tracking
          </button>
        ) : (
          <button onClick={stopTracking} className={styles.button}>
            Stop Tracking
          </button>
        )}
        
        <button 
          onClick={normalizeAndTrain} 
          className={styles.button}
          disabled={isTraining || mouseData.length < 20}
        >
          {isTraining ? 'Training...' : 'Normalize & Train'}
        </button>
        
        <button 
          onClick={calculateConfidence} 
          className={styles.button}
          disabled={!modelRef.current || mouseData.length < 20}
        >
          Calculate Confidence
        </button>
      </div>
      
      <div className={styles.dataSection}>
        <h2>Live Data</h2>
        <p>Data points collected: {mouseData.length}</p>
        <p>Recent mouse speeds (px/s): [{recentSpeeds.join(', ')}]</p>
      </div>
      
      {confidence !== null && (
        <div className={styles.result}>
          <h2>Confidence Score</h2>
          <p className={styles.confidence}>{confidence}%</p>
          <p>Similarity to original behavior pattern</p>
        </div>
      )}
    </div>
  );
}