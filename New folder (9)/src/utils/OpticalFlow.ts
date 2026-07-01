import { TrackingStats } from '../types';

export class OpticalFlowTracker {
  private width: number;
  private height: number;
  private prevGrayscale: Uint8Array;
  private currGrayscale: Uint8Array;
  
  // Grid parameters for block matching
  private cols: number = 10;
  private rows: number = 8;
  private blockSize: number = 6;
  private searchRange: number = 3; // search -3 to +3 pixels
  private minContrast: number = 8; // Ignore blocks with very low contrast to avoid noise

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.prevGrayscale = new Uint8Array(width * height);
    this.currGrayscale = new Uint8Array(width * height);
  }

  /**
   * Process a new video frame, calculate the motion vector field partitioned into a 2x2 grid (4 quadrants),
   * and resolve true physical Translation (X/Y strafe, Z forward/backward) versus Head Rotation.
   */
  public processFrame(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    prevStats: TrackingStats,
    settings: {
      translationSensitivity: number;
      rotationSensitivityX: number;
      rotationSensitivityY: number;
      smoothing: number;
      obstacleThreshold: number;
      darknessThreshold: number;
      invertYaw: boolean;
      invertPitch: boolean;
    }
  ): TrackingStats {
    const startTime = performance.now();

    // 1. Draw the video frame downscaled to the hidden canvas (64x48)
    ctx.drawImage(video, 0, 0, this.width, this.height);
    
    // 2. Extract image pixels fast
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    // 3. Convert current frame to grayscale
    this.prevGrayscale.set(this.currGrayscale);

    let totalLuminance = 0;
    const numPixels = this.width * this.height;

    // Fast loop to calculate grayscale luminance
    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const gray = (r * 299 + g * 587 + b * 114) / 1000;
      this.currGrayscale[i] = gray;
      totalLuminance += gray;
    }

    const averageLuminance = totalLuminance / numPixels;

    // 4. Calculate overall frame difference for safety obstacles / blockages
    let totalAbsDiff = 0;
    for (let i = 0; i < numPixels; i++) {
      totalAbsDiff += Math.abs(this.currGrayscale[i] - this.prevGrayscale[i]);
    }
    const avgFrameDifference = totalAbsDiff / numPixels;

    const isDark = averageLuminance < settings.darknessThreshold;
    const isSuddenDisruption = avgFrameDifference > settings.obstacleThreshold;
    const obstacleWarning = isDark || isSuddenDisruption;

    // 5. Grid-Based Block Matching Optical Flow partitioned in 2x2 grid
    const cellW = Math.floor(this.width / (this.cols + 1));
    const cellH = Math.floor(this.height / (this.rows + 1));
    
    const vectors: { x: number; y: number; vx: number; vy: number }[] = [];
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Accumulators for 2x2 Quadrant Grid:
    // Index 0: Top-Left (Q0), Index 1: Top-Right (Q1), Index 2: Bottom-Left (Q2), Index 3: Bottom-Right (Q3)
    const qSumX = new Float32Array(4);
    const qSumY = new Float32Array(4);
    const qSumDiv = new Float32Array(4);
    const qCount = new Int32Array(4);

    // Skip edge blocks to maintain stable boundary searches
    for (let r = 1; r <= this.rows; r++) {
      const isTop = r <= this.rows / 2;
      const rowIdxOffset = isTop ? 0 : 2;

      for (let c = 1; c <= this.cols; c++) {
        const isLeft = c <= this.cols / 2;
        const qIdx = rowIdxOffset + (isLeft ? 0 : 1);

        const bx = c * cellW;
        const by = r * cellH;

        // Verify texture contrast inside block to skip low-contrast blank frames
        let minVal = 255;
        let maxVal = 0;
        for (let y = -this.blockSize / 2; y < this.blockSize / 2; y++) {
          for (let x = -this.blockSize / 2; x < this.blockSize / 2; x++) {
            const val = this.currGrayscale[(by + y) * this.width + (bx + x)];
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
          }
        }

        if (maxVal - minVal < this.minContrast) {
          continue; // Skip flat texture regions
        }

        // Perform block match with Sum of Absolute Differences (SAD)
        let bestDx = 0;
        let bestDy = 0;
        let minSAD = Infinity;

        for (let dy = -this.searchRange; dy <= this.searchRange; dy++) {
          for (let dx = -this.searchRange; dx <= this.searchRange; dx++) {
            let sad = 0;
            
            // OPTIMIZATION: Check every 2nd pixel inside the block to reduce calculations by 75% (< 1ms solver time!)
            for (let y = -this.blockSize / 2; y < this.blockSize / 2; y += 2) {
              const currY = by + dy + y;
              const prevY = by + y;
              
              if (currY < 0 || currY >= this.height || prevY < 0 || prevY >= this.height) continue;
              
              const currRowOffset = currY * this.width;
              const prevRowOffset = prevY * this.width;

              for (let x = -this.blockSize / 2; x < this.blockSize / 2; x += 2) {
                const currX = bx + dx + x;
                const prevX = bx + x;

                if (currX < 0 || currX >= this.width || prevX < 0 || prevX >= this.width) continue;

                const currPixel = this.currGrayscale[currRowOffset + currX];
                const prevPixel = this.prevGrayscale[prevRowOffset + prevX];
                
                sad += Math.abs(currPixel - prevPixel);
              }
            }

            // Small stabilization bias towards zero displacement to filter noise
            const bias = (dx * dx + dy * dy) * 0.12;
            const score = sad + bias;

            if (score < minSAD) {
              minSAD = score;
              bestDx = dx;
              bestDy = dy;
            }
          }
        }

        // Project block coordinates outward from center to determine divergence (depth scaling)
        const rx = (bx - cx) / cx; // Radial direction normalized X [-1, 1]
        const ry = (by - cy) / cy; // Radial direction normalized Y [-1, 1]
        const blockDivergence = bestDx * rx + bestDy * ry;

        // Accumulate in respective 2x2 grid quadrant
        qSumX[qIdx] += bestDx;
        qSumY[qIdx] += bestDy;
        qSumDiv[qIdx] += blockDivergence;
        qCount[qIdx]++;

        // Add subset of vectors for developer debug preview
        if ((r + c) % 2 === 0) {
          vectors.push({ x: bx, y: by, vx: bestDx, vy: bestDy });
        }
      }
    }

    // 6. Resolve quadrant averages
    const avgX = new Float32Array(4);
    const avgY = new Float32Array(4);
    const avgDiv = new Float32Array(4);

    for (let i = 0; i < 4; i++) {
      if (qCount[i] > 0) {
        avgX[i] = qSumX[i] / qCount[i];
        avgY[i] = qSumY[i] / qCount[i];
        avgDiv[i] = qSumDiv[i] / qCount[i];
      }
    }

    // Solve for Translation and Rotation using 2x2 quadrant relationships:
    let translationDeltaZ = 0; // Forward/Backward
    let translationDeltaX = 0; // Left/Right Strafing
    let translationDeltaY = 0; // Vertical elevation
    let yawDelta = 0;
    let pitchDelta = 0;

    // Check if the overall divergence is in agreement across quadrants (Expansion or Contraction)
    const isExpanding = avgDiv[0] > 0.05 && avgDiv[1] > 0.05 && avgDiv[2] > 0.05 && avgDiv[3] > 0.05;
    const isContracting = avgDiv[0] < -0.05 && avgDiv[1] < -0.05 && avgDiv[2] < -0.05 && avgDiv[3] < -0.05;
    const globalDiv = (avgDiv[0] + avgDiv[1] + avgDiv[2] + avgDiv[3]) / 4;

    if (isExpanding || isContracting) {
      // Direct physical forward/backward movement along looking vector
      translationDeltaZ = globalDiv * settings.translationSensitivity * 1.5;
    } else {
      // Weak/Asymmetric divergence - apply with damper
      translationDeltaZ = globalDiv * settings.translationSensitivity * 0.4;
    }

    // Strafing (Local X translation): All quadrants have the same sign of horizontal motion (Global uniform slide)
    const isStrafingX = (avgX[0] > 0.05 && avgX[1] > 0.05 && avgX[2] > 0.05 && avgX[3] > 0.05) ||
                         (avgX[0] < -0.05 && avgX[1] < -0.05 && avgX[2] < -0.05 && avgX[3] < -0.05);
    const globalX = (avgX[0] + avgX[1] + avgX[2] + avgX[3]) / 4;

    if (isStrafingX) {
      translationDeltaX = globalX * settings.translationSensitivity * 1.5;
    }

    // Vertical elevation Y translation: All quadrants share same vertical motion sign
    const isElevatingY = (avgY[0] > 0.05 && avgY[1] > 0.05 && avgY[2] > 0.05 && avgY[3] > 0.05) ||
                         (avgY[0] < -0.05 && avgY[1] < -0.05 && avgY[2] < -0.05 && avgY[3] < -0.05);
    const globalY = (avgY[0] + avgY[1] + avgY[2] + avgY[3]) / 4;

    if (isElevatingY) {
      translationDeltaY = -globalY * settings.translationSensitivity * 1.5; // Natural coordinate inversion
    }

    // Rotation (Yaw / Pitch fallback if device gyro orientation API is not available/bound)
    // Looking left/right (Yaw) corresponds to global horizontal shift
    yawDelta = globalX * settings.rotationSensitivityX * 0.12;
    // Looking up/down (Pitch) corresponds to global vertical shift
    pitchDelta = globalY * settings.rotationSensitivityY * 0.12;

    if (settings.invertYaw) {
      yawDelta = -yawDelta;
    }
    if (settings.invertPitch) {
      pitchDelta = -pitchDelta;
    }

    // 7. Temporal Smoothing & Updates using inertia (smoothing factor)
    const k = 1.0 - settings.smoothing;
    
    const smoothYawDelta = prevStats.yawDelta * settings.smoothing + yawDelta * k;
    const smoothPitchDelta = prevStats.pitchDelta * settings.smoothing + pitchDelta * k;
    
    const smoothTranslationZ = prevStats.translationDeltaZ * settings.smoothing + translationDeltaZ * k;
    const smoothTranslationX = prevStats.translationDeltaX * settings.smoothing + translationDeltaX * k;
    const smoothTranslationY = prevStats.translationDeltaY * settings.smoothing + translationDeltaY * k;

    // Calculate integrated 3D posture values
    let newYaw = prevStats.rotYaw + smoothYawDelta;
    let newPitch = prevStats.rotPitch + smoothPitchDelta;

    const maxPitch = 85 * (Math.PI / 180);
    newPitch = Math.max(-maxPitch, Math.min(maxPitch, newPitch));

    // Calculate smooth movement translation relative to looking direction
    const lookX = Math.sin(newYaw) * Math.cos(newPitch);
    const lookZ = -Math.cos(newYaw) * Math.cos(newPitch);
    const lookY = Math.sin(newPitch);

    // Calculate right-hand side orthogonal vector for strafe strafing
    const rightX = Math.cos(newYaw);
    const rightZ = Math.sin(newYaw);

    let newPosX = prevStats.posX;
    let newPosY = prevStats.posY;
    let newPosZ = prevStats.posZ;

    if (!obstacleWarning) {
      // Apply forward/backward movement along looking vector
      newPosX += lookX * smoothTranslationZ;
      newPosY += lookY * smoothTranslationZ;
      newPosZ += lookZ * smoothTranslationZ;

      // Apply horizontal strafe along the right/left orthogonal vector
      newPosX += rightX * smoothTranslationX;
      newPosZ += rightZ * smoothTranslationX;

      // Apply vertical elevation
      newPosY += smoothTranslationY;
    }

    // Keep within sandbox boundary limit parameters
    const limit = 100;
    newPosX = Math.max(-limit, Math.min(limit, newPosX));
    newPosY = Math.max(1, Math.min(30, newPosY)); // stay above ground level (1.0 to 30.0 units)
    newPosZ = Math.max(-limit, Math.min(limit, newPosZ));

    const endTime = performance.now();

    return {
      fps: Math.round(1000 / (endTime - startTime || 1)),
      translationDeltaZ: smoothTranslationZ,
      translationDeltaX: smoothTranslationX,
      translationDeltaY: smoothTranslationY,
      yawDelta: smoothYawDelta,
      pitchDelta: smoothPitchDelta,
      posX: newPosX,
      posY: newPosY,
      posZ: newPosZ,
      rotYaw: newYaw,
      rotPitch: newPitch,
      obstacleWarning,
      isCalibrated: prevStats.isCalibrated,
      processingTimeMs: parseFloat((endTime - startTime).toFixed(1)),
      activeVectors: vectors
    };
  }
}
