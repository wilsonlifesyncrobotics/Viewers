/**
 * Navigation Controller
 * Updates crosshair position and MPR orientation from tracking data
 * Includes coordinate transformation from register (r) to DICOM (d) coordinates
 */

import { vec3 } from 'gl-matrix';
import { Types as cs3DTypes, utilities as cs3DUtilities, getRenderingEngine } from '@cornerstonejs/core';
import { annotation, utilities } from '@cornerstonejs/tools';
import CoordinateTransformer from './CoordinateTransformer';

class NavigationController {
  private servicesManager: any;
  private trackingSubscription: any = null;
  private isNavigating: boolean = false;
  private updateCount: number = 0;
  private lastUpdateTime: number = 0;
  private lastRenderTime: number = 0;
  private targetFPS: number = 25; // Target UI update rate (Hz)
  private minFrameTime: number = 1000 / this.targetFPS; // Min time between UI updates (ms)
  private coordinateTransformer: CoordinateTransformer;

  constructor(servicesManager: any) {
    this.servicesManager = servicesManager;
    this.coordinateTransformer = new CoordinateTransformer();
    console.log('🧭 NavigationController initialized', { targetFPS: this.targetFPS });
  }

  /**
   * Start navigation mode
   * Subscribes to tracking updates and applies them to crosshair
   */
  public startNavigation(mode: string = 'circular'): void {
    const { trackingService, cornerstoneViewportService } = this.servicesManager.services;

    if (!trackingService) {
      console.error('❌ TrackingService not available');
      return;
    }

    if (this.isNavigating) {
      console.warn('⚠️ Navigation already active');
      return;
    }

    console.log(`▶️ Starting navigation (mode: ${mode})`);

    // Auto-detect and set volume center before starting
    const volumeCenter = this._autoDetectVolumeCenter();
    if (volumeCenter) {
      console.log(`📍 Auto-detected volume center: [${volumeCenter.map(v => v.toFixed(1)).join(', ')}]`);
    }

    // Subscribe to tracking updates
    const TRACKING_EVENTS = {
      TRACKING_UPDATE: 'event::tracking_update',
      CONNECTION_STATUS: 'event::connection_status',
    };

    this.trackingSubscription = trackingService.subscribe(
      TRACKING_EVENTS.TRACKING_UPDATE,
      this._handleTrackingUpdate.bind(this)
    );

    this.isNavigating = true;
    this.updateCount = 0;
    this.lastUpdateTime = performance.now();
    this.lastRenderTime = performance.now();

    // Connect to SyncForge tracking API
    console.log('🔗 Connecting to SyncForge tracking API...');

    // Subscribe to connection status
    const connectionSubscription = trackingService.subscribe(
      TRACKING_EVENTS.CONNECTION_STATUS,
      (status: any) => {
        if (status.connected) {
          console.log('✅ Connected! Tracking data streaming at 100Hz...');

          if (volumeCenter) {
            console.log(`📍 Volume center detected: [${volumeCenter.map(v => v.toFixed(1)).join(', ')}]`);
            // Note: setCenter() no longer needed - simulator runs independently
          }

          connectionSubscription.unsubscribe(); // Clean up this subscription
        } else if (status.error) {
          console.error('❌ Connection failed:', status.error);
          this.stopNavigation();
        }
      }
    );

    // Initiate connection (async)
    trackingService.connect().catch(error => {
      console.error('❌ Failed to connect to tracking API:', error);
      this.stopNavigation();
    });

    console.log('✅ Navigation initialized, connecting to API...');
  }

