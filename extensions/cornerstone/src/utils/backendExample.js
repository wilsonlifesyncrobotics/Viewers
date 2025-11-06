/**
 * Backend API Example for Model File Management
 *
 * This is a complete Node.js/Express server example that provides
 * file management endpoints for the ModelStateService.
 *
 * To use:
 * 1. Save this file as `server.js` in your backend directory
 * 2. Install dependencies: npm install express cors
 * 3. Run: node server.js
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const ALLOWED_EXTENSIONS = ['.obj', '.stl', '.ply', '.mtl'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Security: Validate file path
 */
function validatePath(filePath) {
  const normalizedPath = path.normalize(filePath);

  // Prevent directory traversal
  if (normalizedPath.includes('..')) {
    throw new Error('Invalid path: directory traversal detected');
  }

  // Check file extension
  const ext = path.extname(normalizedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file type: ${ext}`);
  }

  return normalizedPath;
}

/**
 * Endpoint: Delete a single model file
 * DELETE /api/models/file
 */
app.delete('/api/models/file', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Validate path
    const normalizedPath = validatePath(filePath);

    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    await fs.unlink(normalizedPath);

    console.log(`✅ Deleted file: ${normalizedPath}`);
    res.json({
      success: true,
      message: 'File deleted successfully',
      path: normalizedPath
    });
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: List model files in a directory
 * GET /api/models/list?directory=<path>
 */
app.get('/api/models/list', async (req, res) => {
  try {
    const { directory } = req.query;

    if (!directory) {
      return res.status(400).json({ error: 'Directory parameter is required' });
    }

    // Normalize and validate directory path
    const normalizedDir = path.normalize(directory);

    if (normalizedDir.includes('..')) {
      return res.status(400).json({ error: 'Invalid directory path' });
    }

    // Check if directory exists
    try {
      const dirStats = await fs.stat(normalizedDir);
      if (!dirStats.isDirectory()) {
        return res.status(400).json({ error: 'Path is not a directory' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Read directory
    const files = await fs.readdir(normalizedDir);

    const modelFiles = [];

    // Process each file
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();

      if (ALLOWED_EXTENSIONS.includes(ext)) {
        const filePath = path.join(normalizedDir, file);

        try {
          const stats = await fs.stat(filePath);

          modelFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            extension: ext,
            lastModified: stats.mtime,
            isFile: stats.isFile(),
          });
        } catch (error) {
          console.warn(`Warning: Could not read file ${file}:`, error.message);
        }
      }
    }

    // Sort by name
    modelFiles.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📋 Listed ${modelFiles.length} files in: ${normalizedDir}`);
    res.json(modelFiles);
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Get file information
 * GET /api/models/info?filePath=<path>
 */
app.get('/api/models/info', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Validate path
    const normalizedPath = validatePath(filePath);

    // Get file stats
    const stats = await fs.stat(normalizedPath);
    const ext = path.extname(normalizedPath);
    const name = path.basename(normalizedPath);

    const fileInfo = {
      name,
      path: normalizedPath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      extension: ext,
      lastModified: stats.mtime,
      created: stats.birthtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };

    console.log(`ℹ️ File info: ${name}`);
    res.json(fileInfo);
  } catch (error) {
    console.error('❌ Error getting file info:', error);

    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Endpoint: Delete multiple files
 * DELETE /api/models/batch
 */
app.delete('/api/models/batch', async (req, res) => {
  try {
    const { filePaths } = req.body;

    if (!Array.isArray(filePaths)) {
      return res.status(400).json({ error: 'File paths array is required' });
    }

    if (filePaths.length === 0) {
      return res.status(400).json({ error: 'No file paths provided' });
    }

    const results = {
      success: [],
      failed: [],
      total: filePaths.length
    };

    // Process each file
    for (const filePath of filePaths) {
      try {
        const normalizedPath = validatePath(filePath);
        await fs.unlink(normalizedPath);
        results.success.push(filePath);
        console.log(`✅ Deleted: ${normalizedPath}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${filePath}:`, error.message);
        results.failed.push({
          path: filePath,
          error: error.message
        });
      }
    }

    console.log(`🗑️ Batch delete: ${results.success.length} succeeded, ${results.failed.length} failed`);
    res.json(results);
  } catch (error) {
    console.error('❌ Error in batch delete:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Move/Rename file
 * POST /api/models/move
 */
app.post('/api/models/move', async (req, res) => {
  try {
    const { sourcePath, destinationPath } = req.body;

    if (!sourcePath || !destinationPath) {
      return res.status(400).json({ error: 'Source and destination paths are required' });
    }

    // Validate paths
    const normalizedSource = validatePath(sourcePath);
    const normalizedDestination = validatePath(destinationPath);

    // Check if source exists
    await fs.access(normalizedSource);

    // Move/rename file
    await fs.rename(normalizedSource, normalizedDestination);

    console.log(`🔄 Moved: ${normalizedSource} → ${normalizedDestination}`);
    res.json({
      success: true,
      source: normalizedSource,
      destination: normalizedDestination
    });
  } catch (error) {
    console.error('❌ Error moving file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Check if file exists
 * GET /api/models/exists?filePath=<path>
 */
app.get('/api/models/exists', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const normalizedPath = path.normalize(filePath);

    try {
      await fs.access(normalizedPath);
      res.json({ exists: true, path: normalizedPath });
    } catch (error) {
      res.json({ exists: false, path: normalizedPath });
    }
  } catch (error) {
    console.error('❌ Error checking file existence:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Utility: Format bytes to human-readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Model File Manager API'
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  Model File Manager API Server                        ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT}                                           ║
║  Status: Running ✅                                    ║
║                                                       ║
║  Available Endpoints:                                 ║
║  • DELETE /api/models/file                            ║
║  • GET    /api/models/list                            ║
║  • GET    /api/models/info                            ║
║  • DELETE /api/models/batch                           ║
║  • POST   /api/models/move                            ║
║  • GET    /api/models/exists                          ║
║  • GET    /api/health                                 ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

export default app;
