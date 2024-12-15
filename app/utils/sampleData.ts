/* eslint-disable @typescript-eslint/no-unused-vars */
import { LossDataPoint, ConfusionMatrixData, FeatureData, Prediction3D } from '../../types';

// Generate sample loss curve data
export function generateLossData(epochs: number = 50): LossDataPoint[] {
  const data: LossDataPoint[] = [];
  
  // Start with higher loss values
  let trainLoss = 2 + Math.random() * 0.5;
  let valLoss = trainLoss + 0.5 + Math.random() * 0.5;
  
  for (let epoch = 1; epoch <= epochs; epoch++) {
    // Decrease loss over time with some random fluctuations
    trainLoss = Math.max(0.1, trainLoss * (0.92 + Math.random() * 0.06));
    
    // Validation loss decreases more slowly and eventually plateaus
    if (epoch < 35) {
      valLoss = Math.max(0.2, valLoss * (0.94 + Math.random() * 0.04));
    } else {
      // Potential overfitting - validation loss might increase slightly
      valLoss = valLoss * (0.99 + Math.random() * 0.04);
    }
    
    data.push({
      epoch,
      trainLoss: Number(trainLoss.toFixed(4)),
      valLoss: Number(valLoss.toFixed(4))
    });
  }
  
  return data;
}

// Generate a sample confusion matrix
export function generateConfusionMatrix(numClasses: number = 5): ConfusionMatrixData {
  const labels = Array.from({ length: numClasses }, (_, i) => `Class ${String.fromCharCode(65 + i)}`);
  const matrix: number[][] = [];
  
  for (let i = 0; i < numClasses; i++) {
    const row: number[] = [];
    let remainingProbability = 1;
    
    // The diagonal elements (correct predictions) should have higher values
    const correctPredProb = 0.6 + Math.random() * 0.3; // Between 60% and 90%
    remainingProbability -= correctPredProb;
    
    for (let j = 0; j < numClasses; j++) {
      if (i === j) {
        // Correct prediction (diagonal)
        row.push(Math.floor(correctPredProb * 100));
      } else {
        // Distribute remaining probability among incorrect classes
        // Last element gets all remaining probability to ensure sum is 100
        if (j === numClasses - 1 && i !== numClasses - 1) {
          row.push(Math.floor(remainingProbability * 100));
        } else {
          const wrongPredProb = remainingProbability / (numClasses - 1) * (0.5 + Math.random());
          row.push(Math.floor(wrongPredProb * 100));
          remainingProbability -= wrongPredProb;
        }
      }
    }
    
    matrix.push(row);
  }
  
  return { matrix, labels };
}

// Generate sample feature importance data
export function generateFeatureImportance(numFeatures: number = 15): FeatureData[] {
  const featureTypes = ['numerical', 'categorical', 'textual'];
  const data: FeatureData[] = [];
  
  for (let i = 0; i < numFeatures; i++) {
    // Feature importance generally follows a power law distribution
    const importance = Math.pow(0.8, i) * (0.8 + Math.random() * 0.4);
    
    data.push({
      feature: `Feature ${i + 1}`,
      importance: Number(importance.toFixed(4)),
      category: featureTypes[Math.floor(Math.random() * featureTypes.length)]
    });
  }
  
  // Sort by importance
  return data.sort((a, b) => b.importance - a.importance);
}

// Generate 3D prediction data points
export function generatePredictions3D(numPoints: number = 200): Prediction3D[] {
  const data: Prediction3D[] = [];
  const classes = ['Class A', 'Class B', 'Class C', 'Class D'];
  
  // Generate clusters for each class
  classes.forEach((className, classIndex) => {
    // Define a cluster center for this class
    const centerX = (Math.random() * 2 - 1) * 3;
    const centerY = (Math.random() * 2 - 1) * 3;
    const centerZ = (Math.random() * 2 - 1) * 3;
    
    // Generate points around this center
    const pointsPerClass = Math.floor(numPoints / classes.length);
    for (let i = 0; i < pointsPerClass; i++) {
      // Generate point with some scatter around the center
      const scatter = 0.8;
      const x = centerX + (Math.random() * 2 - 1) * scatter;
      const y = centerY + (Math.random() * 2 - 1) * scatter;
      const z = centerZ + (Math.random() * 2 - 1) * scatter;
      
      // Determine if this is a misclassification (about 10-15% of points)
      const isMisclassified = Math.random() < 0.15;
      const predictedClass = isMisclassified 
        ? classes[Math.floor(Math.random() * classes.length)] 
        : className;
      
      // Calculate confidence - higher for correct classifications
      const confidence = isMisclassified
        ? 0.4 + Math.random() * 0.3 // 40-70% confidence for mistakes
        : 0.75 + Math.random() * 0.25; // 75-100% confidence for correct ones
      
      data.push({
        id: data.length,
        x,
        y,
        z,
        actual: className,
        predicted: predictedClass,
        confidence: Number(confidence.toFixed(2))
      });
    }
  });
  
  return data;
}