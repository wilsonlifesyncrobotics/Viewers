import { Enums, eventTarget, getRenderingEngine } from '@cornerstonejs/core';

// =========================================================================
// CORNERSTONE 3 PERFORMANCE LOGGER - WORKING VERSION
// =========================================================================
// Uses Cornerstone 3's native APIs and direct canvas monitoring
// =========================================================================

console.log('🔷 [PERF LOGGER] Module loading - Cornerstone 3 native version');

const globalRenderTimeTracker = new Map();
const viewportFpsElements = new Map();
const monitoredViewports = new Set();
const MAX_FRAMES = 20;

/**
 * Create or update FPS display
 */
function createOrUpdateFpsDisplay(viewportId, fps, frameTime) {
  let fpsElement = viewportFpsElements.get(viewportId);

  if (!fpsElement) {
    const viewportElement = document.querySelector(`[data-viewport-uid="${viewportId}"]`);

    if (!viewportElement) {
      console.warn('🔷 [PERF LOGGER] Viewport element not found:', viewportId);
      return;
    }

    fpsElement = document.createElement('div');
    fpsElement.className = 'fps-performance-overlay';
    fpsElement.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      user-select: none;
      border: 2px solid rgba(0, 255, 0, 0.6);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(4px);
    `;

    const overlayContainer = 
      viewportElement.querySelector('.viewport-overlay-container') ||
      viewportElement;

    overlayContainer.appendChild(fpsElement);
    viewportFpsElements.set(viewportId, fpsElement);

    console.log('🔷 [PERF LOGGER] ✅ FPS display created for:', viewportId);
  }

  const color = fps >= 55 ? '#00ff00' : fps >= 40 ? '#ffff00' : '#ff0000';
  fpsElement.style.color = color;
  fpsElement.style.borderColor = color.replace(')', ', 0.6)').replace('rgb', 'rgba');

  fpsElement.innerHTML = `
    <div style="line-height: 1.5;">
      <div style="font-size: 18px; margin-bottom: 3px;">⚡ ${fps} FPS</div>
      <div style="font-size: 12px; opacity: 0.9;">⏱️ ${frameTime.toFixed(1)}ms</div>
    </div>
  `;
}

/**
 * Monitor viewport using requestAnimationFrame
 */
function monitorViewportFPS(viewportId) {
  if (monitoredViewports.has(viewportId)) {
    return; // Already monitoring
  }

  console.log('🔷 [PERF LOGGER] Starting FPS monitoring for:', viewportId);
  monitoredViewports.add(viewportId);

  let tracker = {
    lastRenderTime: performance.now(),
    frameTimeHistory: [],
    lastPixelData: null,
  };

  function checkForRender() {
    // Try to get the viewport canvas
    const viewportElement = document.querySelector(`[data-viewport-uid="${viewportId}"]`);
    if (!viewportElement) {
      console.warn('🔷 [PERF LOGGER] Viewport element lost:', viewportId);
      monitoredViewports.delete(viewportId);
      return;
    }

    const canvas = viewportElement.querySelector('canvas');
    if (!canvas) {
      requestAnimationFrame(checkForRender);
      return;
    }

    try {
      // Check if canvas content changed (new render)
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const currentPixelData = ctx.getImageData(
        canvas.width / 2, 
        canvas.height / 2, 
        1, 
        1
      ).data;

      const pixelSignature = Array.from(currentPixelData).join(',');

      if (tracker.lastPixelData !== null && tracker.lastPixelData !== pixelSignature) {
        // Canvas changed - new render happened!
        const currentTime = performance.now();
        const deltaTime = currentTime - tracker.lastRenderTime;
        tracker.lastRenderTime = currentTime;

        tracker.frameTimeHistory.push(deltaTime);
        if (tracker.frameTimeHistory.length > MAX_FRAMES) {
          tracker.frameTimeHistory.shift();
        }

        if (tracker.frameTimeHistory.length >= 3) {
          const totalDeltaTime = tracker.frameTimeHistory.reduce((a, b) => a + b, 0);
          const averageFrameTime = totalDeltaTime / tracker.frameTimeHistory.length;
          const calculatedFPS = Math.round(1000 / averageFrameTime);

          console.log(`📊 [PERF LOGGER] [${viewportId}] FPS: ${calculatedFPS} | Frame: ${averageFrameTime.toFixed(2)}ms`);
          createOrUpdateFpsDisplay(viewportId, calculatedFPS, averageFrameTime);
        }
      }

      tracker.lastPixelData = pixelSignature;

    } catch (error) {
      // Ignore errors (canvas might be tainted or not ready)
    }

    requestAnimationFrame(checkForRender);
  }

  checkForRender();
  console.log('🔷 [PERF LOGGER] ✅ Monitoring started for:', viewportId);
}

/**
 * Alternative: Use Cornerstone eventTarget
 */
function attachCornerstoneEventListeners() {
  console.log('🔷 [PERF LOGGER] Attaching to Cornerstone eventTarget');

  const renderingEngineId = 'OHIFCornerstoneRenderingEngine'; // Common OHIF rendering engine ID

  // Listen for IMAGE_RENDERED events on eventTarget
  const events = [
    Enums.Events.IMAGE_RENDERED,
    Enums.Events.STACK_VIEWPORT_NEW_IMAGE,
    Enums.Events.VOLUME_VIEWPORT_NEW_IMAGE,
  ];

  events.forEach(eventType => {
    eventTarget.addEventListener(eventType, (evt) => {
      const { viewportId, renderingEngineId } = evt.detail;

      if (!viewportId) return;

      console.log(`🔷 [PERF LOGGER] Cornerstone event: ${eventType} for ${viewportId}`);

      let tracker = globalRenderTimeTracker.get(viewportId) || {
        lastRenderTime: performance.now(),
        frameTimeHistory: [],
      };

      const currentTime = performance.now();
      const deltaTime = currentTime - tracker.lastRenderTime;
      tracker.lastRenderTime = currentTime;

      tracker.frameTimeHistory.push(deltaTime);
      if (tracker.frameTimeHistory.length > MAX_FRAMES) {
        tracker.frameTimeHistory.shift();
      }

      if (tracker.frameTimeHistory.length >= 3) {
        const totalDeltaTime = tracker.frameTimeHistory.reduce((a, b) => a + b, 0);
        const averageFrameTime = totalDeltaTime / tracker.frameTimeHistory.length;
        const calculatedFPS = Math.round(1000 / averageFrameTime);

        console.log(`📊 [PERF LOGGER] [${viewportId}] FPS: ${calculatedFPS} | Frame: ${averageFrameTime.toFixed(2)}ms`);
        createOrUpdateFpsDisplay(viewportId, calculatedFPS, averageFrameTime);
      }

      globalRenderTimeTracker.set(viewportId, tracker);
    });
  });

  console.log('🔷 [PERF LOGGER] ✅ EventTarget listeners attached');
}

/**
 * Watch for viewports and start monitoring
 */
function watchForViewports() {
  console.log('🔷 [PERF LOGGER] Starting viewport watcher');

  const observer = new MutationObserver((mutations) => {
    const viewports = document.querySelectorAll('[data-viewport-uid]');
    viewports.forEach((viewport) => {
      const viewportId = viewport.getAttribute('data-viewport-uid');
      if (viewportId && !monitoredViewports.has(viewportId)) {
        console.log('🔷 [PERF LOGGER] New viewport detected:', viewportId);

        // Wait a bit for canvas to be ready
        setTimeout(() => {
          monitorViewportFPS(viewportId);
        }, 500);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check for existing viewports
  setTimeout(() => {
    const existingViewports = document.querySelectorAll('[data-viewport-uid]');
    console.log('🔷 [PERF LOGGER] Checking existing viewports:', existingViewports.length);
    existingViewports.forEach(vp => {
      const id = vp.getAttribute('data-viewport-uid');
      console.log('🔷 [PERF LOGGER] Found existing viewport:', id);
      if (!monitoredViewports.has(id)) {
        setTimeout(() => {
          monitorViewportFPS(id);
        }, 500);
      }
    });
  }, 1000);
}

/**
 * Auto-initialize
 */
function autoInit() {
  console.log('🔷 [PERF LOGGER] ===== Cornerstone 3 Native Version =====');
  console.log('🔷 [PERF LOGGER] Auto-initializing...');

  try {
    // Method 1: Use Cornerstone eventTarget (preferred)
    // attachCornerstoneEventListeners();

    // Method 2: Direct canvas monitoring (fallback)
    watchForViewports();

    console.log('🔷 [PERF LOGGER] ✅ Initialization complete');
    console.log('🔷 [PERF LOGGER] Using dual monitoring: EventTarget + Canvas');
  } catch (error) {
    console.error('🔷 [PERF LOGGER] ❌ Error during init:', error);
  }
}

autoInit();

export { autoInit as autoInitPerformanceLogging };
