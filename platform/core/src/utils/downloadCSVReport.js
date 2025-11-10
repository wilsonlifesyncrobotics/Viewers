import { DicomMetadataStore } from '../services/DicomMetadataStore/DicomMetadataStore';
import formatPN from './formatPN';

export default function downloadCSVReport(measurementData) {
  if (measurementData.length === 0) {
    // Prevent download of report with no measurements.
    return;
  }

  const columns = [
    'Patient ID',
    'Patient Name',
    'StudyInstanceUID',
    'SeriesInstanceUID',
    'SOPInstanceUID',
    'Label',
  ];

  const reportMap = {};
  measurementData.forEach(measurement => {
    const { referenceStudyUID, referenceSeriesUID, getReport, uid } = measurement;

    if (!getReport) {
      console.warn('Measurement does not have a getReport function');
      return;
    }

    const seriesMetadata = DicomMetadataStore.getSeries(referenceStudyUID, referenceSeriesUID);

    const commonRowItems = _getCommonRowItems(measurement, seriesMetadata);
    const report = getReport(measurement);

    reportMap[uid] = {
      report,
      commonRowItems,
    };
  });

  // get columns names inside the report from each measurement and
  // add them to the rows array (this way we can add columns for any custom
  // measurements that may be added in the future)
  Object.keys(reportMap).forEach(id => {
    const { report } = reportMap[id];
    report.columns.forEach(column => {
      if (!columns.includes(column)) {
        columns.push(column);
      }
    });
  });

  const results = _mapReportsToRowArray(reportMap, columns);

  // Generate CSV content (without data URI prefix for saving)
  const csvRows = results.map(res => res.join(',')).join('\n');
  let csvContent = 'data:text/csv;charset=utf-8,' + csvRows;

  // Download CSV to browser (existing behavior)
  _createAndDownloadFile(csvContent);

  // Also save to syncforge directory structure
  _saveCSVToSurgicalCase(csvRows, measurementData);
}

function _mapReportsToRowArray(reportMap, columns) {
  const results = [columns];
  Object.keys(reportMap).forEach(id => {
    const { report, commonRowItems } = reportMap[id];
    const row = [];
    // For commonRowItems, find the correct index and add the value to the
    // correct row in the results array
    Object.keys(commonRowItems).forEach(key => {
      const index = columns.indexOf(key);
      const value = commonRowItems[key];
      row[index] = value;
    });

    // For each annotation data, find the correct index and add the value to the
    // correct row in the results array
    report.columns.forEach((column, index) => {
      const colIndex = columns.indexOf(column);
      const value = report.values[index];
      row[colIndex] = value;
    });

    results.push(row);
  });

  return results;
}

function _getCommonRowItems(measurement, seriesMetadata) {
  const firstInstance = seriesMetadata.instances[0];

  return {
    'Patient ID': firstInstance.PatientID, // Patient ID
    'Patient Name': formatPN(firstInstance.PatientName) || '', // Patient Name
    StudyInstanceUID: measurement.referenceStudyUID, // StudyInstanceUID
    SeriesInstanceUID: measurement.referenceSeriesUID, // SeriesInstanceUID
    SOPInstanceUID: measurement.SOPInstanceUID, // SOPInstanceUID
    Label: measurement.label || '', // Label
  };
}

function _createAndDownloadFile(csvContent) {
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'MeasurementReport.csv');
  document.body.appendChild(link);
  link.click();
}

/**
 * Save CSV to syncforge directory structure
 * Calls backend API to save file: syncforge/studies/{StudyInstanceUID}/{SeriesInstanceUID}/measurements-{timestamp}.csv
 */
async function _saveCSVToSurgicalCase(csvContent, measurementData) {
  if (!measurementData || measurementData.length === 0) {
    return;
  }

  // Extract StudyInstanceUID and SeriesInstanceUID from first measurement
  // (assuming all measurements are from same study/series)
  const firstMeasurement = measurementData[0];
  const studyInstanceUID = firstMeasurement.referenceStudyUID;
  const seriesInstanceUID = firstMeasurement.referenceSeriesUID;

  if (!studyInstanceUID || !seriesInstanceUID) {
    console.warn('⚠️ Cannot save CSV: Missing StudyInstanceUID or SeriesInstanceUID');
    return;
  }

  // Generate filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-MM-SS
  const filename = `measurements-${timestamp}.csv`;

  // Prepare data for backend API
  const saveData = {
    studyInstanceUID,
    seriesInstanceUID,
    filename,
    csvContent,
  };

  try {
    // Call backend API endpoint (use full URL with port 3001)
    const response = await fetch('http://localhost:3001/api/syncforge/save-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Measurement CSV saved to: ${result.filePath}`);
    } else {
      const error = await response.text();
      console.warn(`⚠️ Failed to save CSV to syncforge: ${error}`);
      // Don't throw - browser download still succeeded
    }
  } catch (error) {
    // Silently fail if backend is not available
    // Browser download still works
    console.warn('⚠️ Could not save CSV to syncforge (backend may not be configured):', error.message);
  }
}
