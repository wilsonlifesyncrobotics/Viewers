import SUPPORTED_TOOLS from './constants/supportedTools';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';

const FiducialMarker = {
  toAnnotation: measurement => {},

  toMeasurement: (
    csToolsEventDetail,
    displaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;
    const isLocked = getIsLocked(annotationUID);
    const isVisible = getIsVisible(annotationUID);

    if (!metadata || !data) {
      console.warn('FiducialMarker tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;
    const validToolType = toolName === 'FiducialMarker';

    if (!validToolType) {
      console.warn('FiducialMarker: Invalid tool type');
      return null;
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    }

    const { points } = data.handles;
    const point = points[0]; // [x, y, z]

    // Debug: Log the raw point structure
    console.log('🔍 FiducialMarker toMeasurement - received point:', point);

    // Convert to numbers (they should already be numbers from storage)
    const x = Number(point[0]);
    const y = Number(point[1]);
    const z = Number(point[2]);

    console.log('🔍 Converted to numbers:', { x, y, z });

    // Format coordinates for display
    const displayText = {
      primary: [data.label || 'Fiducial'],
      secondary: [
        `X: ${x.toFixed(2)} mm`,
        `Y: ${y.toFixed(2)} mm`,
        `Z: ${z.toFixed(2)} mm`,
      ],
    };

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      isLocked,
      isVisible,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      referencedImageId,
      frameNumber: 1,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet?.displaySetInstanceUID,
      label: data.label,
      displayText: displayText,
      data: {
        radius: data.radius,
        coordinates: {
          x: x,
          y: y,
          z: z,
        },
      },
      type: getValueTypeFromToolType(toolName),
      getReport: () => _getReport([x, y, z], FrameOfReferenceUID, data.label),
    };
  },
};

function _getReport(coordinates, FrameOfReferenceUID, label) {
  const columns = [];
  const values = [];

  // Add Type
  columns.push('AnnotationType');
  values.push('Cornerstone:FiducialMarker');

  columns.push('Label');
  values.push(label || 'Fiducial');

  if (coordinates && coordinates.length === 3) {
    const x = Number(coordinates[0]);
    const y = Number(coordinates[1]);
    const z = Number(coordinates[2]);

    columns.push('X (mm)');
    values.push(x.toFixed(2));

    columns.push('Y (mm)');
    values.push(y.toFixed(2));

    columns.push('Z (mm)');
    values.push(z.toFixed(2));
  }

  if (FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(FrameOfReferenceUID);
  }

  return {
    columns,
    values,
  };
}

export default FiducialMarker;
