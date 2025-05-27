// Simple similarity-based model
export function trainModel(trainingData) {
  // Calculate average speed and angle patterns
  const avgSpeed = trainingData.reduce((sum, point) => sum + point.speed, 0) / trainingData.length;
  const avgAngle = trainingData.reduce((sum, point) => sum + point.angle, 0) / trainingData.length;
  
  // Calculate variance
  const speedVariance = trainingData.reduce((sum, point) => sum + Math.pow(point.speed - avgSpeed, 2), 0) / trainingData.length;
  const angleVariance = trainingData.reduce((sum, point) => sum + Math.pow(point.angle - avgAngle, 2), 0) / trainingData.length;
  
  return {
    avgSpeed,
    avgAngle,
    speedVariance,
    angleVariance,
    dataPoints: trainingData.length
  };
}

export function predict(model, newData) {
  if (newData.length === 0) return 0;
  
  // Calculate average features of new data
  const newAvgSpeed = newData.reduce((sum, point) => sum + point.speed, 0) / newData.length;
  const newAvgAngle = newData.reduce((sum, point) => sum + point.angle, 0) / newData.length;
  
  // Calculate similarity score (0-1)
  const speedDifference = Math.abs(newAvgSpeed - model.avgSpeed);
  const angleDifference = Math.abs(newAvgAngle - model.avgAngle);
  
  // Normalize differences using variance
  const speedScore = Math.exp(-0.5 * Math.pow(speedDifference, 2) / model.speedVariance);
  const angleScore = Math.exp(-0.5 * Math.pow(angleDifference, 2) / model.angleVariance);
  
  // Combined score (simple average)
  const combinedScore = (speedScore + angleScore) / 2;
  
  return Math.min(1, Math.max(0, combinedScore));
}