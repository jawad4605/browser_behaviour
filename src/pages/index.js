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
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleMouseMove = (e) => {
    const timestamp = Date.now();
    const newDataPoint = { x: e.clientX, y: e.clientY, timestamp };

    if (dataRef.current.length > 0) {
      const lastPoint = dataRef.current[dataRef.current.length - 1];
      const timeDiff = (timestamp - lastPoint.timestamp) / 1000;
      const distance = Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);
      const speed = timeDiff > 0 ? distance / timeDiff : 0;

      setRecentSpeeds((prev) => {
        const updated = [...prev, Math.round(speed)];
        return updated.slice(-10);
      });
    }

    dataRef.current = [...dataRef.current, newDataPoint].slice(-100);
    setMouseData(dataRef.current);
  };

  const startTracking = () => {
    dataRef.current = [];
    setMouseData([]);
    setRecentSpeeds([]);
    window.addEventListener('mousemove', handleMouseMove);
    setIsTracking(true);
    setConfidence(null);
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

    const features = [];
    for (let i = 1; i < mouseData.length; i++) {
      const prev = mouseData[i - 1];
      const curr = mouseData[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      features.push({ speed, angle });
    }

    const speeds = features.map(f => f.speed);
    const maxSpeed = Math.max(...speeds);

    const normalizedFeatures = features.map(f => ({
      speed: maxSpeed > 0 ? f.speed / maxSpeed : 0,
      angle: f.angle / Math.PI,
    }));

    setTrainingData(normalizedFeatures);
    modelRef.current = trainModel(normalizedFeatures);
    setIsTraining(false);
    alert('Training complete!');
  };

  const calculateConfidence = () => {
    if (!modelRef.current || mouseData.length < 20) {
      alert('Train the model first and collect enough data');
      return;
    }

    const recentFeatures = [];
    const recentPoints = mouseData.slice(-20);
    for (let i = 1; i < recentPoints.length; i++) {
      const prev = recentPoints[i - 1];
      const curr = recentPoints[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      const maxSpeed = Math.max(...trainingData.map(t => t.speed)) || 1;
      const normalizedSpeed = speed / maxSpeed;
      const normalizedAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x) / Math.PI;
      recentFeatures.push({ speed: normalizedSpeed, angle: normalizedAngle });
    }

    const score = predict(modelRef.current, recentFeatures);
    setConfidence(Math.round(score * 100));
  };

  return (
    <main id="appContainer" className={styles.container}>
      <h1 id="pageTitle" className={styles.title}>Mouse Behavior Analysis</h1>

      <section id="controlsSection" className={styles.controls}>
        {!isTracking ? (
          <button id="startBtn" onClick={startTracking} className={styles.button}>Start Tracking</button>
        ) : (
          <button id="stopBtn" onClick={stopTracking} className={`${styles.button} ${styles.danger}`}>Stop Tracking</button>
        )}

        <button
          id="trainBtn"
          onClick={normalizeAndTrain}
          className={styles.button}
          disabled={isTraining || mouseData.length < 20}
        >
          {isTraining ? 'Training...' : 'Normalize & Train'}
        </button>

        <button
          id="confidenceBtn"
          onClick={calculateConfidence}
          className={styles.button}
          disabled={!modelRef.current || mouseData.length < 20}
        >
          Calculate Confidence
        </button>
      </section>

      <section id="liveDataSection" className={styles.dataSection}>
        <h2>Live Data</h2>
        <p><strong>Data points collected:</strong> {mouseData.length}</p>
        <p><strong>Recent mouse speeds (px/s):</strong></p>
        <div id="speedsContainer" className={styles.speedList}>
          {recentSpeeds.length > 0 ? recentSpeeds.join(', ') : 'No speed data yet'}
        </div>
      </section>

      {confidence !== null && (
        <section id="confidenceResult" className={styles.result}>
          <h2>Confidence Score</h2>
          <p className={styles.confidence}>{confidence}%</p>
          <p>Similarity to original behavior pattern</p>
        </section>
      )}
    </main>
  );
}