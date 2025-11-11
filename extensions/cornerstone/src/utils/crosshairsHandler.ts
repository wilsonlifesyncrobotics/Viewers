import { getRenderingEngines } from '@cornerstonejs/core';
import { ToolGroupManager, annotation } from '@cornerstonejs/tools';

/**
 * Crosshair data structure
 */
export interface CrosshairData {
  center: [number, number, number] | null;
  isActive: boolean;
  viewportId?: string;
}

/**
 * Cached crosshair information
 * Since crosshairs share a single world coordinate across all viewports,
 * we only need to cache one global reference
 */
interface CrosshairGlobalCache {
  center: [number, number, number] | null;
  isActive: boolean;
  toolGroup: any;
  crosshairsTool: any;
  lastChecked: number;
}

/**
 * CrosshairsHandler - Simplified utility for handling Crosshairs tool
 *
 * Features:
 * - Caches the single shared crosshair center (world coordinate)
 * - No per-viewport caching needed since all viewports share the same point
 * - Provides simple API to get crosshair center
 * - Handles both array [x,y,z] and object {x,y,z} formats
 * - Auto-refreshes cache when stale
 */
class CrosshairsHandler {
  private globalCache: CrosshairGlobalCache | null = null;
  private readonly CACHE_TTL = 5000; // 5 seconds cache validity

