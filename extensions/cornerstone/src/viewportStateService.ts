import { getRenderingEngine } from '@cornerstonejs/core';
import { ToolGroupManager, annotation } from '@cornerstonejs/tools';

interface ViewportState {
  frameOfReferenceUID: string;
  camera: any;
  viewReference: any;
  viewPresentation: any;
  metadata: {
    viewportId: string;
    viewportType: string;
    renderingEngineId: string;
    zoom: number;
    pan: number[];
  };
}

interface Snapshot {
  name: string;
  timestamp: string;
  viewports: ViewportState[];
}

class ViewportStateService {
  public static REGISTRATION = {
    name: 'viewportStateService',
    create: () => new ViewportStateService(),
  };

  private snapshots: Map<string, Snapshot>;
  private readonly MAX_SNAPSHOTS = 40;
  private readonly STORAGE_KEY = 'ohif_viewport_snapshots';
  private cameraLoggingEnabled: boolean = false;
  private cameraEventListeners: Map<string, any> = new Map();

  constructor() {
    // Clear all existing snapshots on initialization
    this.clearCacheOnInit();

    // Initialize with empty snapshots
    this.snapshots = new Map();

    // console.log('🧹 ViewportStateService initialized with clean cache');
  }

  // Clear cache on initialization
  private clearCacheOnInit() {
    try {
      // Clear from localStorage
      localStorage.removeItem(this.STORAGE_KEY);

      // Also clear any legacy storage keys if they exist
      localStorage.removeItem('ohif_viewport_states');

      console.log('🗑️ Cleared all existing viewport snapshots from cache');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  private getEngine() {
    return getRenderingEngine('OHIFCornerstoneRenderingEngine');
  }

  private getOrthographicViewports() {
    const engine = this.getEngine();

    if (!engine) {
      console.warn('⚠️ Rendering engine not found');
      return [];
    }

    const viewports = engine.getViewports();

    if (!Array.isArray(viewports)) {
      console.warn('⚠️ getViewports() did not return an array');
      return [];
    }

    const orthoViewports = viewports.filter(vp => vp?.type === 'orthographic');

    if (orthoViewports.length !== 3) {
      console.warn(`⚠️ Expected 3 orthographic viewports, found ${orthoViewports.length}`);
    }

    return orthoViewports;
  }

  private saveToStorage() {
    try {
      const serialized = JSON.stringify(Array.from(this.snapshots.entries()));
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  // Generate unique name
  private getUniqueName(baseName: string): string {
    let name = baseName;
    let counter = 1;

    while (this.snapshots.has(name)) {
      name = `${baseName} (${counter})`;
      counter++;
    }

    return name;
  }

  // Check if we've reached the limit
  private canAddSnapshot(): boolean {
    return this.snapshots.size < this.MAX_SNAPSHOTS;
  }

  // Save all orthographic viewports as one snapshot
  saveSnapshot(name: string): Snapshot {
    const engine = this.getEngine();
    if (!engine) throw new Error('Rendering engine not found');

    // Ensure unique name
    const uniqueName = this.getUniqueName(name);

    // Check limit
    if (!this.canAddSnapshot()) {
      // Remove oldest snapshot
      const firstKey = this.snapshots.keys().next().value;
      this.snapshots.delete(firstKey);
      console.warn(`⚠️ Snapshot limit reached. Removed oldest: ${firstKey}`);
    }

    const viewports = this.getOrthographicViewports();

    if (viewports.length === 0) {
      throw new Error('No orthographic viewports found');
    }

    // Capture state of all viewports
    const viewportStates: ViewportState[] = viewports.map(vp => ({
      frameOfReferenceUID: vp.getFrameOfReferenceUID(),
      camera: vp.getCamera(),
      viewReference: vp.getViewReference?.() || null,
      viewPresentation: vp.getViewPresentation?.() || null,
      metadata: {
        viewportId: vp.id,
        viewportType: vp.type,
        renderingEngineId: engine.id,
        zoom: vp.getZoom?.() || 1,
        pan: vp.getPan?.() || [0, 0],
      }
    }));

    const snapshot: Snapshot = {
      name: uniqueName,
      timestamp: new Date().toISOString(),
      viewports: viewportStates,
    };

    this.snapshots.set(uniqueName, snapshot);
    this.saveToStorage();

    console.log(`💾 Saved snapshot: "${uniqueName}" with ${viewportStates.length} viewports`);
    return snapshot;
  }

  // Restore specific snapshot by name
  restoreSnapshot(name: string): boolean {
    const snapshot = this.snapshots.get(name);

    if (!snapshot) {
      throw new Error(`Snapshot "${name}" not found`);
    }

    const engine = this.getEngine();
    if (!engine) throw new Error('Rendering engine not found');

    let restoredCount = 0;

    // Restore each viewport from the snapshot
    snapshot.viewports.forEach(savedState => {
      try {
        const vp = engine.getViewport(savedState.metadata.viewportId);

        if (!vp) {
          console.warn(`⚠️ Viewport ${savedState.metadata.viewportId} not found`);
          return;
        }

        vp.setCamera(savedState.camera);

        if (savedState.viewPresentation && typeof vp.setViewPresentation === 'function') {
          vp.setViewPresentation(savedState.viewPresentation);
        }

        if (savedState.viewReference && typeof vp.setViewReference === 'function') {
          vp.setViewReference(savedState.viewReference);
        }

        vp.render();
        restoredCount++;

      } catch (error) {
        console.error(`❌ Failed to restore viewport ${savedState.metadata.viewportId}:`, error);
      }
    });

    console.log(`✅ Restored snapshot: "${name}" (${restoredCount}/${snapshot.viewports.length} viewports)`);
    return restoredCount > 0;
  }

  // Get all snapshots
  getAllSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values());
  }

  // Get snapshot by name
  getSnapshot(name: string): Snapshot | undefined {
    return this.snapshots.get(name);
  }

  // Delete specific snapshot
  deleteSnapshot(name: string): boolean {
    const deleted = this.snapshots.delete(name);
    if (deleted) {
      this.saveToStorage();
      console.log(`🗑️ Deleted snapshot: "${name}"`);
    }
    return deleted;
  }

  // Clear all snapshots (also available as public method)
  clearAll() {
    this.snapshots.clear();
    this.saveToStorage();
    console.log('🧹 All snapshots cleared');
  }

  // Get remaining slots
  getRemainingSlots(): number {
    return this.MAX_SNAPSHOTS - this.snapshots.size;
  }

  // Get maximum snapshot limit
  getMaxSnapshots(): number {
    return this.MAX_SNAPSHOTS;
  }

  // Check if name exists
  hasSnapshot(name: string): boolean {
    return this.snapshots.has(name);
  }

  // Export to JSON
  exportJSON(): string {
    return JSON.stringify(Array.from(this.snapshots.entries()), null, 2);
  }

  // Import from JSON
  importJSON(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      this.snapshots = new Map(data);
      this.saveToStorage();
      console.log(`✅ Imported ${this.snapshots.size} snapshots`);
    } catch (error) {
      console.error('❌ Error importing:', error);
      throw new Error('Invalid JSON format');
    }
  }

  // Real-time camera focal point logging for MPR viewports
  private readonly MPR_VIEWPORT_IDS = ['mpr-axial', 'mpr-sagittal', 'mpr-coronal'];

  private isMPRViewport(viewportId: string): boolean {
    return this.MPR_VIEWPORT_IDS.some(id => viewportId.includes(id));
  }

  private logCameraFocalPoint(viewport: any) {
    try {
      const camera = viewport.getCamera();
      const viewportId = viewport.id;

      if (!camera || !camera.focalPoint) {
        return;
      }

      const [x, y, z] = camera.focalPoint;

      // Clean, compact output - just viewport and coordinates
      console.log(`📸 [${viewportId}] Focal Point: [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`);

      // Verbose output (commented out for clarity)
      // console.log(`📸 [${viewportId}] Camera Focal Point:`, {
      //   x: x.toFixed(2),
      //   y: y.toFixed(2),
      //   z: z.toFixed(2),
      //   raw: camera.focalPoint,
      //   timestamp: new Date().toISOString()
      // });
    } catch (error) {
      console.error('❌ Error logging focal point:', error);
    }
  }

  enableCameraLogging(): void {
    if (this.cameraLoggingEnabled) {
      // console.log('⚠️ Camera logging is already enabled');
      return;
    }

    const engine = this.getEngine();
    if (!engine) {
      console.error('❌ Cannot enable camera logging: Rendering engine not found');
      return;
    }

    const viewports = engine.getViewports();
    let enabledCount = 0;

    viewports.forEach(viewport => {
      if (this.isMPRViewport(viewport.id)) {
        const element = viewport.element;

        if (!element) {
          // console.warn(`⚠️ No element found for viewport: ${viewport.id}`);
          return;
        }

        // Log initial focal point (commented out for clarity)
        // console.log(`🎬 Starting camera logging for: ${viewport.id}`);
        // this.logCameraFocalPoint(viewport);

        // Debounced handler to avoid excessive logging
        let debounceTimeout;
        const debouncedHandler = () => {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            this.logCameraFocalPoint(viewport);
          }, 100); // 100ms debounce
        };

        // Handler for camera modified events
        const cameraHandler = (evt: any) => {
          const { element: evtElement } = evt.detail;
          if (evtElement === element) {
            this.logCameraFocalPoint(viewport);
          }
        };

        // Handler for image rendered (fires when scrolling slices)
        const imageRenderedHandler = (evt: any) => {
          const { element: evtElement } = evt.detail;
          if (evtElement === element) {
            debouncedHandler();
          }
        };

        // Store handlers for cleanup
        this.cameraEventListeners.set(viewport.id, {
          element,
          cameraHandler,
          imageRenderedHandler,
          debounceTimeout
        });

        // Listen for camera changes (pan, zoom, rotate)
        element.addEventListener('cornerstonecameramodified', cameraHandler);

        // Listen for image rendered (slice scrolling in MPR)
        element.addEventListener('cornerstoneimagerendered', imageRenderedHandler);

        enabledCount++;
      }
    });