  /**
   * Stop navigation mode
   */
  public stopNavigation(): void {
    if (!this.isNavigating) {
      return;
    }

    console.log('⏸️ Stopping navigation');

    // Set flag first to prevent any race conditions
    this.isNavigating = false;

    const { trackingService } = this.servicesManager.services;

    // Unsubscribe from tracking updates
    if (this.trackingSubscription) {
      try {
        this.trackingSubscription.unsubscribe();
      } catch (error) {
        console.warn('⚠️ Error unsubscribing from tracking:', error);
      }
      this.trackingSubscription = null;
    }

    // Disconnect from tracking server
    if (trackingService) {
      try {
        trackingService.disconnect();
      } catch (error) {
        console.warn('⚠️ Error disconnecting from tracking service:', error);
      }
    }

    // Log stats only if we had updates
    if (this.updateCount > 0 && this.lastUpdateTime > 0) {
      const totalTime = (performance.now() - this.lastUpdateTime) / 1000;
      if (totalTime > 0) {
        console.log(
          `📊 Navigation stats: ${this.updateCount} updates in ${totalTime.toFixed(2)}s (avg ${(this.updateCount / totalTime).toFixed(1)} Hz)`
        );
      }
    }

    console.log('✅ Navigation stopped successfully');
  }

  /**
   * Handle tracking update - update crosshair position
   * Data received at 100Hz, but UI updates throttled to 25Hz
   * Applies coordinate transformation from register to DICOM
   */
  private _handleTrackingUpdate(event: any): void {
    const { position, orientation, frame_id } = event;
    const { cornerstoneViewportService } = this.servicesManager.services;

    this.updateCount++;

    // Throttle UI updates to target FPS
    const now = performance.now();
    const timeSinceLastRender = now - this.lastRenderTime;
    
    if (timeSinceLastRender < this.minFrameTime) {
      // Skip this frame - too soon since last render
      if (this.updateCount % 100 === 0) {
        const dataHz = this.updateCount / ((now - this.lastUpdateTime) / 1000);
        const renderHz = 1000 / this.minFrameTime;
        console.log(`📊 Data: ${dataHz.toFixed(1)} Hz, Rendering: ${renderHz.toFixed(1)} Hz (throttled)`);
      }
      return;
    }

    // Transform coordinates from register to DICOM
    // Tracking data comes in register (r) coordinates
    // OHIF/Cornerstone needs DICOM (d) coordinates
    const registerPosition = position;
    const dicomPosition = this.coordinateTransformer.hasTransform()
      ? this.coordinateTransformer.registerToDICOM(registerPosition)
      : registerPosition;

    // Log every 25 renders (about once per second at 25 FPS)
    if (this.updateCount % 25 === 0) {
      const elapsed = (now - this.lastUpdateTime) / 1000;
      const dataHz = this.updateCount / elapsed;
      const renderHz = 1000 / timeSinceLastRender;
      
      if (this.coordinateTransformer.hasTransform() && !this.coordinateTransformer.isIdentityTransform()) {
        console.log(`🔄 Update #${this.updateCount} | Data: ${dataHz.toFixed(1)} Hz | UI: ${renderHz.toFixed(1)} Hz`);
        console.log(`   Register: [${registerPosition.map(v => v.toFixed(1)).join(', ')}]`);
        console.log(`   DICOM:    [${dicomPosition.map(v => v.toFixed(1)).join(', ')}]`);
      } else {
        console.log(`🔄 Update #${this.updateCount} | Data: ${dataHz.toFixed(1)} Hz | UI: ${renderHz.toFixed(1)} Hz → [${dicomPosition.map(v => v.toFixed(1)).join(', ')}]`);
      }
    }

    try {
      // Update crosshair for each viewport using DICOM coordinates
      this._updateCrosshairPosition(dicomPosition, orientation);
      this.lastRenderTime = now;
    } catch (error) {
      console.error('❌ Error updating crosshair:', error);
    }
  }

  /**
   * Update crosshair position across all viewports
   * Uses viewport state restoration approach (like snapshot restore)
   */
  private _updateCrosshairPosition(position: number[], orientation: number[]): void {
    const { cornerstoneViewportService } = this.servicesManager.services;

    if (!cornerstoneViewportService) {
      return;
    }

    // Use the proper viewport state update method
    this._updateViewportStates(position);
  }

