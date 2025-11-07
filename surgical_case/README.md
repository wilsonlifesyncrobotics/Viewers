# Surgical Case Data Storage

This directory stores case-specific surgical data linked to DICOM studies.

## Structure

```
surgical_case/
├── api/                            # Backend API for saving files
│   ├── server.js                  # Express server example
│   └── saveMeasurementCSV.js     # CSV save endpoint
└── studies/
    └── {StudyInstanceUID}/
        └── {SeriesInstanceUID}/
            ├── measurements-2025-11-07T22-05-01.csv  # Auto-saved CSV exports
            ├── measurements-2025-11-07T22-10-15.csv
            └── ...
        ├── case-info.json          # Case metadata
        ├── fiducials.json          # Fiducial markers [x,y,z]
        ├── planning-data.json      # Surgical planning
        ├── navigation-log.json    # Navigation sessions
        └── registration.json       # Registration matrices
```

## StudyInstanceUID

Each folder is named using the DICOM StudyInstanceUID, which OHIF extracts from the loaded study.

Example: `1.2.840.113619.2.55.3.4064710686.932.1720634932.125/`

## JSON Format Examples

### case-info.json
```json
{
  "studyInstanceUID": "1.2.840.113619.2.55.3...",
  "caseID": "CASE-2025-001",
  "surgeryType": "brain-tumor-resection",
  "createdDate": "2025-11-07T10:30:00Z",
  "surgeon": "Dr. Smith"
}
```

### fiducials.json
```json
{
  "fiducials": [
    {
      "id": "F1",
      "label": "Nasion",
      "position": [102.4, 179.8, 61.5],
      "coordinateSystem": "RAS",
      "timestamp": "2025-11-07T10:35:00Z"
    }
  ]
}
```

## CSV Auto-Save Feature

When you click the "CSV" export button in OHIF's measurement panel:
1. ✅ CSV downloads to your browser (existing behavior)
2. ✅ CSV is automatically saved to: `surgical_case/studies/{StudyInstanceUID}/{SeriesInstanceUID}/measurements-{timestamp}.csv`

### Backend Setup

To enable CSV auto-save, you need a backend API server running:

#### Option 1: Use the Provided Express Server

```bash
# Install dependencies (if not already installed)
npm install express

# Run the server
node surgical_case/api/server.js

# Or with custom port/workspace
OHIF_WORKSPACE_ROOT=/path/to/Viewers PORT=3001 node surgical_case/api/server.js
```

The server will run on `http://localhost:3001` by default.

#### Option 2: Integrate into Your Existing Backend

Copy `surgical_case/api/saveMeasurementCSV.js` to your backend and add the route:

```javascript
const express = require('express');
const { saveMeasurementCSVRoute } = require('./saveMeasurementCSV');
const app = express();

app.use(express.json());
app.post('/api/surgical-cases/save-csv', saveMeasurementCSVRoute);
```

#### Option 3: Configure OHIF to Use Different API URL

If your backend runs on a different URL, modify `downloadCSVReport.js`:

```javascript
// Change this line:
const response = await fetch('/api/surgical-cases/save-csv', {
  // To your backend URL:
  const response = await fetch('http://localhost:3001/api/surgical-cases/save-csv', {
```

### CSV File Naming

Files are named with timestamp: `measurements-YYYY-MM-DDTHH-MM-SS.csv`

Example: `measurements-2025-11-07T22-05-01.csv`

### Error Handling

- If backend is not available, CSV still downloads to browser ✅
- Errors are logged to console but don't interrupt user workflow
- Check browser console for save status messages

## Notes

- This folder is in `.gitignore` and will NOT be committed
- Coordinate system: RAS (Right, Anterior, Superior)
- All positions in millimeters
- Timestamps in ISO 8601 format
- CSV files are organized by StudyInstanceUID and SeriesInstanceUID
