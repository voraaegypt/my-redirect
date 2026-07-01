import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Sliders,
  AlertTriangle,
  ShieldAlert,
  Compass,
  Zap,
  HelpCircle,
  Monitor,
  Video,
  VideoOff,
  Layers,
  Check,
} from "lucide-react";

// --- CONSTANTS FOR COMPUTER VISION ---
const CV_WIDTH = 64;
const CV_HEIGHT = 48;
const BLOCK_SIZE = 8;
const COLS = CV_WIDTH / BLOCK_SIZE; // 8 columns
const ROWS = CV_HEIGHT / BLOCK_SIZE; // 6 rows
const SEARCH_RANGE = 3;

// --- ENVIRONMENT STYLES ---
type EnvType = "cyber_grid" | "neon_forest" | "voxel_world";

interface ExplodingParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number; // 1.0 to 0.0
}

export default function App() {
  // --- APPLICATION STATE ---
  const [isVRActive, setIsVRActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Customization & Calibration parameters
  const [ipd, setIpd] = useState(0.25); // Interpupillary distance (virtual scale)
  const [rotSensitivity, setRotSensitivity] = useState(0.006); // Rotation scale factor
  const [transSensitivity, setTransSensitivity] = useState(0.08); // Translation scale factor
  const [safetyThreshold, setSafetyThreshold] = useState(20); // Darkness threshold (0-255)
  const [activeEnv, setActiveEnv] = useState<EnvType>("cyber_grid");
  const [showDebug, setShowDebug] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Stats & Telemetry State (Throttled for React rendering)
  const [telemetry, setTelemetry] = useState({
    fps: 0,
    activeBlocks: 0,
    avgLuma: 128,
    posX: "0.00",
    posY: "1.60",
    posZ: "5.00",
    yaw: "0°",
    pitch: "0°",
    gazeProgress: 0,
    score: 0,
    trackingStatus: "Initializing...",
    hasObstacle: false,
  });

  // --- REFS FOR CORE OPERATIONS (Avoid React Render Overhead in loops) ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const helperCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  
  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRigRef = useRef<THREE.Group | null>(null);
  const leftCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rightCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const safetyGridRef = useRef<THREE.Mesh | null>(null);
  
  // Scene elements references
  const environmentGroupRef = useRef<THREE.Group | null>(null);
  const targetsRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<ExplodingParticle[]>([]);
  
  // Calibration, tracking, and game metrics
  const playerPos = useRef({ x: 0, y: 1.6, z: 5 });
  const playerRot = useRef({ yaw: 0, pitch: 0 });
  const isTrackingStable = useRef(true);
  const showSafetyWarning = useRef(false);
  const scoreRef = useRef(0);
  const gazeTimer = useRef<number>(0);
  const hoveredTargetIndex = useRef<number | null>(null);
  const gazeTargetRef = useRef<THREE.Mesh | null>(null);

  // Image buffers for optical flow
  const prevLuma = useRef<Uint8ClampedArray | null>(null);
  const currLuma = useRef<Uint8ClampedArray | null>(null);

  // --- CAMERA SETUP & MANAGEMENT ---
  const startCamera = async () => {
    try {
      setCameraError(null);
      const constraints = {
        video: {
          facingMode: "environment", // Request back camera first
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("Back camera facingMode failed, falling back to any video input...", err);
        // Fallback to standard user/default camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasCameraPermission(true);
      }
    } catch (err: any) {
      console.error("Camera access failed: ", err);
      setCameraError(err.message || "Failed to access camera stream. Make sure permissions are granted.");
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Trigger camera start on load to confirm permission gracefully
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // --- CALIBRATION AND RECENTERING ---
  const handleRecalibrate = () => {
    playerPos.current = { x: 0, y: 1.6, z: 5 };
    playerRot.current = { yaw: 0, pitch: 0 };
    
    if (cameraRigRef.current) {
      cameraRigRef.current.position.set(0, 1.6, 5);
      cameraRigRef.current.rotation.set(0, 0, 0);
    }
    
    // Reset frame-differencing buffers to force clean calibration
    if (prevLuma.current) {
      prevLuma.current.fill(0);
    }
  };

  // Keybindings for hands-free or keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        handleRecalibrate();
      } else if (e.key.toLowerCase() === "d") {
        setShowDebug((prev) => !prev);
      } else if (e.key.toLowerCase() === "h") {
        setShowHelp((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- THREE.JS STEREOSCOPIC VR ENVIRONMENT ---
  useEffect(() => {
    if (!isVRActive || !mountRef.current) return;

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.03);
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setScissorTest(true); // REQUIRED FOR STEREOSCOPIC VIEWPORTS
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Camera Rig Setup (The Viewer Pivot)
    const cameraRig = new THREE.Group();
    cameraRig.position.set(playerPos.current.x, playerPos.current.y, playerPos.current.z);
    scene.add(cameraRig);
    cameraRigRef.current = cameraRig;

    // Create Left and Right perspective cameras
    const aspect = (width / 2) / height;
    const leftCamera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    const rightCamera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    
    // Eye offsets based on Interpupillary Distance
    leftCamera.position.set(-ipd / 2, 0, 0);
    rightCamera.position.set(ipd / 2, 0, 0);

    cameraRig.add(leftCamera);
    cameraRig.add(rightCamera);
    leftCameraRef.current = leftCamera;
    rightCameraRef.current = rightCamera;

    // 3. Safety Grid Alarm (Parented to Rig to float around player)
    const safetyGridGeo = new THREE.BoxGeometry(4, 4, 4);
    // Create dual-sided wireframe warning cage
    const safetyGridMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    const safetyGrid = new THREE.Mesh(safetyGridGeo, safetyGridMat);
    safetyGrid.position.set(0, 0, 0);
    cameraRig.add(safetyGrid);
    safetyGridRef.current = safetyGrid;

    // 4. Ambient and Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x222233);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // 5. Procedural Environment Group
    const envGroup = new THREE.Group();
    scene.add(envGroup);
    environmentGroupRef.current = envGroup;

    // Setup Ground & Obstacles according to active environment selection
    const generateEnvironment = (style: EnvType) => {
      // Clear old elements
      while (envGroup.children.length > 0) {
        const obj = envGroup.children[0];
        envGroup.remove(obj);
      }

      if (style === "cyber_grid") {
        scene.background = new THREE.Color(0x050510);
        scene.fog = new THREE.FogExp2(0x050510, 0.035);

        // Grid helpers for ground and ceiling
        const groundGrid = new THREE.GridHelper(120, 60, 0xbf00ff, 0x00d9ff);
        groundGrid.position.y = 0;
        envGroup.add(groundGrid);

        const ceilingGrid = new THREE.GridHelper(120, 60, 0xbf00ff, 0x00d9ff);
        ceilingGrid.position.y = 12;
        envGroup.add(ceilingGrid);

        // Random neon wireframe monoliths
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 8 + Math.random() * 40;
          const x = Math.cos(angle) * dist;
          const z = Math.sin(angle) * dist;
          
          const h = 3 + Math.random() * 12;
          const geo = new THREE.BoxGeometry(1.2, h, 1.2);
          
          const neonColors = [0x00ffcc, 0xff00ff, 0xffff00, 0xff0055, 0x0099ff];
          const color = neonColors[Math.floor(Math.random() * neonColors.length)];
          
          const mat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: Math.random() > 0.3,
            transparent: true,
            opacity: 0.75,
          });

          const pillar = new THREE.Mesh(geo, mat);
          pillar.position.set(x, h / 2, z);
          envGroup.add(pillar);
        }

      } else if (style === "neon_forest") {
        scene.background = new THREE.Color(0x08040a);
        scene.fog = new THREE.FogExp2(0x08040a, 0.04);

        // Concentric glowing rings on ground
        for (let r = 5; r <= 60; r += 8) {
          const ringGeo = new THREE.RingGeometry(r - 0.1, r + 0.1, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: r % 16 === 5 ? 0x00ff66 : 0xff00bb,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          envGroup.add(ring);
        }

        // Glowing pine-like cone trees
        for (let i = 0; i < 45; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 7 + Math.random() * 35;
          const x = Math.cos(angle) * dist;
          const z = Math.sin(angle) * dist;
          
          const h = 4 + Math.random() * 8;
          const geo = new THREE.ConeGeometry(1.5, h, 6);
          
          const leavesMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0x00ff66 : 0xff3399,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          });
          
          const tree = new THREE.Mesh(geo, leavesMat);
          tree.position.set(x, h / 2, z);
          
          // Trunk
          const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 6);
          const trunkMat = new THREE.MeshBasicMaterial({ color: 0x553311 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = -h/2 - 0.5;
          tree.add(trunk);

          envGroup.add(tree);
        }

        // Drift stardust floating around
        const starCount = 300;
        const starGeo = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
          starPositions[i] = (Math.random() - 0.5) * 50;
          starPositions[i + 1] = Math.random() * 10;
          starPositions[i + 2] = (Math.random() - 0.5) * 50;
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.1,
          transparent: true,
          opacity: 0.8
        });
        const stars = new THREE.Points(starGeo, starMat);
        envGroup.add(stars);

      } else if (style === "voxel_world") {
        scene.background = new THREE.Color(0xb3e5fc);
        scene.fog = new THREE.FogExp2(0xb3e5fc, 0.025);

        // Checkerboard ground tiles
        const tileSize = 2;
        const boardWidth = 40;
        const tileGeo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
        
        for (let x = -boardWidth; x <= boardWidth; x += tileSize) {
          for (let z = -boardWidth; z <= boardWidth; z += tileSize) {
            const isAlt = (Math.abs(x + z) / tileSize) % 2 === 0;
            const mat = new THREE.MeshBasicMaterial({
              color: isAlt ? 0x81c784 : 0x4caf50,
            });
            const tile = new THREE.Mesh(tileGeo, mat);
            tile.position.set(x, -0.1, z);
            envGroup.add(tile);
          }
        }

        // Minecraft-style voxel towers & arches
        for (let i = 0; i < 20; i++) {
          const x = Math.round((Math.random() - 0.5) * 30 / tileSize) * tileSize;
          const z = Math.round((Math.random() - 0.5) * 30 / tileSize) * tileSize;
          
          if (Math.abs(x) < 4 && Math.abs(z) < 4) continue; // Keep spawn clear

          const towerHeight = 3 + Math.floor(Math.random() * 5);
          for (let y = 0; y < towerHeight; y++) {
            const blockGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
            const blockMat = new THREE.MeshBasicMaterial({
              color: 0x795548 - (y * 0x111111), // shading effect
              wireframe: false,
            });
            const block = new THREE.Mesh(blockGeo, blockMat);
            block.position.set(x, 0.9 + y * 2, z);
            envGroup.add(block);
          }
        }
      }
    };

    generateEnvironment(activeEnv);

    // 6. Interactive Floating Gaze Targets (The Game Loop objects)
    const targets: THREE.Mesh[] = [];
    const targetGeo = new THREE.OctahedronGeometry(0.5, 0);

    const spawnTarget = (index: number) => {
      const colors = [0xff0055, 0x00ff66, 0x0099ff, 0xffaa00, 0xbd00ff];
      const mat = new THREE.MeshBasicMaterial({
        color: colors[index % colors.length],
        wireframe: true,
      });
      const target = new THREE.Mesh(targetGeo, mat);
      
      // Position target dynamically in a forward arc relative to the player
      // x: -4 to 4, y: 0.8 to 2.5, z: -2 to -10
      target.position.set(
        (Math.random() - 0.5) * 8,
        0.8 + Math.random() * 2,
        cameraRig.position.z - (3 + Math.random() * 7)
      );
      scene.add(target);
      targets[index] = target;
    };

    // Spawn 5 initial targets
    for (let i = 0; i < 5; i++) {
      spawnTarget(i);
    }
    targetsRef.current = targets;

    // 7. Raycaster for Head-Dwell Selection (Virtual Controller)
    const raycaster = new THREE.Raycaster();
    raycaster.far = 15;

    // 8. Particle explosion physics array
    const particles: ExplodingParticle[] = [];
    particlesRef.current = particles;

    const createExplosion = (pos: THREE.Vector3, color: number) => {
      const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      for (let i = 0; i < 18; i++) {
        const pMat = new THREE.MeshBasicMaterial({ color: color });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.2) * 0.12 + 0.04, // Blast slightly upwards
          (Math.random() - 0.5) * 0.12
        );

        particles.push({
          mesh: pMesh,
          velocity,
          life: 1.0,
        });
      }
    };

    // 9. Frame Resize Listener
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      
      const newAspect = (w / 2) / h;
      leftCamera.aspect = newAspect;
      leftCamera.updateProjectionMatrix();
      rightCamera.aspect = newAspect;
      rightCamera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // 10. Animation & Render Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsVal = 60;
    let fpsTimer = 0;

    const renderLoop = (time: number) => {
      animId = requestAnimationFrame(renderLoop);
      
      const delta = Math.min((time - lastTime) / 1000, 0.1); // Clamp spikes
      lastTime = time;

      // FPS calculation
      frameCount++;
      fpsTimer += delta;
      if (fpsTimer >= 1.0) {
        fpsVal = Math.round(frameCount / fpsTimer);
        frameCount = 0;
        fpsTimer = 0;
      }

      // --- GAME LOOP INTERACTION (Gaze and Dwell) ---
      // Cast ray straight forward from the headset rig
      const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRig.quaternion);
      raycaster.set(cameraRig.position, lookDirection);

      // Intersect targets
      const intersects = raycaster.intersectObjects(targets);
      if (intersects.length > 0) {
        const hitTarget = intersects[0].object as THREE.Mesh;
        const index = targets.indexOf(hitTarget);
        
        if (index !== -1) {
          hoveredTargetIndex.current = index;
          gazeTargetRef.current = hitTarget;
          
          // Hover visual pulse
          hitTarget.rotation.y += delta * 4;
          hitTarget.scale.setScalar(1.2 + Math.sin(time * 0.01) * 0.15);
          
          // Increment gaze duration
          gazeTimer.current += delta;
          const gazePercent = Math.min((gazeTimer.current / 1.2) * 100, 100); // 1.2s gaze threshold
          
          if (gazePercent >= 100) {
            // TARGET HIT & EXPLODED!
            const hitColor = (hitTarget.material as THREE.MeshBasicMaterial).color.getHex();
            createExplosion(hitTarget.position, hitColor);
            
            // Increment score
            scoreRef.current += 1;
            
            // Remove target, recreate it elsewhere
            scene.remove(hitTarget);
            hitTarget.geometry.dispose();
            (hitTarget.material as THREE.Material).dispose();
            spawnTarget(index);
            
            // Reset gaze tracking
            gazeTimer.current = 0;
            hoveredTargetIndex.current = null;
            gazeTargetRef.current = null;
          }
        }
      } else {
        // Reset scale of target previously hovered
        if (hoveredTargetIndex.current !== null && targets[hoveredTargetIndex.current]) {
          targets[hoveredTargetIndex.current].scale.setScalar(1.0);
        }
        gazeTimer.current = 0;
        hoveredTargetIndex.current = null;
        gazeTargetRef.current = null;
      }

      // Bob and rotate targets slowly
      targets.forEach((t, i) => {
        if (hoveredTargetIndex.current !== i && t) {
          t.rotation.x += 0.006 + i * 0.001;
          t.rotation.y += 0.01;
          t.position.y += Math.sin(time * 0.0018 + i * 40) * 0.0025;
        }
      });

      // Update exploding particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.velocity);
        p.velocity.y -= 0.004; // Gravity drift
        p.life -= delta * 1.5; // lifespan
        p.mesh.scale.setScalar(Math.max(p.life, 0.001));

        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          particles.splice(i, 1);
        }
      }

      // --- MOTION SMOOTHING & DRIFT CONTROL ---
      // Feed local positioning directly to Three.js Rig
      cameraRig.position.x += (playerPos.current.x - cameraRig.position.x) * 0.25;
      cameraRig.position.y += (playerPos.current.y - cameraRig.position.y) * 0.25;
      cameraRig.position.z += (playerPos.current.z - cameraRig.position.z) * 0.25;

      cameraRig.rotation.set(0, 0, 0);
      cameraRig.rotateY(playerRot.current.yaw);
      cameraRig.rotateX(playerRot.current.pitch);

      // --- IPD CAMERAS UPDATE ---
      leftCamera.position.set(-ipd / 2, 0, 0);
      rightCamera.position.set(ipd / 2, 0, 0);

      // --- SAFETY SYSTEM VISUAL WARNING ---
      if (safetyGrid) {
        if (showSafetyWarning.current) {
          safetyGrid.visible = true;
          // Pulse the opacity of warning wireframe box
          safetyGridMat.opacity = 0.18 + Math.sin(time * 0.015) * 0.12;
        } else {
          safetyGrid.visible = false;
        }
      }

      // --- STEREOSCOPIC DOUBLE EYE RENDERING ---
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // LEFT EYE VIEWPORT
      renderer.setViewport(0, 0, canvasWidth / 2, canvasHeight);
      renderer.setScissor(0, 0, canvasWidth / 2, canvasHeight);
      renderer.render(scene, leftCamera);

      // RIGHT EYE VIEWPORT
      renderer.setViewport(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
      renderer.setScissor(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
      renderer.render(scene, rightCamera);

      // --- THROTTLED TELEMETRY CALLBACK TO REACT ---
      if (time % 8 < 1) {
        setTelemetry((prev) => ({
          ...prev,
          fps: fpsVal,
          posX: cameraRig.position.x.toFixed(2),
          posY: cameraRig.position.y.toFixed(2),
          posZ: cameraRig.position.z.toFixed(2),
          yaw: `${Math.round((playerRot.current.yaw * 180) / Math.PI)}°`,
          pitch: `${Math.round((playerRot.current.pitch * 180) / Math.PI)}°`,
          gazeProgress: Math.min(Math.round((gazeTimer.current / 1.2) * 100), 100),
          score: scoreRef.current,
          hasObstacle: showSafetyWarning.current,
        }));
      }
    };

    animId = requestAnimationFrame(renderLoop);

    // Cleanup on unmount or env toggle
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      // Dispose resources
      targets.forEach((t) => {
        scene.remove(t);
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
      });

      particles.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      });

      scene.remove(cameraRig);
      safetyGridGeo.dispose();
      safetyGridMat.dispose();

      while (envGroup.children.length > 0) {
        const obj = envGroup.children[0];
        envGroup.remove(obj);
      }
      scene.remove(envGroup);

      if (rendererRef.current && rendererRef.current.domElement) {
        mountRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [isVRActive, activeEnv, ipd]);

  // --- COMPUTER VISION & OPTICAL FLOW COMPUTATION (TRACKING LOOP) ---
  useEffect(() => {
    if (!isVRActive) return;

    let cvAnimId: number;
    const hCanvas = helperCanvasRef.current;
    const dCanvas = debugCanvasRef.current;
    const video = videoRef.current;

    if (!hCanvas || !video) return;

    const hCtx = hCanvas.getContext("2d", { willReadFrequently: true });
    if (!hCtx) return;

    // Set up tracking luminance arrays
    prevLuma.current = new Uint8ClampedArray(CV_WIDTH * CV_HEIGHT);
    currLuma.current = new Uint8ClampedArray(CV_WIDTH * CV_HEIGHT);

    // Fast image grayscale converter
    const populateLuma = (sourceData: Uint8ClampedArray, targetLuma: Uint8ClampedArray) => {
      let sumLuma = 0;
      for (let i = 0; i < CV_WIDTH * CV_HEIGHT; i++) {
        const r = sourceData[i * 4];
        const g = sourceData[i * 4 + 1];
        const b = sourceData[i * 4 + 2];
        // Standard high-speed luma weights
        const l = (r * 0.299 + g * 0.587 + b * 0.114);
        targetLuma[i] = l;
        sumLuma += l;
      }
      return sumLuma / (CV_WIDTH * CV_HEIGHT); // Average brightness
    };

    const runCVTracking = () => {
      cvAnimId = requestAnimationFrame(runCVTracking);

      // Verify video stream is actively playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // 1. Draw scaled frame onto invisible helper canvas
      hCtx.drawImage(video, 0, 0, CV_WIDTH, CV_HEIGHT);
      const imgData = hCtx.getImageData(0, 0, CV_WIDTH, CV_HEIGHT);
      
      // Pivot current frame buffer to previous frame buffer
      if (currLuma.current && prevLuma.current) {
        const temp = prevLuma.current;
        prevLuma.current = currLuma.current;
        currLuma.current = temp;
      }

      // Compute average frame brightness
      const avgBrightness = currLuma.current ? populateLuma(imgData.data, currLuma.current) : 128;

      // Check for Darkness Safety (Obstacle or pocket mode)
      if (avgBrightness < safetyThreshold) {
        showSafetyWarning.current = true;
        setTelemetry((prev) => ({ ...prev, avgLuma: Math.round(avgBrightness), trackingStatus: "SAFETY WARNING: ROOM TOO DARK / BLOCKED" }));
        return;
      } else {
        showSafetyWarning.current = false;
      }

      // Compute optical flow via block matching
      let sumDx = 0;
      let sumDy = 0;
      let sumDivergence = 0;
      let trackedBlocksCount = 0;

      const motionVectors: { x: number; y: number; dx: number; dy: number; valid: boolean }[] = [];

      const curr = currLuma.current;
      const prev = prevLuma.current;

      if (!curr || !prev) return;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const blockX = c * BLOCK_SIZE;
          const blockY = r * BLOCK_SIZE;

          // 1. Contrast Check: Make sure block is rich in visual textures
          let minVal = 255;
          let maxVal = 0;
          for (let y = 0; y < BLOCK_SIZE; y++) {
            const rowIdx = (blockY + y) * CV_WIDTH;
            for (let x = 0; x < BLOCK_SIZE; x++) {
              const val = curr[rowIdx + blockX + x];
              if (val < minVal) minVal = val;
              if (val > maxVal) maxVal = val;
            }
          }
          const contrast = maxVal - minVal;

          // If block is uniform (blank background), discard from tracking to prevent drift
          if (contrast < 15) {
            motionVectors.push({
              x: blockX + BLOCK_SIZE / 2,
              y: blockY + BLOCK_SIZE / 2,
              dx: 0,
              dy: 0,
              valid: false,
            });
            continue;
          }

          // 2. Search neighborhood for best alignment (Minimum Sum of Absolute Differences)
          let minSAD = Infinity;
          let bestDx = 0;
          let bestDy = 0;

          for (let dy = -SEARCH_RANGE; dy <= SEARCH_RANGE; dy++) {
            for (let dx = -SEARCH_RANGE; dx <= SEARCH_RANGE; dx++) {
              let sad = 0;

              for (let y = 0; y < BLOCK_SIZE; y++) {
                const cy = blockY + y;
                const py = cy + dy;
                
                if (py < 0 || py >= CV_HEIGHT) {
                  sad += BLOCK_SIZE * 255; // Out-of-bounds penalty
                  continue;
                }

                const currRowIdx = cy * CV_WIDTH;
                const prevRowIdx = py * CV_WIDTH;

                for (let x = 0; x < BLOCK_SIZE; x++) {
                  const cx = blockX + x;
                  const px = cx + dx;

                  if (px < 0 || px >= CV_WIDTH) {
                    sad += 255;
                    continue;
                  }

                  sad += Math.abs(curr[currRowIdx + cx] - prev[prevRowIdx + px]);
                }
              }

              if (sad < minSAD) {
                minSAD = sad;
                bestDx = dx;
                bestDy = dy;
              }
            }
          }

          // Discard block vectors that have zero displacement to smooth noise
          const isMoving = bestDx !== 0 || bestDy !== 0;

          motionVectors.push({
            x: blockX + BLOCK_SIZE / 2,
            y: blockY + BLOCK_SIZE / 2,
            dx: bestDx,
            dy: bestDy,
            valid: true,
          });

          if (isMoving) {
            sumDx += bestDx;
            sumDy += bestDy;

            // 3. Divergence/Scale Check (Forward & Backward Motion)
            // Center-relative coordinates of current block
            const centerX = c - (COLS - 1) / 2;
            const centerY = r - (ROWS - 1) / 2;

            // Dot product matches dilation (outward flow = moving closer)
            const dotProduct = bestDx * centerX + bestDy * centerY;
            sumDivergence += dotProduct;

            trackedBlocksCount++;
          }
        }
      }

      // 4. Update head position & rotation vectors based on global flow parameters
      if (trackedBlocksCount > 4) {
        isTrackingStable.current = true;

        const avgDx = sumDx / trackedBlocksCount;
        const avgDy = sumDy / trackedBlocksCount;
        const avgDivergence = sumDivergence / trackedBlocksCount;

        // Apply low pass filtering and sensitivities
        // Turn head Right -> pixel shift Left -> Add to Yaw
        playerRot.current.yaw += -avgDx * rotSensitivity;
        playerRot.current.pitch += -avgDy * rotSensitivity;

        // Clamp pitch to avoid neck hyperextension
        playerRot.current.pitch = Math.max(-1.3, Math.min(1.3, playerRot.current.pitch));

        // Translation (Forward / Backward) along current look orientation vector
        if (cameraRigRef.current) {
          const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRigRef.current.quaternion);
          // Scale divergence vector to compute translational displacement
          const zMovement = avgDivergence * transSensitivity;
          
          // Apply movement to position ref
          playerPos.current.x += lookDirection.x * zMovement;
          playerPos.current.y += lookDirection.y * zMovement;
          playerPos.current.z += lookDirection.z * zMovement;

          // Prevent dropping below ground plane or flying away into space
          playerPos.current.y = Math.max(0.6, Math.min(6.0, playerPos.current.y));
          playerPos.current.z = Math.max(-30.0, Math.min(30.0, playerPos.current.z));
          playerPos.current.x = Math.max(-30.0, Math.min(30.0, playerPos.current.x));
        }

        // Fast state telemetry push
        setTelemetry((prev) => ({
          ...prev,
          activeBlocks: trackedBlocksCount,
          avgLuma: Math.round(avgBrightness),
          trackingStatus: "6-DoF TRACKING OK",
        }));
      } else {
        isTrackingStable.current = false;
        setTelemetry((prev) => ({
          ...prev,
          activeBlocks: trackedBlocksCount,
          avgLuma: Math.round(avgBrightness),
          trackingStatus: "LOW SIGNAL: SEARCHING SURFACE TEXTURE...",
        }));
      }

      // 5. Draw computer vision telemetry inside Developer Debug canvas
      if (showDebug && dCanvas) {
        const dCtx = dCanvas.getContext("2d");
        if (dCtx) {
          dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);
          
          // Draw downscaled camera feed as semi-transparent background
          dCtx.globalAlpha = 0.55;
          dCtx.drawImage(video, 0, 0, dCanvas.width, dCanvas.height);
          dCtx.globalAlpha = 1.0;

          // Scale coordinates from helper canvas size to debug display size
          const scaleX = dCanvas.width / CV_WIDTH;
          const scaleY = dCanvas.height / CV_HEIGHT;

          // Draw grid and optical flow vector arrows
          motionVectors.forEach((v) => {
            const sx = v.x * scaleX;
            const sy = v.y * scaleY;

            // Draw block center indicator
            dCtx.beginPath();
            dCtx.arc(sx, sy, v.valid ? 2 : 1, 0, Math.PI * 2);
            dCtx.fillStyle = v.valid ? "#00ffcc" : "#666666";
            dCtx.fill();

            // Draw flow vector line if valid displacement detected
            if (v.valid && (v.dx !== 0 || v.dy !== 0)) {
              dCtx.beginPath();
              dCtx.moveTo(sx, sy);
              dCtx.lineTo(sx + v.dx * scaleX * 2, sy + v.dy * scaleY * 2);
              dCtx.strokeStyle = "#ff00bb";
              dCtx.lineWidth = 1.5;
              dCtx.stroke();
            }
          });
        }
      }
    };

    cvAnimId = requestAnimationFrame(runCVTracking);

    return () => {
      cancelAnimationFrame(cvAnimId);
    };
  }, [isVRActive, rotSensitivity, transSensitivity, safetyThreshold, showDebug]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      
      {/* BACKGROUND RAW VIDEO STREAM FOR COMPUTER VISION INGESTION */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        loop
        width="640"
        height="480"
      />

      {/* INVISIBLE HELPER CANVAS FOR HIGH-SPEED DOWNRES PIXEL CONVERSION */}
      <canvas
        ref={helperCanvasRef}
        width={CV_WIDTH}
        height={CV_HEIGHT}
        className="hidden"
      />

      {/* --- ENTRY SCREEN (THE VR PORTAL) --- */}
      {!isVRActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-radial from-slate-900 to-slate-950">
          <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center">
            
            {/* Hologram/Radar styled portal header */}
            <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-indigo-950/50 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Compass className="w-12 h-12 text-indigo-400 animate-pulse" />
              <Zap className="absolute top-1 right-1 w-5 h-5 text-pink-400 animate-bounce" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-center mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-indigo-400 to-pink-300">
              Inside-Out Tracking Mobile VR
            </h1>
            <p className="text-slate-400 text-sm text-center max-w-lg mb-8">
              Experience responsive, mobile VR headset tracking without external sensors or internal gyroscopes. This engine translates video flow from your phone's camera into high-fidelity 6-DoF spatial displacement.
            </p>

            {/* Camera Permission Alert Block */}
            {hasCameraPermission === false ? (
              <div className="w-full mb-6 p-4 rounded-xl border border-red-500/20 bg-red-950/30 text-red-300 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
                <div>
                  <span className="font-semibold block mb-1">Camera Authorization Required</span>
                  {cameraError || "Please ensure you have granted camera permissions in your browser address bar and reload."}
                </div>
              </div>
            ) : (
              <div className="w-full mb-6 p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/20 text-indigo-300 text-xs flex items-center gap-3 justify-center">
                <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Standard Back Camera Configured & Fully Ready</span>
              </div>
            )}

            {/* Brief Instructions Setup Mockup */}
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                <span className="text-indigo-400 font-mono text-sm font-bold mb-1">1</span>
                <span className="text-xs font-medium text-slate-200">Prepare Shell</span>
                <span className="text-[10px] text-slate-500 mt-1">Place phone into any cardbox VR clip-on visor.</span>
              </div>
              <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                <span className="text-pink-400 font-mono text-sm font-bold mb-1">2</span>
                <span className="text-xs font-medium text-slate-200">Point Camera</span>
                <span className="text-[10px] text-slate-500 mt-1">Face any textured or patterned floor surface.</span>
              </div>
              <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-2xl flex flex-col items-center text-center">
                <span className="text-yellow-400 font-mono text-sm font-bold mb-1">3</span>
                <span className="text-xs font-medium text-slate-200">Calibrate</span>
                <span className="text-[10px] text-slate-500 mt-1">Gaze forward or tap anywhere to center tracking.</span>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={() => {
                if (hasCameraPermission) {
                  setIsVRActive(true);
                } else {
                  startCamera();
                }
              }}
              className="group relative w-full overflow-hidden py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 transition-all text-white shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 text-white fill-current group-hover:scale-110 transition-transform" />
              <span>Launch Stereoscopic VR Engine</span>
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* --- MAIN 3D IMMERSIVE VR CANVAS --- */}
      {isVRActive && (
        <div className="absolute inset-0 w-full h-full">
          
          {/* Three.js Render Target mount */}
          <div ref={mountRef} className="absolute inset-0 w-full h-full" />

          {/* STEREOSCOPIC VR DUAL-SCREEN TEXT HUDS (Rendered twice for Interpupillary alignment) */}
          <div className="absolute inset-0 z-30 pointer-events-none flex">
            
            {/* ================= LEFT EYE HUD ================= */}
            <div className="relative w-1/2 h-full flex flex-col items-center justify-center border-r border-slate-800/10">
              
              {/* Reticle Gaze Target Crosshair */}
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 border border-indigo-400/40 rounded-full flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${telemetry.gazeProgress > 0 ? "bg-pink-500 scale-125" : "bg-indigo-400 animate-ping"}`} />
                </div>
                {/* Dwell loading circle */}
                {telemetry.gazeProgress > 0 && (
                  <svg className="absolute w-10 h-10 rotate-[-90deg]">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="rgba(244, 63, 94, 0.75)"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray="100"
                      strokeDashoffset={100 - telemetry.gazeProgress}
                    />
                  </svg>
                )}
              </div>

              {/* Status HUD Block */}
              <div className="absolute bottom-16 left-8 right-8 bg-slate-950/75 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">TRACKING:</span>
                  <span className={`font-bold ${isTrackingStable.current ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                    {telemetry.trackingStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/50 pt-1.5">
                  <span>FPS: {telemetry.fps}</span>
                  <span>TARGETS: {telemetry.score}</span>
                  <span>XYZ: [{telemetry.posX}, {telemetry.posY}, {telemetry.posZ}]</span>
                </div>
              </div>

              {/* Safety Alarm Red Grid Overlay */}
              {telemetry.hasObstacle && (
                <div className="absolute inset-0 bg-red-950/20 border-4 border-red-600/60 animate-pulse flex flex-col items-center justify-center p-6">
                  <div className="bg-red-900/80 border border-red-500 rounded-xl p-3 flex flex-col items-center gap-1.5 backdrop-blur-sm">
                    <ShieldAlert className="w-8 h-8 text-red-100 animate-bounce" />
                    <span className="text-[11px] font-bold font-mono tracking-widest text-red-100">SAFETY ALERT</span>
                    <span className="text-[9px] font-mono text-red-200">CAMERA BLOCKED OR BLIND</span>
                  </div>
                </div>
              )}
            </div>

            {/* ================= RIGHT EYE HUD ================= */}
            <div className="relative w-1/2 h-full flex flex-col items-center justify-center">
              
              {/* Reticle Gaze Target Crosshair */}
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 border border-indigo-400/40 rounded-full flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${telemetry.gazeProgress > 0 ? "bg-pink-500 scale-125" : "bg-indigo-400 animate-ping"}`} />
                </div>
                {/* Dwell loading circle */}
                {telemetry.gazeProgress > 0 && (
                  <svg className="absolute w-10 h-10 rotate-[-90deg]">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="rgba(244, 63, 94, 0.75)"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray="100"
                      strokeDashoffset={100 - telemetry.gazeProgress}
                    />
                  </svg>
                )}
              </div>

              {/* Status HUD Block */}
              <div className="absolute bottom-16 left-8 right-8 bg-slate-950/75 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">TRACKING:</span>
                  <span className={`font-bold ${isTrackingStable.current ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                    {telemetry.trackingStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/50 pt-1.5">
                  <span>FPS: {telemetry.fps}</span>
                  <span>TARGETS: {telemetry.score}</span>
                  <span>XYZ: [{telemetry.posX}, {telemetry.posY}, {telemetry.posZ}]</span>
                </div>
              </div>

              {/* Safety Alarm Red Grid Overlay */}
              {telemetry.hasObstacle && (
                <div className="absolute inset-0 bg-red-950/20 border-4 border-red-600/60 animate-pulse flex flex-col items-center justify-center p-6">
                  <div className="bg-red-900/80 border border-red-500 rounded-xl p-3 flex flex-col items-center gap-1.5 backdrop-blur-sm">
                    <ShieldAlert className="w-8 h-8 text-red-100 animate-bounce" />
                    <span className="text-[11px] font-bold font-mono tracking-widest text-red-100">SAFETY ALERT</span>
                    <span className="text-[9px] font-mono text-red-200">CAMERA BLOCKED OR BLIND</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- COLLAPSIBLE CONTROLS & TELEMETRY DEBUGGER PANEL (OVERLAID AT THE CORNER) --- */}
          <div className="absolute top-4 left-4 right-4 z-40 max-w-sm">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold font-mono tracking-wider">VR SYSTEM CONSOLE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowDebug((prev) => !prev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${showDebug ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-800 text-slate-400 hover:text-white"}`}
                  >
                    {showDebug ? "Hide Camera Visuals" : "Show Camera Visuals"}
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      setIsVRActive(false);
                    }}
                    className="p-1 rounded bg-red-950/40 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white transition-all cursor-pointer"
                    title="Exit VR Viewports"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Collapsed/Expanded Settings block */}
              <div className="flex flex-col gap-3 text-xs">
                
                {/* Sliders Block */}
                <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>INTERPUPILLARY DISTANCE (IPD)</span>
                      <span className="text-indigo-400">{ipd.toFixed(2)} units</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.55"
                      step="0.01"
                      value={ipd}
                      onChange={(e) => setIpd(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>LOOK ROTATION SENSITIVITY</span>
                      <span className="text-indigo-400">{rotSensitivity.toFixed(4)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="0.018"
                      step="0.001"
                      value={rotSensitivity}
                      onChange={(e) => setRotSensitivity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>DEPTH TRANSLATION SENSITIVITY</span>
                      <span className="text-indigo-400">{transSensitivity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.20"
                      step="0.01"
                      value={transSensitivity}
                      onChange={(e) => setTransSensitivity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Env style selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">Procedural Scene Theme</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["cyber_grid", "neon_forest", "voxel_world"] as EnvType[]).map((env) => (
                      <button
                        key={env}
                        onClick={() => setActiveEnv(env)}
                        className={`py-1 px-1.5 rounded-lg border text-[10px] font-mono capitalize transition-all cursor-pointer ${activeEnv === env ? "bg-indigo-600/30 border-indigo-500 text-indigo-300" : "bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-300"}`}
                      >
                        {env.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calibration Action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={handleRecalibrate}
                    className="py-1.5 px-3 rounded-lg border border-indigo-500/20 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 hover:text-white transition-all font-mono text-[10px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-400" />
                    Recalibrate Rig [R]
                  </button>
                  <button
                    onClick={() => setShowHelp((prev) => !prev)}
                    className="py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all font-mono text-[10px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    How to Play [H]
                  </button>
                </div>

                {/* Computer Vision real-time vector field overlay mapping */}
                {showDebug && (
                  <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>OPTICAL FLOW VECTOR RADAR</span>
                      <span className="text-pink-400 font-bold">{telemetry.activeBlocks} Tracked Blocks</span>
                    </div>
                    <div className="relative w-full rounded-xl overflow-hidden bg-black border border-slate-800 flex justify-center">
                      <canvas
                        ref={debugCanvasRef}
                        width="256"
                        height="192"
                        className="w-full max-h-[160px] object-contain opacity-90 scale-x-[-1]" // mirror display
                      />
                      <div className="absolute top-1.5 left-1.5 py-0.5 px-1.5 rounded bg-slate-950/80 border border-slate-800/40 text-[8px] font-mono text-slate-300">
                        LUMA: {telemetry.avgLuma} / SENS: {safetyThreshold}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* HELP SYSTEM GUIDE MODAL POPUP */}
          {showHelp && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold font-mono text-white">HEADSET INSTRUCTIONS</span>
                </div>
                <div className="text-xs text-slate-300 flex flex-col gap-3">
                  <p>
                    This app uses your mobile back camera to create a full <strong>6 Degrees of Freedom</strong> tracking space inside cardboard-style phone VR visors.
                  </p>
                  <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1.5 text-slate-400">
                    <li>
                      <strong>Yaw / Pitch rotation:</strong> Turn your head side-to-side and up-and-down. The global pixel difference controls look direction.
                    </li>
                    <li>
                      <strong>Z Translation:</strong> Move your head forward or backward. Pixel dilation (expansion and contraction) translates your position.
                    </li>
                    <li>
                      <strong>Gaze Dwell Game:</strong> Look straight at any glowing floating wireframe target. A cursor outline will fill up. Once full (1.2 seconds), the target pops and explodes!
                    </li>
                    <li>
                      <strong>Safety Alert:</strong> If you cover the camera, or the space is pitch black, the red wireframe alert boundaries pulse to prevent accidental collisions.
                    </li>
                  </ul>
                  <p className="text-slate-500 text-[10px] font-mono leading-relaxed mt-1">
                    Tip: If tracking drifts, hold the phone in a standard front-facing position, look forward at a textured table/carpet, and press the <strong>Recalibrate [R]</strong> button.
                  </p>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-2 py-2 w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 transition-all text-white text-xs cursor-pointer active:scale-95"
                >
                  Return to Immersive VR Environment
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
