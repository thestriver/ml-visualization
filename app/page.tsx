'use client';

import { useState } from 'react';
import { Tab, MLMetricsData } from '../types';
import { WebGLComparison, LossCurveChart, ConfusionMatrixHeatmap, FeatureImportanceChart, ModelPredictions3D } from './components';
import TabNavigation from './components/TabNavigation';
import { generateLossData, generateConfusionMatrix, generateFeatureImportance, generatePredictions3D } from './utils/sampleData';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('loss');

  // Generate ML metrics data
  const [metricsData, setMetricsData] = useState<MLMetricsData>({
    lossData: generateLossData(),
    confusionMatrix: generateConfusionMatrix(),
    featureImportance: generateFeatureImportance(),
    predictions3D: generatePredictions3D()
  });

  // Function to generate new random data
  const generateNewData = () => {
    setMetricsData({
      lossData: generateLossData(),
      confusionMatrix: generateConfusionMatrix(),
      featureImportance: generateFeatureImportance(),
      predictions3D: generatePredictions3D()
    });
  };

  const tabs: Tab[] = [
    { id: 'loss', label: 'Loss Curves' },
    { id: 'confusion', label: 'Confusion Matrix' },
    { id: 'importance', label: 'Feature Importance' },
    { id: 'webgl', label: 'ML 3D Model Comparison' },
    { id: 'predictions', label: 'ML 3D Predictions' }
  ];

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Machine Learning Visualization</h1>
        <p className="text-gray-600">Created with Next.js, TypeScript, Tailwind CSS, D3.js, visx, and Three.js (WebGL)</p>
      </header>

      <div className="flex justify-between items-center mb-2">
        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {['loss', 'confusion', 'importance', 'predictions'].includes(activeTab) && (
          <button
            onClick={generateNewData}
            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
          >
            Generate New Data
          </button>
        )}
      </div>

      <main className="bg-white border border-gray-200 p-6 rounded-lg shadow-md min-h-[600px]">

        {activeTab === 'webgl' && <WebGLComparison />}

        {activeTab === 'loss' && (
          <LossCurveChart data={metricsData.lossData} />
        )}

        {activeTab === 'confusion' && (
          <ConfusionMatrixHeatmap data={metricsData.confusionMatrix} />
        )}

        {activeTab === 'importance' && (
          <FeatureImportanceChart data={metricsData.featureImportance} />
        )}

        {activeTab === 'predictions' && (
          <ModelPredictions3D data={metricsData.predictions3D} />
        )}
      </main>

      <footer className="mt-8 text-center text-gray-500">
        <p>@2025 by Mahmud Adeleye</p>
      </footer>
    </div>
  );
}