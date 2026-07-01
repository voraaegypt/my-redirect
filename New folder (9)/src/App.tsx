import { useState, useEffect, useRef } from 'react';
import { SceneType, TrackingSettings, TrackingStats } from './types';
import { OpticalFlowTracker } from './utils/OpticalFlow';
import { Dashboard } from './components/Dashboard';
import { VRScene } from './components/VRScene';
import { Compass, RefreshCw, X } from 'lucide-react';

const INITIAL_SETTINGS: TrackingSettings = {
  enabled: true,
  ipd: 0.08,                     // Stereoscopic depth offset factor
  fov: 75,                       // Default view frustum horizontal FOV
  translationSensitivity: 1.2,    // Forward / backward speed
  rotationSensitivityX: 0.8,     // Yaw speed multiplier
  rotationSensitivityY: 0.5,     // Pitch speed multiplier
  smoothing: 0.85,               // Smooth interpolation factor (higher = more inertia)
  showDebug: false,              // Hide raw camera preview by default
  selectedScene: 'neon',         // Standard starting environment
  obstacleThreshold: 12.0,       // Global frame-difference indicating blocker
  darknessThreshold: 8.0,        // Grayscale baseline indicating covered camera
  invertYaw: false,
  invertPitch: false,
};

const INITIAL_STATS: TrackingStats = {
  fps: 0,
  translationDeltaZ: 0,
  translationDeltaX: 0,
  translationDeltaY: 0,
  yawDelta: 0,
  pitchDelta: 0,
  posX: 0,
  posY: 1.6,                     // Start at standard human eye level (1.6 meters)
  posZ: 0,
  rotYaw: 0,
  rotPitch: 0,
  obstacleWarning: false,
  isCalibrated: false,
  processingTimeMs: 0,
  activeVectors: [],
};

