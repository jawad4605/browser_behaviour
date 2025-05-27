export function trainModel(trainingData) {
  const avgSpeed = trainingData.reduce((sum, point) => sum + point.speed, 0) / trainingData.length;
  const avgAngle = trainingData.reduce((sum, point) => sum + point.angle, 0) / trainingData.length;
  
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
  
  const newAvgSpeed = newData.reduce((sum, point) => sum + point.speed, 0) / newData.length;
  const newAvgAngle = newData.reduce((sum, point) => sum + point.angle, 0) / newData.length;
  
  const speedDifference = Math.abs(newAvgSpeed - model.avgSpeed);
  const angleDifference = Math.abs(newAvgAngle - model.avgAngle);
  
  const speedScore = Math.exp(-0.5 * Math.pow(speedDifference, 2) / model.speedVariance);
  const angleScore = Math.exp(-0.5 * Math.pow(angleDifference, 2) / model.angleVariance);
  
  const combinedScore = (speedScore + angleScore) / 2;
  
  return Math.min(1, Math.max(0, combinedScore));
}