import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const Home = () => {
  // State variables
  const [mouseData, setMouseData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [recentSpeeds, setRecentSpeeds] = useState([]);
  const [modelStatus, setModelStatus] = useState('Loading TensorFlow...');
  const [userProfiles, setUserProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState({
    avgSpeed: 0,
    speedVariance: 0,
    directionChanges: 0,
    acceleration: 0
  });

  // Refs
  const dataRef = useRef([]);
  const modelRef = useRef(null);
  const tfRef = useRef(null);
  const normalizationFactorsRef = useRef({
    speed: 1,
    acceleration: 1,
    direction: 1
  });
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Load TensorFlow.js
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Mouse movement handler with advanced metrics
  const handleMouseMove = (e) => {
    const timestamp = Date.now();
    const newDataPoint = { x: e.clientX, y: e.clientY, timestamp };

    if (dataRef.current.length > 0) {
      const lastPoint = dataRef.current[dataRef.current.length - 1];
      const timeDiff = (timestamp - lastPoint.timestamp) / 1000;
      const distance = Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      
      // Calculate advanced metrics
      let directionChanges = 0;
      let acceleration = 0;
      
      if (dataRef.current.length > 1) {
        const prevPoint = dataRef.current[dataRef.current.length - 2];
        const prevTimeDiff = (lastPoint.timestamp - prevPoint.timestamp) / 1000;
        const prevDistance = Math.hypot(lastPoint.x - prevPoint.x, lastPoint.y - prevPoint.y);
        const prevSpeed = prevTimeDiff > 0 ? prevDistance / prevTimeDiff : 0;
        
        // Calculate acceleration
        acceleration = timeDiff > 0 ? (speed - prevSpeed) / timeDiff : 0;
        
        // Calculate direction changes
        const prevAngle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
        const currentAngle = Math.atan2(e.clientY - lastPoint.y, e.clientX - lastPoint.x);
        const angleDiff = Math.abs(currentAngle - prevAngle);
        if (angleDiff > Math.PI / 4) directionChanges = 1;
      }

      setRecentSpeeds((prev) => {
        const updated = [...prev, { speed, acceleration, directionChanges }];
        return updated.slice(-5);
      });

      // Update advanced metrics
      setAdvancedMetrics(prev => ({
        avgSpeed: (prev.avgSpeed * 0.9 + speed * 0.1),
        speedVariance: calculateVariance(dataRef.current.map(p => p.speed || 0).slice(-20)),
        directionChanges: prev.directionChanges + directionChanges,
        acceleration: (prev.acceleration * 0.9 + acceleration * 0.1)
      }));
    }

    dataRef.current = [...dataRef.current, { ...newDataPoint, speed: recentSpeeds[recentSpeeds.length - 1]?.speed || 0 }].slice(-200);
    setMouseData(dataRef.current);
    
    // Visual feedback
    drawMousePath();
  };

  // Calculate variance for speed
  const calculateVariance = (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
  };

  // Draw mouse path on canvas
  const drawMousePath = () => {
    if (!canvasRef.current || mouseData.length < 2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Draw path
    ctx.beginPath();
    ctx.moveTo(mouseData[0].x, mouseData[0].y);
    
    for (let i = 1; i < mouseData.length; i++) {
      ctx.lineTo(mouseData[i].x, mouseData[i].y);
    }
    
    ctx.strokeStyle = `hsl(${confidence || 0}, 80%, 50%)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw current position
    if (mouseData.length > 0) {
      const last = mouseData[mouseData.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${confidence || 0}, 80%, 50%)`;
      ctx.fill();
    }
    
    animationRef.current = requestAnimationFrame(drawMousePath);
  };

  // Start/stop tracking
  const startTracking = () => {
    dataRef.current = [];
    setMouseData([]);
    setRecentSpeeds([]);
    setConfidence(null);
    window.addEventListener('mousemove', handleMouseMove);
    setIsTracking(true);
    if (canvasRef.current) {
      canvasRef.current.style.display = 'block';
    }
  };

  const stopTracking = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    setIsTracking(false);
    if (canvasRef.current) {
      canvasRef.current.style.display = 'none';
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Advanced model architecture
  const createModel = () => {
    const tf = tfRef.current;
    const model = tf.sequential();
    
    // Enhanced model with more layers and dropout for regularization
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [4], // Now using 4 features
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.1 }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  };

  // Enhanced training with more features
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
      for (let i = 2; i < mouseData.length; i++) {
        const prev2 = mouseData[i - 2];
        const prev1 = mouseData[i - 1];
        const curr = mouseData[i];
        
        // Time differences
        const timeDiff1 = (prev1.timestamp - prev2.timestamp) / 1000;
        const timeDiff2 = (curr.timestamp - prev1.timestamp) / 1000;
        
        // Calculate speeds
        const speed1 = timeDiff1 > 0 ? 
          Math.hypot(prev1.x - prev2.x, prev1.y - prev2.y) / timeDiff1 : 0;
        const speed2 = timeDiff2 > 0 ? 
          Math.hypot(curr.x - prev1.x, curr.y - prev1.y) / timeDiff2 : 0;
        
        // Calculate acceleration
        const acceleration = timeDiff2 > 0 ? (speed2 - speed1) / timeDiff2 : 0;
        
        // Calculate direction change
        const angle1 = Math.atan2(prev1.y - prev2.y, prev1.x - prev2.x);
        const angle2 = Math.atan2(curr.y - prev1.y, curr.x - prev1.x);
        const angleDiff = Math.abs(angle2 - angle1);
        
        features.push([
          speed2,
          acceleration,
          angleDiff,
          Math.hypot(curr.x - prev2.x, curr.y - prev2.y) // Total distance
        ]);
      }

      // Normalize features
      const featureMeans = [0, 0, 0, 0];
      const featureStd = [1, 1, 1, 1];
      
      if (features.length > 0) {
        for (let i = 0; i < 4; i++) {
          const values = features.map(f => f[i]);
          featureMeans[i] = values.reduce((a, b) => a + b, 0) / values.length;
          featureStd[i] = Math.sqrt(
            values.reduce((a, b) => a + Math.pow(b - featureMeans[i], 2), 0) / values.length
          ) || 1;
        }
      }
      
      const normalizedFeatures = features.map(f => 
        f.map((val, i) => (val - featureMeans[i]) / featureStd[i])
      );

      // Save normalization factors for later use
      normalizationFactorsRef.current = {
        means: featureMeans,
        std: featureStd
      };

      if (modelRef.current) modelRef.current.dispose();

      modelRef.current = createModel();
      const xs = tf.tensor2d(normalizedFeatures, [normalizedFeatures.length, 4]);
      const ys = tf.ones([normalizedFeatures.length, 1]);

      await modelRef.current.fit(xs, ys, {
        epochs: 50,
        batchSize: 16,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss?.toFixed(4) || 'N/A'}`);
            setModelStatus(`Training... Epoch ${epoch + 1}/200`);
          }
        }
      });

      setModelStatus('Model trained - Ready for verification');
      
      // Create a new user profile
      const newProfile = {
        id: Date.now(),
        name: `User ${userProfiles.length + 1}`,
        normalizationFactors: normalizationFactorsRef.current,
        createdAt: new Date().toISOString()
      };
      
      setUserProfiles(prev => [...prev, newProfile]);
      setActiveProfile(newProfile.id);
    } catch (error) {
      console.error('Training failed:', error);
      setModelStatus('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  // Enhanced verification with profile support
  const calculateConfidence = async () => {
    const tf = tfRef.current;
    if (!modelRef.current || mouseData.length < 100 || !tf) {
      alert('Train the model first and collect enough data');
      return;
    }

    try {
      const recentFeatures = [];
      const recentPoints = mouseData.slice(-100);
      
      for (let i = 2; i < recentPoints.length; i++) {
        const prev2 = recentPoints[i - 2];
        const prev1 = recentPoints[i - 1];
        const curr = recentPoints[i];
        
        // Time differences
        const timeDiff1 = (prev1.timestamp - prev2.timestamp) / 1000;
        const timeDiff2 = (curr.timestamp - prev1.timestamp) / 1000;
        
        // Calculate speeds
        const speed1 = timeDiff1 > 0 ? 
          Math.hypot(prev1.x - prev2.x, prev1.y - prev2.y) / timeDiff1 : 0;
        const speed2 = timeDiff2 > 0 ? 
          Math.hypot(curr.x - prev1.x, curr.y - prev1.y) / timeDiff2 : 0;
        
        // Calculate acceleration
        const acceleration = timeDiff2 > 0 ? (speed2 - speed1) / timeDiff2 : 0;
        
        // Calculate direction change
        const angle1 = Math.atan2(prev1.y - prev2.y, prev1.x - prev2.x);
        const angle2 = Math.atan2(curr.y - prev1.y, curr.x - prev1.x);
        const angleDiff = Math.abs(angle2 - angle1);
        
        recentFeatures.push([
          speed2,
          acceleration,
          angleDiff,
          Math.hypot(curr.x - prev2.x, curr.y - prev2.y)
        ]);
      }

      // Normalize features using the active profile's normalization factors
      const { means, std } = normalizationFactorsRef.current;
      const normalizedFeatures = recentFeatures.map(f => 
        f.map((val, i) => (val - means[i]) / std[i])
      );

      const inputTensor = tf.tensor2d(normalizedFeatures, [normalizedFeatures.length, 4]);
      const predictions = await modelRef.current.predict(inputTensor).data();
      inputTensor.dispose();

      const score = predictions.reduce((a, b) => a + b, 0) / predictions.length * 100;
      setConfidence(Math.round(score * 10) / 10); // Keep one decimal place
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  // Load a user profile
  const loadProfile = (profileId) => {
    const profile = userProfiles.find(p => p.id === profileId);
    if (profile) {
      normalizationFactorsRef.current = profile.normalizationFactors;
      setActiveProfile(profileId);
      setModelStatus(`Loaded profile: ${profile.name}`);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Advanced Mouse Behavior Authenticator</title>
        <meta name="description" content="AI-powered mouse behavior analysis with advanced features" />
      </Head>

      {/* Hidden canvas for mouse path visualization */}
      <canvas 
        ref={canvasRef} 
        className={styles.mouseCanvas}
        style={{ display: 'none' }}
      />

      <main className={styles.main}>
        <h1 className={styles.title}>Advanced Mouse Authentication</h1>
        
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
                Verify Identity
              </button>
            </div>
            
            <div className={styles.statusCard}>
              <p className={styles.fontMedium}>Model Status:</p>
              <p className={styles.textSm}>{modelStatus}</p>
            </div>

            {userProfiles.length > 0 && (
              <div className={styles.profileSection}>
                <h3 className={styles.fontMedium}>User Profiles</h3>
                <div className={styles.profileList}>
                  {userProfiles.map(profile => (
                    <div 
                      key={profile.id} 
                      className={`${styles.profileItem} ${activeProfile === profile.id ? styles.activeProfile : ''}`}
                      onClick={() => loadProfile(profile.id)}
                    >
                      {profile.name}
                      <span className={styles.profileDate}>
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Live Data</h2>
            <div className={styles.spaceY4}>
              <div>
                <p className={styles.fontMedium}>Data Points Collected:</p>
                <p className={styles.dataValue}>{mouseData.length}</p>
              </div>
              
              <div>
                <p className={styles.fontMedium}>Recent Mouse Metrics:</p>
                <div className={styles.dataDisplay}>
                  {recentSpeeds.length > 0 ? (
                    <table className={styles.metricsTable}>
                      <thead>
                        <tr>
                          <th>Speed</th>
                          <th>Acceleration</th>
                          <th>Direction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSpeeds.slice().reverse().map((metric, i) => (
                          <tr key={i}>
                            <td>{Math.round(metric.speed)} px/s</td>
                            <td>{metric.acceleration.toFixed(2)} px/s²</td>
                            <td>{metric.directionChanges ? 'Changed' : 'Same'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : 'No data yet'}
                </div>
              </div>

              <div>
                <p className={styles.fontMedium}>Advanced Metrics:</p>
                <div className={styles.advancedMetrics}>
                  <div className={styles.metricItem}>
                    <span>Avg Speed:</span>
                    <span>{advancedMetrics.avgSpeed.toFixed(1)} px/s</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Speed Variance:</span>
                    <span>{advancedMetrics.speedVariance.toFixed(1)}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Direction Changes:</span>
                    <span>{advancedMetrics.directionChanges}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span>Avg Acceleration:</span>
                    <span>{advancedMetrics.acceleration.toFixed(2)} px/s²</span>
                  </div>
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
              <div 
                className={styles.confidenceBar}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <p className={styles.textGray700}>
              {confidence >= 85 ? '✅ High confidence - Verified user' :
               confidence >= 65 ? '⚠️ Moderate confidence - Similar behavior' :
               '❌ Low confidence - Unrecognized behavior'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;