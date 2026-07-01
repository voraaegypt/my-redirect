import React, { useRef, useEffect } from 'react';
import { 
  SceneType, 
  TrackingSettings, 
  TrackingStats 
} from '../types';
import { 
  Camera, 
  Maximize2, 
  RefreshCw, 
  Sliders, 
  Eye, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  Shield,
  Compass
} from 'lucide-react';

interface DashboardProps {
  stats: TrackingStats;
  settings: TrackingSettings;
  setSettings: React.Dispatch<React.SetStateAction<TrackingSettings>>;
  onCalibrate: () => void;
  onEnterVR: () => void;
  videoStream: MediaStream | null;
  debugCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  settings,
  setSettings,
  onCalibrate,
  onEnterVR,
  videoStream,
  debugCanvasRef,
  cameraActive,
  cameraError
}) => {
  const flowCanvasRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Bind the video stream to the local preview video element
  useEffect(() => {
    if (localVideoRef.current && videoStream) {
      localVideoRef.current.srcObject = videoStream;
      localVideoRef.current.play().catch(e => {
        console.warn("Dashboard preview play deferred/failed:", e);
      });
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [videoStream]);

  // Draw motion vectors onto the developer debug canvas in real-time
  useEffect(() => {
    const canvas = flowCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and match dimension of downscaled tracking resolution (64x48)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If camera is inactive, draw a idle grid pattern
    if (!cameraActive) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      const step = 8;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      return;
    }

    // Draw a subtle dark background
    ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render active motion vector arrows
    ctx.lineWidth = 1.2;
    stats.activeVectors.forEach((vec) => {
      // Calculate color based on magnitude of displacement
      const mag = Math.sqrt(vec.vx * vec.vx + vec.vy * vec.vy);
      if (mag < 0.2) return; // skip static-like noise

      ctx.strokeStyle = mag > 2 ? '#ec4899' : '#10b981';
      ctx.beginPath();
      ctx.moveTo(vec.x, vec.y);
      ctx.lineTo(vec.x + vec.vx * 2.5, vec.y + vec.vy * 2.5);
      ctx.stroke();

      // Small pixel dot at source
      ctx.fillStyle = '#10b981';
      ctx.fillRect(vec.x - 0.5, vec.y - 0.5, 1, 1);
    });

    // Draw tracking center cross
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 4);
    ctx.lineTo(canvas.width / 2, canvas.height - 4);
    ctx.moveTo(4, canvas.height / 2);
    ctx.lineTo(canvas.width - 4, canvas.height / 2);
    ctx.stroke();

  }, [stats.activeVectors, cameraActive]);

  // Adjust specific tracker settings
  const handleSettingChange = (key: keyof TrackingSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const sceneOptions: { id: SceneType; name: string; desc: string; color: string }[] = [
    { id: 'voxels', name: 'VOXEL GRID', desc: 'A modular blocky voxel world inspired by retro build block sandbox games.', color: 'from-emerald-500 to-teal-600' },
    { id: 'pillars', name: 'COLOR PILLARS', desc: 'Towering cylindrical scale beacons with high spatial contrast indicators.', color: 'from-amber-500 to-orange-600' },
    { id: 'neon', name: 'NEON CYBERPUNK', desc: 'Glowing vector rings and floating dark obelisks with active emissives.', color: 'from-pink-500 to-fuchsia-600' },
    { id: 'grid', name: 'TECH PLAYGROUND', desc: 'A minimalist grid featuring floating, self-orbiting wireframe geometries.', color: 'from-blue-500 to-indigo-600' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-mono select-none">
      
      {/* Header Bar */}
      <header className="border-b border-zinc-800 bg-black/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          {cameraActive ? (
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
          )}
          <div>
            <span className="text-xs tracking-widest uppercase font-bold text-emerald-400">
              6-DOF TRACKING: {cameraActive ? 'ACTIVE' : 'CALIBRATING'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex space-x-6 text-[10px] tracking-tighter text-zinc-500 uppercase">
          <span>Cam: Rear_01 [30fps]</span>
          <span>Latency: {stats.processingTimeMs}ms</span>
          <span>IPD: {settings.ipd.toFixed(3)}u</span>
          <span>Pitch: {((stats.rotPitch * 180) / Math.PI).toFixed(1)}°</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2 py-1 bg-zinc-900 rounded text-[9px] text-zinc-400 font-bold border border-zinc-800">REC</div>
          <div className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-[9px] border border-emerald-500/30 font-bold uppercase tracking-widest">
            WEB-XR V1.0.4
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: HERO CARD + CALIBRATION + 3D SCENE SELECTOR (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tech Explanation Card */}
          <div className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-zinc-800 p-5 md:p-6">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-5 justify-between">
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Inside-Out Vision Solver</span>
                <h2 className="text-lg font-bold tracking-tight text-white uppercase">6-DoF Phone VR Adapter</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  By tracking the expansion (forward/backward divergence) and global shift (rotation yaw/pitch) of low-resolution pixel grids from your phone's back camera, this app generates artificial stereoscopic depth without external base stations or complex hardware.
                </p>
              </div>
              
              <button
                onClick={onEnterVR}
                disabled={!cameraActive}
                className="self-start md:self-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-widest transition duration-200 disabled:opacity-50 disabled:pointer-events-none shrink-0 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                ENTER VR MODE
              </button>
            </div>

            {cameraError && (
              <div className="mt-4 p-3 rounded bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Camera Permission Required:</strong> {cameraError}. Please enable camera access in your browser preferences to start tracking.
                </span>
              </div>
            )}
          </div>

          {/* Procedural Scene Cards selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold tracking-wider text-zinc-300">SELECT VIRTUAL SCENE</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sceneOptions.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => handleSettingChange('selectedScene', scene.id)}
                  className={`relative p-4 rounded-xl border text-left cursor-pointer transition duration-300 group ${
                    settings.selectedScene === scene.id
                      ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/5'
                      : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition">{scene.name}</h4>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{scene.desc}</p>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                      settings.selectedScene === scene.id ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-700'
                    }`}>
                      {settings.selectedScene === scene.id && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full bg-gradient-to-r ${scene.color} opacity-0 group-hover:opacity-100 transition duration-300`} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick calibration Panel */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center text-emerald-400 border border-zinc-850">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">SENSOR ORIGIN STABILIZATION</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">Place phone flat or mount on headset adapter before calibrating origin.</p>
              </div>
            </div>

            <button
              onClick={onCalibrate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              RECENTER VIEW
            </button>
          </div>

          {/* Educational Instructions */}
          <div className="p-5 rounded-xl bg-zinc-900/10 border border-zinc-800/60">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Setup Configuration guide:</h4>
                <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc pl-4 pt-1 font-sans">
                  <li>Mount this phone on any basic cardboard/plastic VR headset adapter (e.g., Google Cardboard).</li>
                  <li>Ensure the smartphone's standard back-facing camera is <strong>completely unobstructed</strong> by the headset's casing.</li>
                  <li>Stand in a well-lit room with textured walls (like posters, brickwork, bookshelves) so the optical flow tracker has sharp features to lock onto.</li>
                  <li><strong>VR Exit Hotkey:</strong> Tapping anywhere on the stereoscopic split-screen or double tapping will instantly exit back to this configuration panel.</li>
                </ul>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: REAL-TIME TELEMETRY + DETAILED SENSORS (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* CAMERA FEED & FLOW ANALYSIS GRAPH */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800 bg-black/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300">VISION PROCESSOR</span>
              </div>
              {cameraActive && (
                <span className="text-[9px] text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40 font-bold">
                  {stats.fps} HZ
                </span>
              )}
            </div>

            {/* Video preview & downscaled debug element container */}
            <div className="p-4 flex flex-col gap-3">
              {/* Actual Video (Small preview) */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-900">
                <video
                  ref={localVideoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                  style={{ display: settings.showDebug ? 'block' : 'none' }}
                />
                
                {!settings.showDebug && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                    <Eye className="w-5 h-5 text-zinc-750" />
                    <span className="text-[10px] text-zinc-500 mt-2 font-sans">Stream preview hidden (Optimized mode)</span>
                    <button 
                      onClick={() => handleSettingChange('showDebug', true)} 
                      className="text-[9px] text-emerald-400 underline mt-1 font-mono hover:text-emerald-300 cursor-pointer uppercase font-bold"
                    >
                      SHOW LIVE STREAM
                    </button>
                  </div>
                )}

                {settings.showDebug && cameraActive && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-zinc-950/80 text-[8px] font-mono text-zinc-400 border border-zinc-800">
                    REAR CAM • RAW FEED
                  </div>
                )}
              </div>

              {/* Downscaled Optical Flow Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>OPTICAL FLOW VECTOR HUD</span>
                  <span className="text-zinc-600">64x48 CORES</span>
                </div>
                
                <div className="relative w-full aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-900 flex items-center justify-center">
                  {/* Invisible working canvas used by the optical flow solver */}
                  <canvas 
                    ref={debugCanvasRef} 
                    width={64} 
                    height={48} 
                    className="hidden"
                  />
                  {/* Visible rendering flow canvas */}
                  <canvas
                    ref={flowCanvasRef}
                    width={64}
                    height={48}
                    className="w-full h-full object-contain image-render-pixelated animate-pulse"
                  />

                  {stats.obstacleWarning && (
                    <div className="absolute inset-0 bg-red-950/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-3 animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-[9px] text-red-300 font-bold mt-1 uppercase tracking-wider">TRACKING BOUNDARY CRASH</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REALTIME SENSOR HUD DATA */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-4 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-300">REAL-TIME TELEMETRY DATA</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Latency (Solver)</div>
                <div className="text-xs font-bold mt-0.5 text-white">{stats.processingTimeMs} <span className="text-[9px] text-zinc-500 font-normal">ms</span></div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Z-Delta (Divergence)</div>
                <div className={`text-xs font-bold mt-0.5 ${stats.translationDeltaZ > 0.05 ? 'text-emerald-400' : stats.translationDeltaZ < -0.05 ? 'text-pink-400' : 'text-zinc-400'}`}>
                  {stats.translationDeltaZ > 0 ? '+' : ''}{stats.translationDeltaZ.toFixed(3)}
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">X-Delta (Strafe)</div>
                <div className={`text-xs font-bold mt-0.5 ${stats.translationDeltaX > 0.05 ? 'text-emerald-400' : stats.translationDeltaX < -0.05 ? 'text-pink-400' : 'text-zinc-400'}`}>
                  {stats.translationDeltaX > 0 ? '+' : ''}{stats.translationDeltaX.toFixed(3)}
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Y-Delta (Elevation)</div>
                <div className={`text-xs font-bold mt-0.5 ${stats.translationDeltaY > 0.05 ? 'text-emerald-400' : stats.translationDeltaY < -0.05 ? 'text-pink-400' : 'text-zinc-400'}`}>
                  {stats.translationDeltaY > 0 ? '+' : ''}{stats.translationDeltaY.toFixed(3)}
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Head Yaw</div>
                <div className="text-xs font-bold mt-0.5 text-zinc-200">
                  {((stats.rotYaw * 180) / Math.PI).toFixed(1)}°
                </div>
              </div>

              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="text-[8px] text-zinc-500 uppercase font-bold">Head Pitch</div>
                <div className="text-xs font-bold mt-0.5 text-zinc-200">
                  {((stats.rotPitch * 180) / Math.PI).toFixed(1)}°
                </div>
              </div>

              <div className="col-span-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between">
                <div>
                  <div className="text-[8px] text-zinc-500 uppercase font-bold">Integrated Pose Vectors</div>
                  <div className="text-[10px] font-bold mt-1 text-white">
                    X: {stats.posX.toFixed(2)} • Y: {stats.posY.toFixed(2)} • Z: {stats.posZ.toFixed(2)}
                  </div>
                </div>
                {stats.isCalibrated ? (
                  <span className="text-[8px] px-1 bg-emerald-950/40 text-emerald-400 rounded border border-emerald-900/50 shrink-0 font-bold">
                    CALIBRATED
                  </span>
                ) : (
                  <span className="text-[8px] px-1 bg-amber-950/40 text-amber-400 rounded border border-amber-900/50 shrink-0 font-bold animate-pulse">
                    UNSET
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SENSOR CONFIGURATION SLIDERS */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-4 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-300">ALGORITHM RIG CALIBRATION</span>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Interpupillary Distance (IPD) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    IPD (Stereo Separation)
                  </span>
                  <span>{settings.ipd.toFixed(3)} units</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.4"
                  step="0.005"
                  value={settings.ipd}
                  onChange={(e) => handleSettingChange('ipd', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Field of View (FOV) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span>Field of View (FOV)</span>
                  <span>{settings.fov}°</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="110"
                  step="1"
                  value={settings.fov}
                  onChange={(e) => handleSettingChange('fov', parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Translation Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span>Translation Sensitivity (Z-axis)</span>
                  <span>{settings.translationSensitivity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4"
                  step="0.05"
                  value={settings.translationSensitivity}
                  onChange={(e) => handleSettingChange('translationSensitivity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Yaw Rotation Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span>Rotation Sensitivity (Yaw - X)</span>
                  <span>{settings.rotationSensitivityX.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={settings.rotationSensitivityX}
                  onChange={(e) => handleSettingChange('rotationSensitivityX', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Pitch Rotation Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span>Rotation Sensitivity (Pitch - Y)</span>
                  <span>{settings.rotationSensitivityY.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={settings.rotationSensitivityY}
                  onChange={(e) => handleSettingChange('rotationSensitivityY', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Smoothing / Inertia factor */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-400">
                  <span>Tracking Inertia (Smoothing)</span>
                  <span>{settings.smoothing.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={settings.smoothing}
                  onChange={(e) => handleSettingChange('smoothing', parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Inversions Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.invertYaw}
                    onChange={(e) => handleSettingChange('invertYaw', e.target.checked)}
                    className="rounded border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-0 cursor-pointer text-xs"
                  />
                  <span className="text-[9px] text-zinc-450">Invert Yaw</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.invertPitch}
                    onChange={(e) => handleSettingChange('invertPitch', e.target.checked)}
                    className="rounded border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-0 cursor-pointer text-xs"
                  />
                  <span className="text-[9px] text-zinc-450">Invert Pitch</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={settings.showDebug}
                    onChange={(e) => handleSettingChange('showDebug', e.target.checked)}
                    className="rounded border-zinc-850 bg-zinc-950 text-emerald-500 focus:ring-0 cursor-pointer text-xs"
                  />
                  <span className="text-[9px] text-zinc-450">Show Raw Camera Stream Feed</span>
                </label>
              </div>

            </div>
          </div>

        </section>

      </main>

      {/* Footer information */}
      <footer className="border-t border-zinc-900 bg-black/80 p-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500">
          <div>© 2026 INSIDE-OUT VR SYSTEM • DESIGN: IMMERSIVE UI • NO EMBEDDED GYRO REQUIRED</div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">WebGL GPU Acceleration Active</span>
            <span>Ref: SAD-Flow Version 1.2</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
