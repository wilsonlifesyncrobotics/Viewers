#!/usr/bin/env node

/**
 * Simple Express Server for OHIF SyncForge Storage
 *
 * This server provides an API endpoint to save measurement CSV/JSON files
 * to the syncforge directory structure.
 *
 * Usage:
 *   node syncforge/api/server.js
 *
 * Or with environment variables:
 *   OHIF_WORKSPACE_ROOT=/path/to/Viewers PORT=3001 node syncforge/api/server.js
 */

const express = require('express');
const path = require('path');
const {
  saveMeasurementCSVRoute,
  listMeasurementCSV,
  getMeasurementCSV,
  saveMeasurementJSON,
  listMeasurementJSON,
  getMeasurementJSON
} = require('./saveMeasurementCSV');

const app = express();
const PORT = process.env.PORT || 3001;
const WORKSPACE_ROOT = process.env.OHIF_WORKSPACE_ROOT || path.join(__dirname, '..', '..');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration (adjust as needed for your setup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    workspaceRoot: WORKSPACE_ROOT,
    syncforgeDir: path.join(WORKSPACE_ROOT, 'syncforge'),
  });
});

// SyncForge CSV endpoints
app.post('/api/syncforge/save-csv', saveMeasurementCSVRoute);
app.get('/api/syncforge/list-csv', listMeasurementCSV);
app.get('/api/syncforge/get-csv', getMeasurementCSV);

// SyncForge JSON endpoints
app.post('/api/syncforge/save-json', saveMeasurementJSON);
app.get('/api/syncforge/list-json', listMeasurementJSON);
app.get('/api/syncforge/get-json', getMeasurementJSON);

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 OHIF SyncForge Storage Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📁 Workspace root: ${WORKSPACE_ROOT}`);
  console.log(`💾 SyncForge dir: ${path.join(WORKSPACE_ROOT, 'syncforge')}`);
  console.log(`📋 CSV endpoint: POST http://localhost:${PORT}/api/syncforge/save-csv`);
  console.log(`📋 JSON endpoint: POST http://localhost:${PORT}/api/syncforge/save-json`);
  console.log('═══════════════════════════════════════════════════════');
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

module.exports = app;
