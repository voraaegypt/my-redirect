import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneType, TrackingSettings, TrackingStats } from '../types';

interface VRSceneProps {
  stats: TrackingStats;
  settings: TrackingSettings;
}

export const VRScene: React.FC<VRSceneProps> = ({ stats, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs to hold Three.js core objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const leftCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rightCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraRigRef = useRef<THREE.Group | null>(null);
  
  // Keep track of materials and objects to dispose on unmount/scene change
  const sceneObjectsRef = useRef<THREE.Object3D[]>([]);

  // Update cameras' positions and rotations whenever stats change
  useEffect(() => {
    const rig = cameraRigRef.current;
    const leftCam = leftCameraRef.current;
    const rightCam = rightCameraRef.current;

    if (!rig || !leftCam || !rightCam) return;

    // Apply head position and rotation to the single anchor camera rig
    rig.position.set(stats.posX, stats.posY, stats.posZ);
    rig.rotation.set(stats.rotPitch, stats.rotYaw, 0, 'YXZ');

    // Apply rigid Interpupillary Distance (IPD) offsets in local space
    leftCam.position.set(-settings.ipd / 2, 0, 0);
    rightCam.position.set(settings.ipd / 2, 0, 0);

    // Keep cameras looking parallel (pointing forward relative to rig)
    leftCam.rotation.set(0, 0, 0);
    rightCam.rotation.set(0, 0, 0);
  }, [stats.posX, stats.posY, stats.posZ, stats.rotYaw, stats.rotPitch, settings.ipd]);

  // Handle scene creation and rebuilding
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Initialize Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    // Enable scissor test for split screen rendering
    renderer.setScissorTest(true);
    rendererRef.current = renderer;

    // 2. Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set background according to chosen style
    if (settings.selectedScene === 'neon') {
      scene.background = new THREE.Color(0x05010a);
      scene.fog = new THREE.FogExp2(0x05010a, 0.04);
    } else if (settings.selectedScene === 'grid') {
      scene.background = new THREE.Color(0x0a0c10);
      scene.fog = new THREE.FogExp2(0x0a0c10, 0.02);
    } else if (settings.selectedScene === 'voxels') {
      scene.background = new THREE.Color(0xdceefb);
      scene.fog = new THREE.FogExp2(0xdceefb, 0.015);
    } else {
      // pillars
      scene.background = new THREE.Color(0xf0f4f8);
      scene.fog = new THREE.FogExp2(0xf0f4f8, 0.02);
    }

    // 3. Initialize Stereo Cameras and Rig (Single-Core Tracking Group)
    const cameraRig = new THREE.Group();
    scene.add(cameraRig);
    cameraRigRef.current = cameraRig;

    const aspect = (width / 2) / height;
    const leftCamera = new THREE.PerspectiveCamera(settings.fov, aspect, 0.1, 1000);
    const rightCamera = new THREE.PerspectiveCamera(settings.fov, aspect, 0.1, 1000);
    
    // Attach cameras as children to the anchor rig
    cameraRig.add(leftCamera);
    cameraRig.add(rightCamera);
    
    leftCameraRef.current = leftCamera;
    rightCameraRef.current = rightCamera;

    // Set initial local position offsets inside the rig space
    leftCamera.position.set(-settings.ipd / 2, 0, 0);
    rightCamera.position.set(settings.ipd / 2, 0, 0);

    // 4. Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, settings.selectedScene === 'neon' ? 0.2 : 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5b4fc, 0.4);
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    // 5. Build Chosen Environment
    buildEnvironment(scene, settings.selectedScene);

    // 6. Handle Resizing
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !leftCameraRef.current || !rightCameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      rendererRef.current.setSize(w, h);
      
      const newAspect = (w / 2) / h;
      leftCameraRef.current.aspect = newAspect;
      leftCameraRef.current.updateProjectionMatrix();
      
      rightCameraRef.current.aspect = newAspect;
      rightCameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // 7. Render Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const currentRenderer = rendererRef.current;
      const currentScene = sceneRef.current;
      const leftCam = leftCameraRef.current;
      const rightCam = rightCameraRef.current;

      if (!currentRenderer || !currentScene || !leftCam || !rightCam) return;

      const w = currentRenderer.domElement.clientWidth;
      const h = currentRenderer.domElement.clientHeight;
      const halfW = w / 2;

      // Rotate some dynamic objects in the scene
      sceneObjectsRef.current.forEach((obj) => {
        if (obj.userData?.isDynamic) {
          obj.rotation.y = elapsed * (obj.userData.speed || 0.5) + obj.userData.offset;
          obj.rotation.x = Math.sin(elapsed * 0.2) * 0.3;
        }
      });

      // RENDER LEFT EYE (Left viewport)
      currentRenderer.setViewport(0, 0, halfW, h);
      currentRenderer.setScissor(0, 0, halfW, h);
      currentRenderer.render(currentScene, leftCam);

      // RENDER RIGHT EYE (Right viewport)
      currentRenderer.setViewport(halfW, 0, halfW, h);
      currentRenderer.setScissor(halfW, 0, halfW, h);
      currentRenderer.render(currentScene, rightCam);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      // Dispose meshes & materials
      sceneObjectsRef.current.forEach(obj => {
        scene.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      sceneObjectsRef.current = [];
      renderer.dispose();
    };
  }, [settings.selectedScene, settings.fov]);

  // Procedural environment builder
  const buildEnvironment = (scene: THREE.Scene, type: SceneType) => {
    // Ground Grid
    let gridHelper: THREE.GridHelper;
    if (type === 'neon') {
      gridHelper = new THREE.GridHelper(200, 100, 0xd946ef, 0x4a044e);
    } else if (type === 'grid') {
      gridHelper = new THREE.GridHelper(200, 100, 0x3b82f6, 0x1e3a8a);
    } else if (type === 'voxels') {
      gridHelper = new THREE.GridHelper(200, 100, 0x10b981, 0x064e3b);
    } else {
      gridHelper = new THREE.GridHelper(200, 100, 0x475569, 0xcbd5e1);
    }
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    sceneObjectsRef.current.push(gridHelper);

    // Floor Plane
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    let floorMat: THREE.Material;

    if (type === 'neon') {
      floorMat = new THREE.MeshStandardMaterial({ color: 0x020005, roughness: 0.8 });
    } else if (type === 'grid') {
      floorMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.5 });
    } else if (type === 'voxels') {
      floorMat = new THREE.MeshStandardMaterial({ color: 0xd1fae5, roughness: 0.9 });
    } else {
      floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    }
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);
    sceneObjectsRef.current.push(floorMesh);

    // InstancedMesh or dynamic geometric sets for depth
    if (type === 'voxels') {
      // Voxel World (Minecraft Style Voxel Grid)
      // Render 600 voxels with varied heights and colors
      const voxelCount = 600;
      const boxGeo = new THREE.BoxGeometry(2, 2, 2);
      const voxelMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
      const instancedMesh = new THREE.InstancedMesh(boxGeo, voxelMat, voxelCount);

      const tempObject = new THREE.Object3D();
      const tempColor = new THREE.Color();
      const voxelPalette = [0xfeb2b2, 0xf97316, 0xfacc15, 0x4ade80, 0x60a5fa, 0xa78bfa];

      for (let i = 0; i < voxelCount; i++) {
        // Random layout (except immediately around origin to avoid spawning inside player)
        let rx = (Math.random() - 0.5) * 160;
        let rz = (Math.random() - 0.5) * 160;

        while (Math.sqrt(rx * rx + rz * rz) < 8) {
          rx = (Math.random() - 0.5) * 160;
          rz = (Math.random() - 0.5) * 160;
        }

        const height = 1 + Math.random() * 8;
        tempObject.position.set(
          Math.floor(rx / 2) * 2, 
          height / 2, 
          Math.floor(rz / 2) * 2
        );
        tempObject.scale.set(1, height / 2, 1);
        tempObject.updateMatrix();

        instancedMesh.setMatrixAt(i, tempObject.matrix);

        // Color voxels based on height
        const paletteIndex = Math.floor(Math.random() * voxelPalette.length);
        tempColor.setHex(voxelPalette[paletteIndex]);
        instancedMesh.setColorAt(i, tempColor);
      }

      scene.add(instancedMesh);
      sceneObjectsRef.current.push(instancedMesh);

    } else if (type === 'pillars') {
      // Endless Colorful Pillars
      const pillarCount = 120;
      const pillarGeo = new THREE.CylinderGeometry(0.8, 1.2, 15, 8);
      const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];

      for (let i = 0; i < pillarCount; i++) {
        const pColor = colors[i % colors.length];
        const pillarMat = new THREE.MeshStandardMaterial({
          color: pColor,
          roughness: 0.3,
          metalness: 0.1
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        
        let rx = (Math.random() - 0.5) * 140;
        let rz = (Math.random() - 0.5) * 140;
        while (Math.sqrt(rx * rx + rz * rz) < 6) {
          rx = (Math.random() - 0.5) * 140;
          rz = (Math.random() - 0.5) * 140;
        }

        const heightScale = 0.5 + Math.random() * 1.5;
        pillar.position.set(rx, 7.5 * heightScale, rz);
        pillar.scale.set(1, heightScale, 1);
        scene.add(pillar);
        sceneObjectsRef.current.push(pillar);
      }

    } else if (type === 'neon') {
      // Neon/Cyberpunk World
      const ringCount = 15;
      const torusGeo = new THREE.TorusGeometry(10, 0.4, 8, 32);
      
      // Floating Cyber rings
      for (let i = 0; i < ringCount; i++) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xec4899 : 0x06b6d4,
          wireframe: true
        });
        const ring = new THREE.Mesh(torusGeo, ringMat);
        ring.position.set(
          (Math.random() - 0.5) * 120,
          8 + Math.random() * 15,
          (Math.random() - 0.5) * 120
        );
        ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        
        // Add dynamic properties for rotation animation
        ring.userData = {
          isDynamic: true,
          speed: 0.2 + Math.random() * 0.4,
          offset: Math.random() * Math.PI
        };

        scene.add(ring);
        sceneObjectsRef.current.push(ring);
      }

      // Neon monoliths
      const pillarCount = 80;
      const monolithGeo = new THREE.BoxGeometry(1.5, 30, 1.5);
      const monolithMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0xd946ef,
        emissiveIntensity: 0.4
      });

      for (let i = 0; i < pillarCount; i++) {
        const monolith = new THREE.Mesh(monolithGeo, monolithMat.clone());
        let rx = (Math.random() - 0.5) * 150;
        let rz = (Math.random() - 0.5) * 150;
        while (Math.sqrt(rx * rx + rz * rz) < 10) {
          rx = (Math.random() - 0.5) * 150;
          rz = (Math.random() - 0.5) * 150;
        }

        monolith.position.set(rx, 15, rz);
        
        // Vary the glowing neon colors
        const mat = monolith.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(i % 3 === 0 ? 0xd946ef : i % 3 === 1 ? 0x06b6d4 : 0x10b981);
        mat.emissiveIntensity = 0.3 + Math.random() * 0.6;

        scene.add(monolith);
        sceneObjectsRef.current.push(monolith);
      }

    } else {
      // Tech Grid Playground
      // Floating spheres, octahedrons, knots in custom orbital tracks
      const shapes = [
        new THREE.OctahedronGeometry(2),
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.TorusKnotGeometry(1.2, 0.4, 64, 8)
      ];

      const colors = [0x3b82f6, 0xef4444, 0x10b981, 0x6366f1, 0xf59e0b];

      for (let i = 0; i < 40; i++) {
        const geo = shapes[i % shapes.length];
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          roughness: 0.2,
          metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 100,
          3 + Math.random() * 12,
          (Math.random() - 0.5) * 100
        );

        mesh.userData = {
          isDynamic: true,
          speed: 0.15 + Math.random() * 0.3,
          offset: Math.random() * Math.PI
        };

        scene.add(mesh);
        sceneObjectsRef.current.push(mesh);
      }
    }
  };

  return (
    <div id="vr-viewer-container" ref={containerRef} className="relative w-full h-full bg-black overflow-hidden select-none">
      <canvas id="vr-render-canvas" ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Center Divider line (acts as physical barrier aligner on phone lens partition) */}
      <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-neutral-900 pointer-events-none opacity-40 z-10" />

      {/* Stereoscopic Safety Boundary / Obstacle Warning (Neon Grid Flash Overlay) */}
      {stats.obstacleWarning && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 gap-0 z-20 animate-pulse">
          {/* Left Eye Obstacle Overlay */}
          <div className="relative border-4 border-red-500 bg-red-950/25 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-red-500 tracking-wider">! PROXIMITY ALERT !</div>
              <div className="font-mono text-xs text-red-400 mt-1">CAMERA BLOCKED OR MOVEMENT TOO FAST</div>
            </div>
            {/* Cyber Grid pattern inside */}
            <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>
          
          {/* Right Eye Obstacle Overlay */}
          <div className="relative border-4 border-red-500 bg-red-950/25 flex items-center justify-center">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-red-500 tracking-wider">! PROXIMITY ALERT !</div>
              <div className="font-mono text-xs text-red-400 mt-1">CAMERA BLOCKED OR MOVEMENT TOO FAST</div>
            </div>
            {/* Cyber Grid pattern inside */}
            <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>
        </div>
      )}

      {/* Basic alignment reticle helper (Crosshairs for stereoscopy) */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-2 gap-0 z-10 opacity-20">
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border border-white rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border border-white rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