  /**
   * Update viewport states using proper Cornerstone3D methods
   * This follows the same pattern as ViewportStateService.restoreSnapshot()
   */
  private _updateViewportStates(position: number[]): void {
    const { cornerstoneViewportService } = this.servicesManager.services;

    if (!cornerstoneViewportService) {
      console.warn('⚠️ No cornerstoneViewportService');
      return;
    }

    // Get rendering engine to check bounds
    const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
    if (!renderingEngine) {
      return;
    }

    // Clamp position to volume bounds to avoid "No imageId found" errors
    let clampedPosition = this._clampToVolumeBounds(position, renderingEngine);
    if (!clampedPosition) {
      // Couldn't get bounds, use original position
      clampedPosition = position;
    }

    // Store the target position
    if (!this.lastPosition) {
      this.lastPosition = clampedPosition;
      console.log(`📍 Initial position stored: [${clampedPosition.map(v => v.toFixed(1)).join(', ')}]`);
      return;
    }

    // Only update if there's significant movement
    const delta = [
      clampedPosition[0] - this.lastPosition[0],
      clampedPosition[1] - this.lastPosition[1],
      clampedPosition[2] - this.lastPosition[2],
    ];
    const movement = Math.sqrt(delta[0] * delta[0] + delta[1] * delta[1] + delta[2] * delta[2]);
    if (movement < 0.5) {
      // Too small movement, skip (log occasionally)
      if (this.updateCount % 100 === 0) {
        console.log(`⏭️ Skipping small movement: ${movement.toFixed(2)}mm`);
      }
      return;
    }

    // Get viewports from rendering engine (already have renderingEngine from above)
    const viewports = renderingEngine.getViewports();

    if (this.updateCount === 2) {
      console.log(`📊 Found ${viewports.length} viewports:`, viewports.map(v => v.id));
    }

    let updatedCount = 0;

    viewports.forEach(vp => {
      try {
        if (!vp) {
          if (this.updateCount === 2) {
            console.warn(`⚠️ Viewport is null`);
          }
          return;
        }

        if (vp.type === 'stack') {
          if (this.updateCount === 2) {
            console.log(`⏭️ Skipping stack viewport: ${vp.id}`);
          }
          return;
        }

        const camera = vp.getCamera();

        if (this.updateCount === 2) {
          console.log(`📷 ${vp.id} camera:`, {
            focalPoint: camera.focalPoint,
            position: camera.position,
            viewUp: camera.viewUp,
          });
        }

        // Calculate new camera position maintaining view direction
        const viewPlaneNormal = vec3.create();
        vec3.subtract(viewPlaneNormal, camera.position, camera.focalPoint);
        const distance = vec3.length(viewPlaneNormal);
        vec3.normalize(viewPlaneNormal, viewPlaneNormal);

        const newFocalPoint: cs3DTypes.Point3 = [
          clampedPosition[0],
          clampedPosition[1],
          clampedPosition[2]
        ];
        const newPosition: cs3DTypes.Point3 = [
          newFocalPoint[0] + viewPlaneNormal[0] * distance,
          newFocalPoint[1] + viewPlaneNormal[1] * distance,
          newFocalPoint[2] + viewPlaneNormal[2] * distance,
        ];

        // Update camera WITHOUT triggering reference updates
        // Just pan the view smoothly
        vp.setCamera({
          focalPoint: newFocalPoint,
          position: newPosition,
          viewUp: camera.viewUp,
        });

        // Render the viewport
        vp.render();
        updatedCount++;

        if (this.updateCount === 2) {
          console.log(`✅ Updated ${vp.id} to focal point [${newFocalPoint.map(v => v.toFixed(1)).join(', ')}]`);
        }
      } catch (error) {
        if (this.updateCount <= 5) {
          console.error(`❌ Error updating ${vp.id}:`, error);
        }
      }
    });

    if (this.updateCount === 2) {
      console.log(`✅ Updated ${updatedCount}/${viewports.length} viewports`);
    }

    this.lastPosition = clampedPosition;
  }

  private lastPosition: number[] | null = null;

