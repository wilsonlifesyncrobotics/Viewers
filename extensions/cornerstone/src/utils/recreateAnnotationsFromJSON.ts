/**
 * Recreate Cornerstone3D annotations from saved JSON measurement data
 */

import { annotation } from '@cornerstonejs/tools';
import { utilities as csUtils } from '@cornerstonejs/core';
import { getRenderingEngine } from '@cornerstonejs/core';

/**
 * Recreate annotations from JSON measurement data
 * @param {Object} savedData - Parsed JSON measurement data
 * @param {Object} servicesManager - OHIF services manager
 * @returns {Promise<number>} Number of annotations recreated
 */
export async function recreateAnnotationsFromJSON(savedData, servicesManager) {
  if (!savedData || !savedData.measurements || savedData.measurements.length === 0) {
    console.warn('⚠️ No measurements to recreate');
    return 0;
  }

  const { measurementService } = servicesManager.services;
  const measurements = savedData.measurements;
  
  console.log(`🔄 Recreating ${measurements.length} annotations...`);
  
  let recreatedCount = 0;

  // Get rendering engine and viewports
  const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
  if (!renderingEngine) {
    console.error('❌ No rendering engine found');
    return 0;
  }

  const viewports = renderingEngine.getViewports();
  if (!viewports || viewports.length === 0) {
    console.error('❌ No viewports found');
    return 0;
  }

  // Get the first viewport element for annotation state
  const viewport = viewports[0];
  const element = viewport.element;

  // Process each measurement
  for (const measurement of measurements) {
    try {
      const success = await recreateSingleAnnotation(measurement, element, measurementService);
      if (success) {
        recreatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error recreating measurement ${measurement.label}:`, error);
    }
  }

  // Trigger viewport rendering
  viewports.forEach(vp => vp.render());

  console.log(`✅ Recreated ${recreatedCount}/${measurements.length} annotations`);
  return recreatedCount;
}

/**
 * Recreate a single annotation
 */
async function recreateSingleAnnotation(measurement, element, measurementService) {
  const { type, label, points, data } = measurement;

  console.log(`🔹 Recreating ${type}: ${label}`);

  // Create annotation based on type
  switch (type) {
    case 'FiducialMarker':
      return recreateFiducialMarker(measurement, element, measurementService);
    
    case 'Length':
      return recreateLength(measurement, element, measurementService);
    
    case 'Bidirectional':
      return recreateBidirectional(measurement, element, measurementService);
    
    // Add more types as needed
    default:
      console.warn(`⚠️ Unknown measurement type: ${type}`);
      return false;
  }
}

/**
 * Recreate a FiducialMarker annotation
 */
function recreateFiducialMarker(measurement, element, measurementService) {
  const { label, points, SOPInstanceUID, FrameOfReferenceUID, referenceSeriesUID, referenceStudyUID } = measurement;

  if (!points || points.length === 0) {
    console.error('❌ No points data for fiducial');
    return false;
  }

  const point = points[0]; // Fiducial has one point

  // Create the annotation structure
  const annotationUID = csUtils.uuidv4();
  const fiducialAnnotation = {
    annotationUID,
    highlighted: false,
    invalidated: false,
    isLocked: false,
    isVisible: true,
    metadata: {
      toolName: 'FiducialMarker',
      FrameOfReferenceUID: FrameOfReferenceUID || '',
      referencedImageId: ``, // Will be set by viewport
    },
    data: {
      label: label || 'Fiducial',
      handles: {
        points: [[
          parseFloat(point[0]),
          parseFloat(point[1]),
          parseFloat(point[2])
        ]],
      },
      cachedStats: {},
    },
  };

  // Add to annotation state
  annotation.state.addAnnotation(fiducialAnnotation, element);

  console.log(`  ✓ Added fiducial: ${label} at [${point[0]}, ${point[1]}, ${point[2]}]`);
  return true;
}

/**
 * Recreate a Length annotation
 */
function recreateLength(measurement, element, measurementService) {
  const { label, points, SOPInstanceUID, FrameOfReferenceUID } = measurement;

  if (!points || points.length < 2) {
    console.error('❌ Length requires 2 points');
    return false;
  }

  const annotationUID = csUtils.uuidv4();
  const lengthAnnotation = {
    annotationUID,
    highlighted: false,
    invalidated: false,
    isLocked: false,
    isVisible: true,
    metadata: {
      toolName: 'Length',
      FrameOfReferenceUID: FrameOfReferenceUID || '',
      referencedImageId: ``,
    },
    data: {
      label: label || 'Length',
      handles: {
        points: [
          [parseFloat(points[0][0]), parseFloat(points[0][1]), parseFloat(points[0][2])],
          [parseFloat(points[1][0]), parseFloat(points[1][1]), parseFloat(points[1][2])]
        ],
        activeHandleIndex: null,
        textBox: {
          hasMoved: false,
        },
      },
      cachedStats: {},
    },
  };

  annotation.state.addAnnotation(lengthAnnotation, element);

  console.log(`  ✓ Added length: ${label}`);
  return true;
}

/**
 * Recreate a Bidirectional annotation
 */
function recreateBidirectional(measurement, element, measurementService) {
  const { label, points, SOPInstanceUID, FrameOfReferenceUID } = measurement;

  if (!points || points.length < 4) {
    console.error('❌ Bidirectional requires 4 points');
    return false;
  }

  const annotationUID = csUtils.uuidv4();
  const bidirectionalAnnotation = {
    annotationUID,
    highlighted: false,
    invalidated: false,
    isLocked: false,
    isVisible: true,
    metadata: {
      toolName: 'Bidirectional',
      FrameOfReferenceUID: FrameOfReferenceUID || '',
      referencedImageId: ``,
    },
    data: {
      label: label || 'Bidirectional',
      handles: {
        points: points.map(p => [parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2])]),
        activeHandleIndex: null,
        textBox: {
          hasMoved: false,
        },
      },
      cachedStats: {},
    },
  };

  annotation.state.addAnnotation(bidirectionalAnnotation, element);

  console.log(`  ✓ Added bidirectional: ${label}`);
  return true;
}

export default recreateAnnotationsFromJSON;

