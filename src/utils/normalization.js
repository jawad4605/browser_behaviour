/**
 * Normalization utilities for mouse behavior data
 */

/**
 * Normalizes data to 0-1 range using min-max scaling
 * @param {number[]} values - Array of values to normalize
 * @returns {Object} { normalized: number[], min: number, max: number }
 */
export function normalizeData(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return { normalized: [], min: 0, max: 1 };
    }
  
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Prevent division by zero
  
    return {
      normalized: values.map(v => (v - min) / range),
      min,
      max,
      range
    };
  }
  
  /**
   * Normalizes new values based on precomputed min/max
   * @param {number[]} values - New values to normalize
   * @param {number} min - Precomputed minimum
   * @param {number} max - Precomputed maximum
   * @returns {number[]} Normalized values
   */
  export function normalizeWithParams(values, min, max) {
    const range = max - min || 1;
    return values.map(v => (v - min) / range);
  }
  
  /**
   * Standardize data (z-score normalization)
   * @param {number[]} values - Values to standardize
   * @returns {Object} { standardized: number[], mean: number, std: number }
   */
  export function standardizeData(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return { standardized: [], mean: 0, std: 1 };
    }
  
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    ) || 1; // Prevent division by zero
  
    return {
      standardized: values.map(v => (v - mean) / std),
      mean,
      std
    };
  }
  
  /**
   * Normalize mouse movement features
   * @param {Object[]} movements - Array of {x, y, timestamp}
   * @returns {Object} Normalized features and parameters
   */
  export function normalizeMouseFeatures(movements) {
    if (movements.length < 2) {
      return {
        speeds: [],
        accelerations: [],
        directions: [],
        speedParams: { min: 0, max: 1 },
        accelParams: { min: 0, max: 1 }
      };
    }
  
    // Calculate features
    const features = {
      speeds: [],
      accelerations: [],
      directions: []
    };
  
    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i-1];
      const curr = movements[i];
      
      // Time difference in seconds
      const dt = (curr.timestamp - prev.timestamp) / 1000;
      
      if (dt > 0) {
        // Distance moved
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const distance = Math.hypot(dx, dy);
        
        // Speed (px/s)
        const speed = distance / dt;
        features.speeds.push(speed);
        
        // Direction angle (radians)
        features.directions.push(Math.atan2(dy, dx));
        
        // Acceleration (px/s²)
        if (i > 1) {
          const prevSpeed = features.speeds[i-2];
          features.accelerations.push((speed - prevSpeed) / dt);
        }
      }
    }
  
    // Normalize features
    const speedNorm = normalizeData(features.speeds);
    const accelNorm = normalizeData(features.accelerations);
  
    return {
      speeds: speedNorm.normalized,
      accelerations: accelNorm.normalized,
      directions: features.directions,
      speedParams: { min: speedNorm.min, max: speedNorm.max },
      accelParams: { min: accelNorm.min, max: accelNorm.max }
    };
  }
  
  /**
   * Denormalize data back to original scale
   * @param {number[]} normalized - Normalized values (0-1)
   * @param {number} min - Original minimum
   * @param {number} max - Original maximum
   * @returns {number[]} Denormalized values
   */
  export function denormalizeData(normalized, min, max) {
    const range = max - min || 1;
    return normalized.map(v => v * range + min);
  }
  
  // Unit conversion utilities
  export const pxToCm = (px, dpi = 96) => px / dpi * 2.54;
  export const cmToPx = (cm, dpi = 96) => cm / 2.54 * dpi;