    this.cameraLoggingEnabled = true;
    console.log(`✅ Camera logging enabled (${enabledCount} viewports)`);
    // console.log(`📌 Monitoring viewports: ${this.MPR_VIEWPORT_IDS.join(', ')}`);
    // console.log(`📌 Tracking: Camera changes (pan/zoom/rotate) and slice scrolling`);
  }

  disableCameraLogging(): void {
    if (!this.cameraLoggingEnabled) {
      // console.log('⚠️ Camera logging is already disabled');
      return;
    }

    this.cameraEventListeners.forEach(({ element, cameraHandler, imageRenderedHandler, debounceTimeout }, viewportId) => {
      // Clear any pending debounce timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Remove both event listeners
      element.removeEventListener('cornerstonecameramodified', cameraHandler);
      element.removeEventListener('cornerstoneimagerendered', imageRenderedHandler);

      // console.log(`🛑 Stopped camera logging for: ${viewportId}`);
    });

    this.cameraEventListeners.clear();
    this.cameraLoggingEnabled = false;
    console.log('✅ Camera logging disabled');
  }

  isCameraLoggingEnabled(): boolean {
    return this.cameraLoggingEnabled;
  }

  toggleCameraLogging(): void {
    if (this.cameraLoggingEnabled) {
      this.disableCameraLogging();
    } else {
      this.enableCameraLogging();
    }
  }

  // Get current focal points for all MPR viewports
  getCurrentFocalPoints(): Record<string, number[]> {
    const engine = this.getEngine();
    if (!engine) {
      return {};
    }

    const focalPoints: Record<string, number[]> = {};
    const viewports = engine.getViewports();

    viewports.forEach(viewport => {
      if (this.isMPRViewport(viewport.id)) {
        try {
          const camera = viewport.getCamera();
          if (camera && camera.focalPoint) {
            focalPoints[viewport.id] = camera.focalPoint;
          }
        } catch (error) {
          console.error(`❌ Error getting focal point for ${viewport.id}:`, error);
        }
      }
    });

    return focalPoints;
  }

  // Get crosshairs tool center for all MPR viewports
  getCrosshairsToolCenter(): Record<string, { center: number[] | null; isActive: boolean }> {
    const engine = this.getEngine();
    if (!engine) {
      return {};
    }

    const result: Record<string, { center: number[] | null; isActive: boolean }> = {};

    try {
      const viewports = engine.getViewports();

      viewports.forEach(viewport => {
        if (this.isMPRViewport(viewport.id)) {
          try {
            // Find the tool group for this viewport using the ToolGroupManager
            const toolGroup = ToolGroupManager.getToolGroupForViewport(
              viewport.id,
              engine.id
            );

            if (!toolGroup) {
              result[viewport.id] = {
                center: null,
                isActive: false,
              };
              return;
            }

            // Get the Crosshairs tool instance from the tool group
            const crosshairsTool = toolGroup.getToolInstance('Crosshairs');

            // Check if crosshairs tool is available and active
            const isActive = crosshairsTool && crosshairsTool.mode === 'Active';

            if (!crosshairsTool) {
              result[viewport.id] = {
                center: null,
                isActive: false,
              };
              return;
            }

            // Get annotations for the crosshairs tool
            const element = viewport.element;
            if (!element) {
              result[viewport.id] = {
                center: null,
                isActive: !!isActive,
              };
              return;
            }

            const annotations = annotation.state.getAnnotations('Crosshairs', element);

            // Get the center from the first annotation (crosshairs typically has one annotation per viewport)
            let center = null;
            if (annotations && annotations.length > 0) {
              const firstAnnotation = annotations[0];
              // The center is typically stored in data.handles.rotationPoints or data.handles.toolCenter
              if (firstAnnotation.data?.handles?.rotationPoints) {
                center = firstAnnotation.data.handles.rotationPoints[0]; // World coordinates
              } else if (firstAnnotation.data?.handles?.toolCenter) {
                center = firstAnnotation.data.handles.toolCenter;
              }
            }

            result[viewport.id] = {
              center: center ? [center[0], center[1], center[2]] : null,
              isActive: !!isActive,
            };

          } catch (error) {
            console.error(`❌ Error getting crosshairs center for ${viewport.id}:`, error);
            result[viewport.id] = {
              center: null,
              isActive: false,
            };
          }
        }
      });

    } catch (error) {
      console.error('❌ Error accessing Cornerstone Tools:', error);
    }

    return result;
  }
}

export default ViewportStateService;
