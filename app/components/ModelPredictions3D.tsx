'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Prediction3D } from '../../types';

interface ModelPredictions3DProps {
    data: Prediction3D[];
}

export default function ModelPredictions3D({ data }: ModelPredictions3DProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const [highlightClass, setHighlightClass] = useState<string | null>(null);
    const [showMisclassified, setShowMisclassified] = useState<boolean>(true);

    // Get unique classes for legend
    const uniqueClasses = Array.from(new Set(data.map(d => d.actual)));

    // Generate colors for classes
    const classColors = useMemo(() => {
        const colors: { [key: string]: string } = {};
        uniqueClasses.forEach((className, index) => {
            const hue = (index / uniqueClasses.length) * 360;
            colors[className] = `hsl(${hue}, 70%, 50%)`;
        });
        return colors;
    }, [uniqueClasses]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing scene/renderer
        if (rendererRef.current) {
            rendererRef.current.dispose();
            containerRef.current.innerHTML = '';
        }

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        sceneRef.current = scene;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current = renderer;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = 500; // Fixed height
        renderer.setSize(containerWidth, containerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            containerWidth / containerHeight,
            0.1,
            1000
        );
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Axes helper
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Add coordinate labels
        const addCoordinateLabel = (text: string, position: THREE.Vector3) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;

            const context = canvas.getContext('2d');
            if (context) {
                context.fillStyle = 'rgba(255, 255, 255, 0.95)';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.font = 'bold 24px Arial';
                context.fillStyle = 'black';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(text, canvas.width / 2, canvas.height / 2);

                const texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;

                const material = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(material);
                sprite.position.copy(position);
                sprite.scale.set(1, 0.5, 1);

                scene.add(sprite);
            }
        };

        addCoordinateLabel('X', new THREE.Vector3(5.5, 0, 0));
        addCoordinateLabel('Y', new THREE.Vector3(0, 5.5, 0));
        addCoordinateLabel('Z', new THREE.Vector3(0, 0, 5.5));

        // Grid helpers
        const gridHelperXY = new THREE.GridHelper(10, 10);
        gridHelperXY.rotation.x = Math.PI / 2;
        scene.add(gridHelperXY);

        const gridHelperXZ = new THREE.GridHelper(10, 10);
        scene.add(gridHelperXZ);

        const gridHelperYZ = new THREE.GridHelper(10, 10);
        gridHelperYZ.rotation.z = Math.PI / 2;
        scene.add(gridHelperYZ);

        // Create a group for data points
        const pointsGroup = new THREE.Group();
        scene.add(pointsGroup);

        // Define materials and geometry for data points
        const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);

        // Function to update visible points based on filters
        const updatePoints = () => {
            // Clear previous points
            while (pointsGroup.children.length > 0) {
                pointsGroup.remove(pointsGroup.children[0]);
            }

            // Add new points
            data.forEach(point => {
                // Skip if filtering misclassified points
                const isMisclassified = point.actual !== point.predicted;
                if (!showMisclassified && isMisclassified) return;

                // Skip if filtering by class
                if (highlightClass && point.actual !== highlightClass) return;

                // Determine color based on correct/incorrect classification
                let color;
                if (isMisclassified) {
                    // For misclassified: blend actual class color with red
                    const baseColor = new THREE.Color(classColors[point.actual]);
                    const errorColor = new THREE.Color(0xff3333);
                    color = baseColor.lerp(errorColor, 0.5);
                } else {
                    // For correct classifications: use class color
                    color = new THREE.Color(classColors[point.actual]);
                }

                // Create material with color
                const pointMaterial = new THREE.MeshStandardMaterial({
                    color,
                    opacity: isMisclassified ? 0.9 : 0.8,
                    transparent: true,
                    emissive: color,
                    emissiveIntensity: 0.2
                });

                const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

                // Position based on coordinates
                pointMesh.position.set(point.x, point.y, point.z);

                // Scale based on confidence
                const scale = 0.8 + point.confidence;
                pointMesh.scale.set(scale, scale, scale);

                // Add to group
                pointsGroup.add(pointMesh);

                // Add tooltip annotation for misclassified points
                if (isMisclassified) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 128;
                    canvas.height = 48;

                    const context = canvas.getContext('2d');
                    if (context) {
                        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.font = '12px Arial';
                        context.fillStyle = 'black';
                        context.textAlign = 'center';
                        context.textBaseline = 'middle';
                        context.fillText(`${point.actual} → ${point.predicted}`, canvas.width / 2, canvas.height / 2);

                        const texture = new THREE.Texture(canvas);
                        texture.needsUpdate = true;

                        const material = new THREE.SpriteMaterial({ map: texture });
                        const sprite = new THREE.Sprite(material);
                        sprite.position.set(point.x, point.y + 0.3, point.z);
                        sprite.scale.set(0.5, 0.2, 1);

                        pointsGroup.add(sprite);
                    }
                }
            });
        };

        // Initial points update
        updatePoints();

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current) return;

            const width = containerRef.current.clientWidth;
            camera.aspect = width / containerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(width, containerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Set up filter update effect
        const filterUpdateEffect = () => {
            updatePoints();
        };

        // Call filter effect when highlight class or show misclassified changes
        filterUpdateEffect();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            controls.dispose();
        };
    }, [data, highlightClass, showMisclassified, classColors]);

    return (
        <div className="model-predictions-3d-container">
            <div className="flex flex-col space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">ML 3D Model Predictions Visualization</h2>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-800 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">Technical Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">Three.js</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">OrbitControls</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">WebGL</span>
                        <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">React/Next.js</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center space-x-6">
                    {/* Highlight Class Selector */}
                    <div className="min-w-[200px]">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span>Highlight Class</span>
                        </label>
                        <div className="relative">
                            <select
                                aria-label="Highlight Class"
                                value={highlightClass || ''}
                                onChange={(e) => setHighlightClass(e.target.value || null)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white shadow-sm 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                                         transition-colors duration-200 ease-in-out"
                            >
                                <option value="">All Classes</option>
                                {uniqueClasses.map(className => (
                                    <option key={className} value={className}>
                                        {className}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Misclassified Points Toggle */}
                    <div className="flex items-center">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={showMisclassified}
                                    onChange={() => setShowMisclassified(!showMisclassified)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                              peer-focus:ring-blue-300 rounded-full peer 
                                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                                              after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                ></div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                    Show Misclassified Points
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="w-full border border-gray-200 rounded-lg bg-gray-50 overflow-hidden"
                style={{ height: '500px' }}
            ></div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {uniqueClasses.map(className => (
                    <div
                        key={className}
                        className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-100"
                        onClick={() => setHighlightClass(highlightClass === className ? null : className)}
                    >
                        <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: classColors[className] }}
                        ></div>
                        <span className="text-sm">{className}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">3D Predictions Analysis</h3>
                <p className="text-blue-700 mb-3">
                    This 3D visualization shows model predictions in feature space. Each point represents a sample, colored by
                    its actual class. Misclassified points are highlighted with blended colors.
                </p>
                <ul className="list-disc pl-5 text-blue-700">
                    <li>Drag to rotate the view, scroll to zoom in/out</li>
                    <li>Click on a class in the legend to highlight only that class</li>
                    <li>Toggle the &quot;Show Misclassified Points&quot; option to focus on model errors</li>
                    <li>Points are sized based on the model&apos;s confidence in its prediction</li>
                </ul>
            </div>
        </div>
    );
}