  /**
   * Set center point for tracking simulation
   * Useful for setting the tracking origin to current crosshair position
   */
  public setCenterToCurrentPosition(): void {
    const { trackingService } = this.servicesManager.services;

    if (!trackingService) {
      console.warn('⚠️ TrackingService not available');
      return;
    }

    // Get current crosshair annotation position
    const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
    if (!renderingEngine) {
      console.warn('⚠️ No rendering engine found');
      return;
    }

    const viewports = renderingEngine.getViewports();
    if (viewports.length === 0) {
      console.warn('⚠️ No viewports found');
      return;
    }

    // Try to get actual crosshair annotation position
    let crosshairPosition = null;

    for (const viewport of viewports) {
      try {
        const element = viewport.element;
        if (!element) continue;

        // Get crosshairs annotations
        const annotations = annotation.state.getAnnotations('Crosshairs', element);

        if (annotations && annotations.length > 0) {
          const crosshairAnnotation = annotations[0];

          // Get position from toolCenter (the actual crosshair center)
          if (crosshairAnnotation.data?.handles?.toolCenter) {
            crosshairPosition = crosshairAnnotation.data.handles.toolCenter;
            console.log(`📍 Found crosshair CENTER from toolCenter in ${viewport.id}`);
            break;
          } else if (crosshairAnnotation.data?.handles?.rotationPoints) {
            // Fallback to rotationPoints (but this is a rotation handle, not the center!)
            crosshairPosition = crosshairAnnotation.data.handles.rotationPoints[0];
            console.log(`⚠️ Using rotationPoints[0] (rotation handle) in ${viewport.id}`);
            break;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error getting crosshair from ${viewport.id}:`, error);
      }
    }

    // Fallback to camera focal point if no crosshair found
    if (!crosshairPosition) {
      console.warn('⚠️ No crosshair annotation found, using camera focal point as fallback');
      const firstViewport = viewports[0];
      const camera = firstViewport.getCamera();
      crosshairPosition = camera.focalPoint;
    }

    if (crosshairPosition) {
      const position = Array.isArray(crosshairPosition)
        ? crosshairPosition
        : [crosshairPosition[0], crosshairPosition[1], crosshairPosition[2]];

      // Send to tracking server
      trackingService.setCenter(position);

      console.log(`📍 Tracking center set to: [${position.map(v => v.toFixed(1)).join(', ')}]`);
    } else {
      console.error('❌ Could not determine center position');
    }
  }

  /**
   * Auto-detect volume center from loaded DICOM data
   * Returns the geometric center of the volume bounds
   */
  private _autoDetectVolumeCenter(): number[] | null {
    try {
      const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
      if (!renderingEngine) {
        console.warn('⚠️ No rendering engine found for auto-detect');
        return null;
      }

      const viewports = renderingEngine.getViewports();
      if (viewports.length === 0) {
        console.warn('⚠️ No viewports found for auto-detect');
        return null;
      }

      // Get bounds from the first volume viewport
      for (const viewport of viewports) {
        if (viewport.type === 'orthographic' || viewport.type === 'volume3d') {
          const defaultActor = viewport.getDefaultActor?.();
          if (defaultActor && defaultActor.actor) {
            const bounds = (defaultActor.actor as any).getBounds?.();
            if (bounds && bounds.length === 6) {
              // bounds = [xMin, xMax, yMin, yMax, zMin, zMax]
              const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;

              // Calculate geometric center
              const center = [
                (xMin + xMax) / 2,
                (yMin + yMax) / 2,
                (zMin + zMax) / 2,
              ];

              console.log(`📊 Volume bounds: X[${xMin.toFixed(1)}, ${xMax.toFixed(1)}] Y[${yMin.toFixed(1)}, ${yMax.toFixed(1)}] Z[${zMin.toFixed(1)}, ${zMax.toFixed(1)}]`);

              return center;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error auto-detecting volume center:', error);
    }

    return null;
  }

  /**
   * Clamp position to volume bounds to prevent "No imageId found" errors
   */
  private _clampToVolumeBounds(position: number[], renderingEngine: any): number[] | null {
    try {
      const viewports = renderingEngine.getViewports();
      if (viewports.length === 0) {
        return null;
      }

      // Get bounds from the first volume viewport
      for (const viewport of viewports) {
        if (viewport.type === 'orthographic' || viewport.type === 'volume3d') {
          const defaultActor = viewport.getDefaultActor?.();
          if (defaultActor && defaultActor.actor) {
            const bounds = defaultActor.actor.getBounds();
            if (bounds && bounds.length === 6) {
              // bounds = [xMin, xMax, yMin, yMax, zMin, zMax]
              const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;

              // Add a small margin to avoid edge cases
              const margin = 1.0; // mm

              const clampedPosition = [
                Math.max(xMin + margin, Math.min(xMax - margin, position[0])),
                Math.max(yMin + margin, Math.min(yMax - margin, position[1])),
                Math.max(zMin + margin, Math.min(zMax - margin, position[2])),
              ];

              // Log if clamping occurred
              if (this.updateCount % 100 === 0 && (
                clampedPosition[0] !== position[0] ||
                clampedPosition[1] !== position[1] ||
                clampedPosition[2] !== position[2]
              )) {
                console.warn(`⚠️ Position clamped to volume bounds:`);
                console.warn(`   Original: [${position.map(v => v.toFixed(1)).join(', ')}]`);
                console.warn(`   Clamped:  [${clampedPosition.map(v => v.toFixed(1)).join(', ')}]`);
                console.warn(`   Bounds: X[${xMin.toFixed(1)}, ${xMax.toFixed(1)}] Y[${yMin.toFixed(1)}, ${yMax.toFixed(1)}] Z[${zMin.toFixed(1)}, ${zMax.toFixed(1)}]`);
              }

              return clampedPosition;
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error getting volume bounds:', error);
    }

    return null;
  }

  /**
   * Load coordinate transformation from case data
   * @param rMd 4x4 transformation matrix from register to DICOM
   */
  public loadTransformation(rMd: number[][] | any): void {
    try {
      this.coordinateTransformer.loadTransform(rMd);
      console.log('✅ Coordinate transformation loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load transformation:', error);
      throw error;
    }
  }

  /**
   * Load transformation from case.json file
   * Automatically extracts rMd from dicom_series.fixed_image
   */
  public async loadTransformationFromCase(caseId: string): Promise<void> {
    try {
      // Fetch case.json from SurgicalCase directory
      // This would need to be implemented based on how case data is accessed in OHIF
      console.log(`📋 Loading transformation for case: ${caseId}`);
      console.warn('⚠️ Auto-loading from case.json not yet implemented');
      console.warn('   Use loadTransformation() with explicit rMd matrix');
    } catch (error) {
      console.error('❌ Failed to load case transformation:', error);
      throw error;
    }
  }

  /**
   * Clear coordinate transformation (use raw tracking data)
   */
  public clearTransformation(): void {
    this.coordinateTransformer.clear();
    console.log('✅ Coordinate transformation cleared');
  }

  /**
   * Set target UI update rate (FPS)
   * @param fps Target frames per second (recommended: 20-30)
   */
  public setTargetFPS(fps: number): void {
    if (fps < 10 || fps > 60) {
      console.warn(`⚠️ Target FPS should be between 10-60, got ${fps}. Using default 25.`);
      fps = 25;
    }
    this.targetFPS = fps;
    this.minFrameTime = 1000 / fps;
    console.log(`🎯 Target UI update rate set to ${fps} Hz`);
  }

  /**
   * Get navigation status
   */
  public getStatus() {
    const transform = this.coordinateTransformer.getTransform();
    
    return {
      navigating: this.isNavigating,
      updateCount: this.updateCount,
      targetFPS: this.targetFPS,
      actualFPS: this.lastRenderTime > 0 
        ? 1000 / (performance.now() - this.lastRenderTime) 
        : 0,
      transformation: {
        loaded: this.coordinateTransformer.hasTransform(),
        isIdentity: this.coordinateTransformer.isIdentityTransform(),
        rMd: transform.rMd,
        invRMd: transform.invRMd,
      },
    };
  }
}

export default NavigationController;