  /**
   * Get the shared crosshair center (world coordinate)
   * Since crosshairs use a single shared point across all viewports,
   * this returns the same center regardless of which viewport you query
   */
  public getCrosshairCenter(viewportId?: string): CrosshairData {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (this.globalCache && (now - this.globalCache.lastChecked) < this.CACHE_TTL) {
        return {
          center: this.globalCache.center,
          isActive: this.globalCache.isActive,
          viewportId,
        };
      }

      // Cache is stale or doesn't exist - fetch fresh data
      this._refreshGlobalCache();

      return {
        center: this.globalCache?.center || null,
        isActive: this.globalCache?.isActive || false,
        viewportId,
      };

    } catch (error) {
      console.warn(`⚠️ [CrosshairsHandler] Error getting crosshair center:`, error.message);
      return {
        center: null,
        isActive: false,
        viewportId,
      };
    }
  }

  /**
   * Get crosshair centers for multiple viewports
   * Note: Since all viewports share the same world coordinate,
   * this returns the same center for each viewport
   */
  public getCrosshairCenters(viewportIds: string[]): Record<string, CrosshairData> {
    const result: Record<string, CrosshairData> = {};

    // Get the shared center once
    const sharedCenter = this.getCrosshairCenter();

    // Return same center for all viewports
    for (const viewportId of viewportIds) {
      result[viewportId] = {
        ...sharedCenter,
        viewportId,
      };
    }

    return result;
  }

  /**
   * Get crosshair centers for all MPR viewports
   * Note: Since all viewports share the same world coordinate,
   * this returns the same center for each MPR viewport
   */
  public getAllMPRCrosshairCenters(): Record<string, CrosshairData> {
    const MPR_VIEWPORT_IDS = ['mpr-axial', 'mpr-sagittal', 'mpr-coronal'];
    const result: Record<string, CrosshairData> = {};

    // Get the shared center once
    const sharedCenter = this.getCrosshairCenter();

    // Find all MPR viewports
    const renderingEngines = getRenderingEngines();

    for (const engine of renderingEngines) {
      const viewports = engine.getViewports();

      for (const viewport of viewports) {
        // Check if this is an MPR viewport
        const isMPR = MPR_VIEWPORT_IDS.some(id => viewport.id.includes(id));

        if (isMPR) {
          result[viewport.id] = {
            ...sharedCenter,
            viewportId: viewport.id,
          };
        }
      }
    }

    return result;
  }

  /**
   * Clear the global cache
   */
  public clearCache(): void {
    this.globalCache = null;
  }

  /**
   * Refresh the global cache by finding any viewport with crosshairs
   * and extracting the shared world coordinate
   * @private
   */
  private _refreshGlobalCache(): void {
    try {
      const renderingEngines = getRenderingEngines();

      // Track all tool groups and crosshair tools found (for debugging)
      let toolsFound = 0;
      let activeTools = 0;
      let annotationsFound = 0;

      // Search through all rendering engines and viewports to find crosshairs tool
      for (const engine of renderingEngines) {
        const viewports = engine.getViewports();

        for (const viewport of viewports) {
          try {
            // Skip if viewport doesn't have an element
            if (!viewport.element) {
              continue;
            }

            // Get tool group for this viewport
            const toolGroup = ToolGroupManager.getToolGroupForViewport(
              viewport.id,
              engine.id
            );

            if (!toolGroup) {
              continue;
            }

            // Get the Crosshairs tool instance
            const crosshairsTool = toolGroup.getToolInstance('Crosshairs');

            if (!crosshairsTool) {
              continue;
            }

            toolsFound++;

            // Check if crosshairs tool is active
            const isActive = crosshairsTool.mode === 'Active';

            if (isActive) {
              activeTools++;
            }

            if (!isActive) {
              // Tool exists but not active - but keep searching other viewports
              // Don't return yet, there might be an active one in another viewport
              continue;
            }

            // Get annotations for the crosshairs tool
            const annotations = annotation.state.getAnnotations('Crosshairs', viewport.element);

            if (annotations && annotations.length > 0) {
              annotationsFound++;
            }

            // Extract center from the first annotation
            const center = this._extractCenterFromAnnotations(annotations);

            if (center) {
              // Found valid center! Cache it and return
              this.globalCache = {
                center,
                isActive: true,
                toolGroup,
                crosshairsTool,
                lastChecked: Date.now(),
              };

              console.log(`✅ [CrosshairsHandler] Found active crosshairs in ${viewport.id}`);
              return;
            }

          } catch (e) {
            // Error with this viewport, try next one
            continue;
          }
        }
      }

      // If we get here, we didn't find a valid crosshair center
      console.log(`📊 [CrosshairsHandler] Search complete: ${toolsFound} tools found, ${activeTools} active, ${annotationsFound} with annotations`);

      // Decide on cache state based on what we found
      if (activeTools > 0) {
        // Tool is active but no center found
        this.globalCache = {
          center: null,
          isActive: true,  // Tool is active, just no position yet
          toolGroup: null,
          crosshairsTool: null,
          lastChecked: Date.now(),
        };
        console.warn(`⚠️ [CrosshairsHandler] Crosshairs tool active but no center found`);
      } else if (toolsFound > 0) {
        // Tool exists but not active
        this.globalCache = {
          center: null,
          isActive: false,
          toolGroup: null,
          crosshairsTool: null,
          lastChecked: Date.now(),
        };
        console.warn(`⚠️ [CrosshairsHandler] Crosshairs tool found but not active`);
      } else {
        // No tool found at all
        this.globalCache = {
          center: null,
          isActive: false,
          toolGroup: null,
          crosshairsTool: null,
          lastChecked: Date.now(),
        };
        console.warn(`⚠️ [CrosshairsHandler] No Crosshairs tool found in any viewport`);
      }

    } catch (error) {
      console.warn(`⚠️ [CrosshairsHandler] Error refreshing global cache:`, error.message);
      this.globalCache = {
        center: null,
        isActive: false,
        toolGroup: null,
        crosshairsTool: null,
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Extract center coordinates from crosshair annotations
   * Handles both array [x,y,z] and object {x,y,z} formats
   * Tries multiple possible annotation data locations
   * @private
   */
  private _extractCenterFromAnnotations(annotations: any[]): [number, number, number] | null {
    if (!annotations || annotations.length === 0) {
      return null;
    }

    const firstAnnotation = annotations[0];

    // Try multiple possible locations for the center point
    const possiblePaths = [
      // Most common locations
      () => firstAnnotation.data?.handles?.rotationPoints?.[0],
      () => firstAnnotation.data?.handles?.toolCenter,
      () => firstAnnotation.data?.handles?.activeHandleIndex !== undefined &&
            firstAnnotation.data?.handles?.points?.[0],

      // Alternative locations
      () => firstAnnotation.data?.handles?.center,
      () => firstAnnotation.data?.cachedStats?.projectionPoints?.[0],
      () => firstAnnotation.metadata?.toolCenter,

      // Direct data access
      () => firstAnnotation.data?.center,
      () => firstAnnotation.handles?.rotationPoints?.[0],
      () => firstAnnotation.handles?.toolCenter,
    ];

    // Try each path until we find valid data
    for (const getPath of possiblePaths) {
      try {
        const rawPoint = getPath();
        if (rawPoint) {
          const normalizedPoint = this._normalizePoint(rawPoint);
          if (normalizedPoint) {
            console.log(`✅ [CrosshairsHandler] Found center in annotation data`);
            return normalizedPoint;
          }
        }
      } catch (e) {
        // Path failed, try next one
        continue;
      }
    }

    // Debug: log annotation structure if we couldn't find the center
    console.warn(`⚠️ [CrosshairsHandler] Could not extract center from annotation`);
    console.log(`📋 Annotation structure:`, {
      hasData: !!firstAnnotation.data,
      hasHandles: !!firstAnnotation.data?.handles,
      handleKeys: firstAnnotation.data?.handles ? Object.keys(firstAnnotation.data.handles) : [],
      hasMetadata: !!firstAnnotation.metadata,
    });

    return null;
  }

  /**
   * Normalize point from either array [x,y,z] or object {x,y,z} format
   * Validates that coordinates are actual numbers
   * @private
   */
  private _normalizePoint(point: any): [number, number, number] | null {
    if (!point) {
      return null;
    }

    let coords: [number, number, number] | null = null;

    // Handle array format
    if (Array.isArray(point) && point.length >= 3) {
      coords = [point[0], point[1], point[2]];
    }
    // Handle object format
    else if (typeof point === 'object' && 'x' in point && 'y' in point && 'z' in point) {
      coords = [point.x, point.y, point.z];
    }

    // Validate coordinates are actual numbers
    if (coords) {
      if (
        typeof coords[0] === 'number' && !isNaN(coords[0]) &&
        typeof coords[1] === 'number' && !isNaN(coords[1]) &&
        typeof coords[2] === 'number' && !isNaN(coords[2])
      ) {
        return coords;
      } else {
        console.warn(`⚠️ [CrosshairsHandler] Point has invalid number values:`, coords);
        return null;
      }
    }

    return null;
  }
}

// Export singleton instance
export const crosshairsHandler = new CrosshairsHandler();

// Export class for testing or custom instances
export default CrosshairsHandler;
