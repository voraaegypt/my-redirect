export type SceneType = 'voxels' | 'pillars' | 'neon' | 'grid';

export interface TrackingSettings {
  enabled: boolean;
  ipd: number;               // Interpupillary distance in 3D units (e.g., 0.064)
  fov: number;               // Camera field of view (e.g., 75)
  translationSensitivity: number; // Scale for forward/backward translation
  rotationSensitivityX: number;  // Scale for Yaw (turning left/right)
  rotationSensitivityY: number;  // Scale for Pitch (looking up/down)
  smoothing: number;         // Inertia/smoothing factor (0 to 0.95)
  showDebug: boolean;        // Toggle developer metrics
  selectedScene: SceneType;  // Active 3D environment
  obstacleThreshold: number; // Grayscale change threshold for safety warning
  darknessThreshold: number; // Threshold below which feed is too dark
  invertYaw: boolean;        // Invert turn left/right
  invertPitch: boolean;      // Invert look up/down
}

export interface TrackingStats {
  fps: number;
  translationDeltaZ: number; // Motion vector along Z (divergence)
  translationDeltaX: number; // Motion vector along X (strafing)
  translationDeltaY: number; // Motion vector along Y (elevation)
  yawDelta: number;          // Motion vector left/right (Yaw)
  pitchDelta: number;        // Motion vector up/down (Pitch)
  posX: number;              // Current 3D position X
  posY: number;              // Current 3D position Y
  posZ: number;              // Current 3D position Z
  rotYaw: number;            // Current 3D rotation Yaw
  rotPitch: number;          // Current 3D rotation Pitch
  obstacleWarning: boolean;  // True if camera is blocked or sudden movement detected
  isCalibrated: boolean;
  processingTimeMs: number;  // Latency of the optical flow solver in milliseconds
  activeVectors: { x: number; y: number; vx: number; vy: number }[]; // Sample flow vectors for debug display
}
