'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function WebGLComparison() {
  const trellisRef = useRef<HTMLDivElement | null>(null);
  const rodinRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initScene = (container: HTMLDivElement) => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Grid helper
    const size = 10;
    const divisions = 10;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x404040, 0x404040);
    scene.add(gridHelper);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    return { scene, camera, renderer, controls };
  };

  useEffect(() => {
    const trellisContainer = trellisRef.current;
    const rodinContainer = rodinRef.current;
    if (!trellisContainer || !rodinContainer) return;

    // Initialize both scenes
    const trellis = initScene(trellisContainer);
    const rodin = initScene(rodinContainer);

    // Load models
    const loader = new GLTFLoader();

    // Load Trellis model
    loader.load('/models/trellis.glb', (gltf) => {
      const model = gltf.scene;
      trellis.scene.add(model);
      setLoading(false);
    });

    // Load Rodin model
    loader.load('/models/rodin.glb', (gltf) => {
      const model = gltf.scene;
      rodin.scene.add(model);
      setLoading(false);
    });

    // Animation loops
    const animateTrellis = () => {
      requestAnimationFrame(animateTrellis);
      trellis.controls.update();
      trellis.renderer.render(trellis.scene, trellis.camera);
    };

    const animateRodin = () => {
      requestAnimationFrame(animateRodin);
      rodin.controls.update();
      rodin.renderer.render(rodin.scene, rodin.camera);
    };

    animateTrellis();
    animateRodin();

    // Handle resize
    const handleResize = () => {
      if (!trellisContainer || !rodinContainer) return;

      // Update Trellis
      trellis.camera.aspect = trellisContainer.clientWidth / trellisContainer.clientHeight;
      trellis.camera.updateProjectionMatrix();
      trellis.renderer.setSize(trellisContainer.clientWidth, trellisContainer.clientHeight);

      // Update Rodin
      rodin.camera.aspect = rodinContainer.clientWidth / rodinContainer.clientHeight;
      rodin.camera.updateProjectionMatrix();
      rodin.renderer.setSize(rodinContainer.clientWidth, rodinContainer.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      trellisContainer.removeChild(trellis.renderer.domElement);
      rodinContainer.removeChild(rodin.renderer.domElement);
      trellis.renderer.dispose();
      rodin.renderer.dispose();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
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
            <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">GLTFLoader</span>
            <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">OrbitControls</span>
            <span className="px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">WebGL</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trellis Container */}
        <div className="relative h-[400px] border border-gray-200 rounded-lg overflow-hidden">
          <div ref={trellisRef} className="absolute inset-0" />
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">Trellis 3D AI Model</h3>
            <a
              href="https://arxiv.org/abs/2412.01506"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-7.5 13.5h-3v-6h3v6zm0-7.5h-3v-3h3v3zm6 7.5h-3v-9h3v9zm0-10.5h-3v-3h3v3z" />
              </svg>
              arXiv:2412.01506
            </a>
          </div>
        </div>

        {/* Rodin Container */}
        <div className="relative h-[400px] border border-gray-200 rounded-lg overflow-hidden">
          <div ref={rodinRef} className="absolute inset-0" />
          <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">Rodin 3D AI Model</h3>
            <a
              href="https://arxiv.org/abs/2212.06135"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-7.5 13.5h-3v-6h3v6zm0-7.5h-3v-3h3v3zm6 7.5h-3v-9h3v9zm0-10.5h-3v-3h3v3z" />
              </svg>
              arXiv:2212.06135
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2 text-blue-800">Interaction Guide</h3>
        <ul className="pl-5 list-disc space-y-1 text-blue-700">
          <li>Left click + drag to rotate the view</li>
          <li>Right click + drag to pan</li>
          <li>Scroll to zoom in/out</li>
          <li>Double click to reset the view</li>
        </ul>
      </div>
    </div>
  );
}