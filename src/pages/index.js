import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css'; // Make sure this import path is correct

const Home = () => {
  const [mouseData, setMouseData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [recentSpeeds, setRecentSpeeds] = useState([]);
  const [modelStatus, setModelStatus] = useState('Loading TensorFlow...');
  const dataRef = useRef([]);
  const modelRef = useRef(null);
  const tfRef = useRef(null);
  const normalizationFactorRef = useRef(1);

  // Load TensorFlow.js once
  useEffect(() => {
    const loadTF = async () => {
      try {
        const tf = await import('@tensorflow/tfjs');
        tfRef.current = tf;
        setModelStatus('Ready to train');
      } catch (err) {
        console.error('Failed to load TensorFlow:', err);
        setModelStatus('TensorFlow failed to load');
      }
    };

    loadTF();
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
        return updated.slice(-5);
      });
    }

    dataRef.current = [...dataRef.current, newDataPoint].slice(-100);
    setMouseData(dataRef.current);
  };

  const startTracking = () => {
    dataRef.current = [];
    setMouseData([]);
    setRecentSpeeds([]);
    setConfidence(null);
    window.addEventListener('mousemove', handleMouseMove);
    setIsTracking(true);
  };

  const stopTracking = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    setIsTracking(false);
  };

  const createModel = () => {
    const tf = tfRef.current;
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [1] }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  };

  const trainModel = async () => {
    const tf = tfRef.current;
    if (!tf) {
      alert('TensorFlow.js not loaded yet');
      return;
    }

    if (mouseData.length < 100) {
      alert('Need at least 100 data points to train');
      return;
    }

    setIsTraining(true);
    setModelStatus('Training in progress...');

    try {
      const features = [];
      for (let i = 1; i < mouseData.length; i++) {
        const prev = mouseData[i - 1];
        const curr = mouseData[i];
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
        const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const speed = timeDiff > 0 ? distance / timeDiff : 0;
        features.push(speed);
      }

      const maxSpeed = Math.max(...features);
      normalizationFactorRef.current = maxSpeed > 0 ? maxSpeed : 1;
      const normalizedFeatures = features.map(speed => speed / normalizationFactorRef.current);

      if (modelRef.current) modelRef.current.dispose(); // Free old model

      modelRef.current = createModel();
      const xs = tf.tensor2d(normalizedFeatures, [normalizedFeatures.length, 1]);
      const ys = tf.ones([normalizedFeatures.length, 1]);

      await modelRef.current.fit(xs, ys, {
        epochs: 300,
        batchSize: 16,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });

      setModelStatus('Model trained - Ready for verification');
    } catch (error) {
      console.error('Training failed:', error);
      setModelStatus('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const calculateConfidence = async () => {
    const tf = tfRef.current;
    if (!modelRef.current || mouseData.length < 100 || !tf) {
      alert('Train the model first and collect enough data');
      return;
    }

    try {
      const recentFeatures = [];
      const recentPoints = mouseData.slice(-100);
      for (let i = 1; i < recentPoints.length; i++) {
        const prev = recentPoints[i - 1];
        const curr = recentPoints[i];
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
        const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const speed = timeDiff > 0 ? distance / timeDiff : 0;
        recentFeatures.push(speed / normalizationFactorRef.current);
      }

      const inputTensor = tf.tensor2d(recentFeatures, [recentFeatures.length, 1]);
      const predictions = await modelRef.current.predict(inputTensor).data();
      inputTensor.dispose();

      const score = predictions.reduce((a, b) => a + b, 0) / predictions.length * 100;
      setConfidence(Math.round(score));
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

return (
    <div className={styles.container}>
      <Head>
        <title>Mouse Behavior Authenticator</title>
        <meta name="description" content="AI-powered mouse behavior analysis" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Mouse Behavior Authentication</h1>
        
        <div className={styles.grid}>
          <div className={`${styles.panel} ${isTracking ? styles.trackingActive : ''}`}>
            <h2 className={styles.panelTitle}>Controls</h2>
            <div className={styles.spaceY3}>
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className={`${styles.button} ${styles.buttonSuccess}`}
                >
                  Start Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className={`${styles.button} ${styles.buttonDanger}`}
                >
                  Stop Tracking
                </button>
              )}

              <button
                onClick={trainModel}
                disabled={isTraining || mouseData.length < 100}
                className={`${styles.button} ${
                  isTraining || mouseData.length < 100
                    ? styles.buttonDisabled
                    : styles.buttonPrimary
                }`}
              >
                {isTraining ? 'Training...' : 'Train Model'}
              </button>

              <button
                onClick={calculateConfidence}
                disabled={!modelRef.current || mouseData.length < 100}
                className={`${styles.button} ${
                  !modelRef.current || mouseData.length < 100
                    ? styles.buttonDisabled
                    : styles.buttonPrimary
                }`}
              >
                Get Confidence Score
              </button>
            </div>
            
            <div className={styles.statusCard}>
              <p className={styles.fontMedium}>Model Status:</p>
              <p className={styles.textSm}>{modelStatus}</p>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Live Data</h2>
            <div className={styles.spaceY4}>
              <div>
                <p className={styles.fontMedium}>Data Points Collected:</p>
                <p className={styles.dataValue}>{mouseData.length}</p>
              </div>
              
              <div>
                <p className={styles.fontMedium}>Recent Mouse Speeds (px/s):</p>
                <div className={styles.dataDisplay}>
                  {recentSpeeds.length > 0 ? recentSpeeds.join(', ') : 'No data yet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {confidence !== null && (
          <div className={styles.resultPanel}>
            <h2 className={styles.text2xl}>Authentication Result</h2>
            <div className={styles.resultValue}>
              {confidence}%
            </div>
            <p className={styles.textGray700}>
              {confidence >= 80 ? 'High confidence - Likely same user' :
               confidence >= 60 ? 'Moderate confidence - Possibly same user' :
               'Low confidence - Different behavior detected'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;