export default function App() {
  const [settings, setSettings] = useState<TrackingSettings>(INITIAL_SETTINGS);
  
  // High-frequency tracker stats are kept in a Ref for the Three.js rendering loop
  // to achieve zero-latency updates bypassing React virtual DOM diffing.
  const statsRef = useRef<TrackingStats>({ ...INITIAL_STATS });
  
  // Throttled stats state updated at ~15fps for the dashboard telemetry UI
  const [uiStats, setUiStats] = useState<TrackingStats>({ ...INITIAL_STATS });
  
  const [isVRMode, setIsVRMode] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<OpticalFlowTracker | null>(null);
  const trackingLoopIdRef = useRef<number | null>(null);
  const initialOrientationRef = useRef<{ alpha: number; beta: number } | null>(null);

  // Initialize camera stream safely
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        
        // Request standard rear camera facing mode
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 320 }, // 320x240 is perfect for low CPU / low resolution flow matching
            height: { ideal: 240 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (!active) {
          // Clean up if component was unmounted or effect re-ran while promise was resolving
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStream = stream;
        streamRef.current = stream;
        setVideoStream(stream);

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          
          // Wait for metadata to load to ensure a clean playback transition
          video.onloadedmetadata = async () => {
            try {
              if (active && videoRef.current) {
                await videoRef.current.play();
                setCameraActive(true);
              }
            } catch (playErr) {
              console.warn("Background video play failed/deferred:", playErr);
            }
          };
        }
      } catch (err: any) {
        if (active) {
          console.error("Error accessing camera:", err);
          setCameraError(err.message || "Failed to access rear camera");
          setCameraActive(false);
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      // Release camera resources on cleanup
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setVideoStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    };
  }, []);

  // Initialize Optical Flow Tracker
  useEffect(() => {
    // Hidden canvas size matches tracker resolution (64x48)
    // Downscaling provides built-in noise filtering and lightning fast calculations
    trackerRef.current = new OpticalFlowTracker(64, 48);
  }, []);

  // Run computer vision tracking frame loop
  useEffect(() => {
    if (!cameraActive) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let uiUpdateTimer = 0;

    const runTracking = () => {
      const video = videoRef.current;
      const canvas = debugCanvasRef.current;
      const tracker = trackerRef.current;

      if (video && canvas && tracker && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Process current frame
          const newStats = tracker.processFrame(ctx, video, statsRef.current, {
            translationSensitivity: settings.translationSensitivity,
            rotationSensitivityX: settings.rotationSensitivityX,
            rotationSensitivityY: settings.rotationSensitivityY,
            smoothing: settings.smoothing,
            obstacleThreshold: settings.obstacleThreshold,
            darknessThreshold: settings.darknessThreshold,
            invertYaw: settings.invertYaw,
            invertPitch: settings.invertPitch
          });

          // Write back directly to our high-frequency mutable Ref (for Three.js VR Scene)
          statsRef.current = newStats;

          // Throttled UI state updates (~15fps) to prevent main thread choke
          const now = performance.now();
          frameCount++;
          if (now - uiUpdateTimer > 66) { // ~15 HZ
            setUiStats({ ...newStats });
            uiUpdateTimer = now;
          }
        }
      }

      trackingLoopIdRef.current = requestAnimationFrame(runTracking);
    };

    runTracking();

    return () => {
      if (trackingLoopIdRef.current) {
        cancelAnimationFrame(trackingLoopIdRef.current);
      }
    };
  }, [cameraActive, settings]);

  // Calibration Function (Resets the origin position and yaw angle offset)
  const handleCalibrate = () => {
    initialOrientationRef.current = null; // Clear gyroscope offset to recalibrate relative center
    statsRef.current = {
      ...statsRef.current,
      posX: 0,
      posY: 1.6, // eyes level
      posZ: 0,
      rotYaw: 0,
      rotPitch: 0,
      isCalibrated: true
    };
    setUiStats({ ...statsRef.current });
  };

  // Listen for device orientation to allow smooth head tracking/looking around (gyroscope)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!isVRMode) return;

      const alpha = event.alpha; // [0, 360]
      const beta = event.beta;   // [-180, 180]
      const gamma = event.gamma; // [-90, 90]

      if (alpha === null || beta === null || gamma === null) return;

      // When the user first enters or recalibrates, save the current angles as the physical reference center
      if (!initialOrientationRef.current) {
        initialOrientationRef.current = { alpha, beta };
        return;
      }

      // Compute relative Yaw (left/right rotation) and Pitch (up/down rotation) from the baseline center
      let deltaAlpha = alpha - initialOrientationRef.current.alpha;
      // Normalize alpha change to the [-180, 180] window to avoid wrap-around jumps
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;

      let deltaBeta = beta - initialOrientationRef.current.beta;
      if (deltaBeta > 180) deltaBeta -= 360;
      if (deltaBeta < -180) deltaBeta += 360;

      // Convert angles from degrees to radians, applying sensitivity factors
      const toRad = Math.PI / 180;
      let yaw = deltaAlpha * toRad * settings.rotationSensitivityX;
      let pitch = deltaBeta * toRad * settings.rotationSensitivityY;

      // Invert if configured in user settings
      if (settings.invertYaw) yaw = -yaw;
      if (settings.invertPitch) pitch = -pitch;

      // Write orientation angles straight to our high-frequency mutable Ref
      statsRef.current.rotYaw = yaw;
      statsRef.current.rotPitch = pitch;
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isVRMode, settings.rotationSensitivityX, settings.rotationSensitivityY, settings.invertYaw, settings.invertPitch]);

  // Keyboard translation controls fallback for desktops (WASD + Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const stats = statsRef.current;
      const speed = 0.35;
      const turnSpeed = 0.04;

      let dx = 0;
      let dz = 0;
      let dyaw = 0;
      let dpitch = 0;

      switch (e.key.toLowerCase()) {
        case 'w': // Move Forward along look vector
          dz = speed;
          break;
        case 's': // Move Backward
          dz = -speed;
          break;
        case 'a': // Rotate Left (Yaw)
          dyaw = turnSpeed;
          break;
        case 'd': // Rotate Right
          dyaw = -turnSpeed;
          break;
        case 'arrowup': // Pitch Up
          dpitch = turnSpeed;
          break;
        case 'arrowdown': // Pitch Down
          dpitch = -turnSpeed;
          break;
        case 'r': // Quick reset
          handleCalibrate();
          return;
      }

      if (dx !== 0 || dz !== 0 || dyaw !== 0 || dpitch !== 0) {
        const yaw = stats.rotYaw + dyaw;
        const pitch = Math.max(-1.4, Math.min(1.4, stats.rotPitch + dpitch));
        
        // Translate relative to yaw angle
        const lookX = Math.sin(yaw);
        const lookZ = -Math.cos(yaw);

        statsRef.current = {
          ...stats,
          posX: stats.posX + lookX * dz,
          posZ: stats.posZ + lookZ * dz,
          rotYaw: yaw,
          rotPitch: pitch,
        };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Request Device Orientation Gyro permission for iOS 13+ devices
  const requestGyroPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          console.log("Device orientation permission granted!");
        }
      } catch (err) {
        console.warn("Device orientation permission rejected or failed:", err);
      }
    }
  };

  // Enter full-screen stereoscopic VR layout
  const handleEnterVR = () => {
    // Fire gyro permission request immediately upon user interaction
    requestGyroPermission();

    setIsVRMode(true);
    handleCalibrate(); // Auto calibrate on entrance

    // Attempt to request full screen browser window
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request rejected:", err);
      });
    }
  };

  // Exit VR mode
  const handleExitVR = () => {
    setIsVRMode(false);
    
    // Release full screen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen failed:", err);
      });
    }
  };

  // Listen for double taps on screen to exit VR mode
  useEffect(() => {
    let lastTap = 0;
    const handleTouchStart = () => {
      if (!isVRMode) return;
      const now = performance.now();
      if (now - lastTap < 300) {
        handleExitVR();
      }
      lastTap = now;
    };

    window.addEventListener('touchstart', handleTouchStart);
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, [isVRMode]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      
      {/* Hidden layout: Holds the stream element */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
        <video 
          ref={videoRef} 
          playsInline 
          muted 
          className="w-1 h-1" 
        />
        <canvas 
          ref={debugCanvasRef} 
          width={64} 
          height={48} 
          className="w-1 h-1" 
        />
      </div>

      {!isVRMode ? (
        // Standard Setup Dashboard Mode
        <Dashboard
          stats={uiStats}
          settings={settings}
          setSettings={setSettings}
          onCalibrate={handleCalibrate}
          onEnterVR={handleEnterVR}
          videoStream={videoStream}
          debugCanvasRef={debugCanvasRef}
          cameraActive={cameraActive}
          cameraError={cameraError}
        />
      ) : (
        // Stereoscopic Split-Screen VR mode
        <div className="w-full h-full relative">
          
          {/* Active 3D Render View */}
          <VRScene 
            stats={statsRef.current} 
            settings={settings} 
          />

          {/* Dynamic Interactive Overlays inside VR (Transparent overlay) */}
          <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-4 px-4 pointer-events-auto">
            
            {/* Exit Button */}
            <button
              onClick={handleExitVR}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-xs bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition tracking-widest uppercase font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-red-500" />
              EXIT VR
            </button>

            {/* In-VR Calibration Button */}
            <button
              onClick={handleCalibrate}
              className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-xs bg-zinc-900/90 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 active:scale-95 transition tracking-widest uppercase font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              RE-ALIGN ORIGIN
            </button>
          </div>

          {/* Quick calibration status alert overlay inside split eyes */}
          {!uiStats.isCalibrated && (
            <div className="absolute top-12 left-0 right-0 pointer-events-none grid grid-cols-2 gap-0 z-30">
              <div className="flex items-center justify-center text-center">
                <div className="bg-zinc-950/95 border border-amber-500/40 text-amber-400 font-mono text-[9px] px-3 py-1.5 rounded uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  TAP RE-ALIGN ORIGIN TO START
                </div>
              </div>
              <div className="flex items-center justify-center text-center">
                <div className="bg-zinc-950/95 border border-amber-500/40 text-amber-400 font-mono text-[9px] px-3 py-1.5 rounded uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                  TAP RE-ALIGN ORIGIN TO START
                </div>
              </div>
            </div>
          )}

          {/* Micro Telemetry Head-Up Displays in each viewport */}
          <div className="absolute top-4 left-0 right-0 pointer-events-none grid grid-cols-2 gap-0 z-20">
            {/* Left Eye HUD */}
            <div className="pl-6 pt-2 flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)] animate-pulse" />
                <span>HUD_L // FLOW_{uiStats.fps}_HZ</span>
              </div>
              <div className="bg-black/60 border border-zinc-900/60 px-2 py-0.5 rounded text-[7px] font-mono text-zinc-500">
                XYZ: [{statsRef.current.posX.toFixed(1)}, {statsRef.current.posY.toFixed(1)}, {statsRef.current.posZ.toFixed(1)}]
              </div>
            </div>

            {/* Right Eye HUD */}
            <div className="pl-6 pt-2 flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded text-[8px] font-mono text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)] animate-pulse" />
                <span>HUD_R // FLOW_{uiStats.fps}_HZ</span>
              </div>
              <div className="bg-black/60 border border-zinc-900/60 px-2 py-0.5 rounded text-[7px] font-mono text-zinc-500">
                XYZ: [{statsRef.current.posX.toFixed(1)}, {statsRef.current.posY.toFixed(1)}, {statsRef.current.posZ.toFixed(1)}]
              </div>
            </div>
          </div>

          {/* Quick Double-tap hint helper floating in mid screen */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none grid grid-cols-2 text-center z-10 opacity-20 select-none">
            <div className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase font-bold">DBL TOUCH SCREEN TO EXIT</div>
            <div className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase font-bold">DBL TOUCH SCREEN TO EXIT</div>
          </div>

        </div>
      )}

    </div>
  );
}
