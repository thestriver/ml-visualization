export interface Tab {
  id: string;
  label: string;
}

export interface LossDataPoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
}

export interface ConfusionMatrixData {
  matrix: number[][];
  labels: string[];
}

export interface FeatureData {
  feature: string;
  importance: number;
  category: string;
}

export interface Prediction3D {
  id: number;
  x: number;
  y: number;
  z: number;
  actual: string;
  predicted: string;
  confidence: number;
}

export interface MLMetricsData {
  lossData: LossDataPoint[];
  confusionMatrix: ConfusionMatrixData;
  featureImportance: FeatureData[];
  predictions3D: Prediction3D[];
}