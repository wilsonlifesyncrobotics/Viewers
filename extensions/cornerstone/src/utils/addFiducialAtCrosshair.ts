/**
 * Add Fiducial Marker at Current Crosshair Position
 *
 * Places a 3D sphere annotation at the current crosshair location
 * Better UX: Navigate with crosshairs first, then click to place marker
 */

import { annotation } from '@cornerstonejs/tools';
import { getRenderingEngine, utilities as csUtils } from '@cornerstonejs/core';

/**
 * Add a fiducial marker at the current crosshair position
 */
export function addFiducialAtCrosshair(servicesManager: any): boolean {
  try {
    console.log('📍 Adding fiducial at crosshair position...');

    // Get rendering engine
    const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
    if (!renderingEngine || renderingEngine.getViewports().length === 0) {
      console.warn('⚠️ No rendering engine or viewports found');
      return false;
    }

    // Find crosshair position from annotation
    let crosshairPosition = null;
    let element = null;

    for (const viewport of renderingEngine.getViewports()) {
      try {
        const vpElement = viewport.element;
        if (!vpElement) continue;

        const annotations = annotation.state.getAnnotations('Crosshairs', vpElement);
        if (annotations && annotations.length > 0) {
          const crosshairAnnotation = annotations[0];

          // Get position from toolCenter (the actual crosshair center, NOT rotation handles)
          if (crosshairAnnotation.data?.handles?.toolCenter) {
            crosshairPosition = crosshairAnnotation.data.handles.toolCenter;
            element = vpElement;
            console.log(`📍 Found crosshair CENTER from toolCenter in viewport: ${viewport.id}`);
            console.log(`📍 Raw toolCenter:`, crosshairPosition);
            break;
          } else if (crosshairAnnotation.data?.handles?.rotationPoints) {
            // Fallback to rotationPoints (but this is NOT the center, it's a rotation handle!)
            crosshairPosition = crosshairAnnotation.data.handles.rotationPoints[0];
            element = vpElement;
            console.log(`⚠️ Using rotationPoints[0] (NOT CENTER!) in viewport: ${viewport.id}`);
            console.log(`📍 Raw rotationPoints[0]:`, crosshairPosition);
            break;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error getting crosshair from ${viewport.id}:`, error);
      }
    }

    // Fallback to first viewport's camera focal point
    if (!crosshairPosition) {
      console.warn('⚠️ No crosshair found, using camera focal point');
      const firstViewport = renderingEngine.getViewports()[0];
      const camera = firstViewport.getCamera();
      crosshairPosition = camera.focalPoint;
      element = firstViewport.element;
    }

    if (!crosshairPosition || !element) {
      console.error('❌ Could not determine position for fiducial');
      return false;
    }

    // Extract the actual position from crosshairPosition
    // toolCenter should be a simple [x, y, z] array
    // rotationPoints[0] is a complex Array(4) structure
    console.log('🔍 RAW crosshairPosition:', crosshairPosition);
    console.log('🔍 Is Array?', Array.isArray(crosshairPosition));
    console.log('🔍 Length:', crosshairPosition?.length);

    let position;

    if (Array.isArray(crosshairPosition)) {
      if (crosshairPosition.length === 3 && typeof crosshairPosition[0] === 'number') {
        // toolCenter: Simple [x, y, z] array
        position = crosshairPosition;
        console.log('✅ Using toolCenter directly (simple [x, y, z]):', position);
      } else if (Array.isArray(crosshairPosition[0])) {
        // rotationPoints[0]: Complex Array(4) where [0] contains [x, y, z]
        position = crosshairPosition[0];
        console.log('✅ Extracted from rotationPoints[0][0] (complex structure):', position);
      } else {
        // Fallback
        position = [crosshairPosition[0], crosshairPosition[1], crosshairPosition[2]];
        console.log('✅ Extracted via indices:', position);
      }
    } else {
      console.error('❌ crosshairPosition is not an array!');
      return false;
    }

    console.log(`✅ Final position (RAS world coords): X=${position[0]}, Y=${position[1]}, Z=${position[2]}`);
    console.log(`   (X=Left-Right, Y=Anterior-Posterior, Z=Superior-Inferior)`);

    // Debug: Check all viewports to see if crosshair positions differ
    console.log('🔍 Checking crosshair positions in all viewports:');
    for (const vp of renderingEngine.getViewports()) {
      try {
        const vpElement = vp.element;
        const vpAnnotations = annotation.state.getAnnotations('Crosshairs', vpElement);
        if (vpAnnotations && vpAnnotations.length > 0) {
          const vpCrosshair = vpAnnotations[0];
          const vpRotPoints = vpCrosshair.data?.handles?.rotationPoints;

          console.log(`  [${vp.id}] rotationPoints structure:`, vpRotPoints);

          const vpPos = vpRotPoints?.[0]?.[0] || vpCrosshair.data?.handles?.toolCenter;
          if (vpPos) {
            console.log(`  [${vp.id}] Position: X=${vpPos[0]?.toFixed?.(1) || vpPos[0]}, Y=${vpPos[1]?.toFixed?.(1) || vpPos[1]}, Z=${vpPos[2]?.toFixed?.(1) || vpPos[2]}`);
          }
        }
      } catch (e) {
        console.warn(`  [${vp.id}] Error:`, e.message);
      }
    }

    // Get existing fiducials to determine next label
    const existingFiducials = annotation.state.getAnnotations('FiducialMarker', element);
    const fiducialCount = existingFiducials ? existingFiducials.length : 0;
    const label = `F${fiducialCount + 1}`;

    // Get viewport info for metadata
    const viewport = renderingEngine.getViewports().find(vp => vp.element === element);
    if (!viewport) {
      console.error('❌ Could not find viewport for element');
      return false;
    }

    const frameOfReferenceUID = viewport.getFrameOfReferenceUID();
    const camera = viewport.getCamera();

    // Get referencedImageId from viewport
    let referencedImageId = '';
    try {
      if (viewport.type === 'orthographic' || viewport.type === 'volume3d') {
        // For volume viewports, get the current imageId
        const imageIds = (viewport as any).getImageIds?.();
        if (imageIds && imageIds.length > 0) {
          referencedImageId = imageIds[0];
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not get referencedImageId:', error);
    }

    // Create fiducial annotation (use simple sphere rendering approach)
    const fiducialAnnotation: any = {
      annotationUID: csUtils.uuidv4(),
      highlighted: true,
      invalidated: false,  // ✅ Must be false to render
      isLocked: false,
      isVisible: true,
      metadata: {
        viewPlaneNormal: camera.viewPlaneNormal || [0, 0, 1],
        viewUp: camera.viewUp || [0, -1, 0],
        FrameOfReferenceUID: frameOfReferenceUID,
        referencedImageId: referencedImageId,
        toolName: 'FiducialMarker',
      },
      data: {
        label: label,
        handles: {
          // Store as proper numeric array (ensure it's a clean [x, y, z] array)
          points: [[
            parseFloat(position[0]),
            parseFloat(position[1]),
            parseFloat(position[2])
          ]],
        },
        radius: 0.5, // Fixed 0.5mm circle
        cachedStats: {},  // Required for measurement service
      },
    };

    // Add to annotation state
    annotation.state.addAnnotation(fiducialAnnotation, element);

    const x = parseFloat(position[0]);
    const y = parseFloat(position[1]);
    const z = parseFloat(position[2]);
    console.log(`✅ Added ${label} at world coordinates: [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}] mm`);
    console.log('🔍 Stored points array:', fiducialAnnotation.data.handles.points);

    // Force render all viewports
    const allViewports = renderingEngine.getViewports();
    allViewports.forEach(vp => {
      try {
        vp.render();
      } catch (error) {
        console.warn('⚠️ Error rendering viewport:', error);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error adding fiducial:', error);
    return false;
  }
}

export default addFiducialAtCrosshair;
