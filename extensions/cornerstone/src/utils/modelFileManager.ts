/**
 * Model File Manager Utility
 *
 * This module provides utilities for managing 3D model files on the file system.
 * Note: These functions require a backend API to work properly as browsers cannot
 * directly access the file system for security reasons.
 *
 * You'll need to implement corresponding backend endpoints (e.g., using Node.js/Express)
 * to enable file deletion functionality.
 */

export interface ModelFileInfo {
  name: string;
  path: string;
  size?: number;
  extension: string;
  lastModified?: Date;
}

/**
 * Delete a model file from the file system
 * Requires backend API endpoint: DELETE /api/models/file
 */
export async function deleteModelFile(filePath: string): Promise<boolean> {
  try {
    const response = await fetch('/api/models/file', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    if (response.ok) {
      console.log(`✅ Model file deleted: ${filePath}`);
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Failed to delete model file:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting model file:', error);
    return false;
  }
}

/**
 * List all model files in a directory
 * Requires backend API endpoint: GET /api/models/list
 */
export async function listModelFiles(directory: string): Promise<ModelFileInfo[]> {
  try {
    const response = await fetch(`/api/models/list?directory=${encodeURIComponent(directory)}`);

    if (response.ok) {
      const files: ModelFileInfo[] = await response.json();
      return files;
    } else {
      console.error('Failed to list model files');
      return [];
    }
  } catch (error) {
    console.error('Error listing model files:', error);
    return [];
  }
}

/**
 * Get file information
 * Requires backend API endpoint: GET /api/models/info
 */
export async function getModelFileInfo(filePath: string): Promise<ModelFileInfo | null> {
  try {
    const response = await fetch(`/api/models/info?filePath=${encodeURIComponent(filePath)}`);

    if (response.ok) {
      const info: ModelFileInfo = await response.json();
      return info;
    } else {
      console.error('Failed to get model file info');
      return null;
    }
  } catch (error) {
    console.error('Error getting model file info:', error);
    return null;
  }
}

/**
 * Delete multiple model files
 * Requires backend API endpoint: DELETE /api/models/batch
 */
export async function deleteMultipleModelFiles(filePaths: string[]): Promise<{
  success: string[];
  failed: string[];
}> {
  try {
    const response = await fetch('/api/models/batch', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePaths }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Deleted ${result.success.length} files, ${result.failed.length} failed`);
      return result;
    } else {
      console.error('Failed to delete multiple model files');
      return { success: [], failed: filePaths };
    }
  } catch (error) {
    console.error('Error deleting multiple model files:', error);
    return { success: [], failed: filePaths };
  }
}

/**
 * Backend API Example Implementation (Node.js/Express)
 *
 * Save this as a separate backend file, e.g., `server/routes/modelRoutes.js`
 */

/*
// Example backend implementation using Node.js and Express:

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Delete a single model file
router.delete('/api/models/file', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: Validate the file path to prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath);

    // Check if file exists
    await fs.access(normalizedPath);

    // Delete the file
    await fs.unlink(normalizedPath);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// List model files in a directory
router.get('/api/models/list', async (req, res) => {
  try {
    const { directory } = req.query;

    if (!directory) {
      return res.status(400).json({ error: 'Directory is required' });
    }

    const normalizedDir = path.normalize(directory);
    const files = await fs.readdir(normalizedDir);

    const modelExtensions = ['.obj', '.stl', '.ply', '.mtl'];
    const modelFiles = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (modelExtensions.includes(ext)) {
        const filePath = path.join(normalizedDir, file);
        const stats = await fs.stat(filePath);

        modelFiles.push({
          name: file,
          path: filePath,
          size: stats.size,
          extension: ext,
          lastModified: stats.mtime,
        });
      }
    }

    res.json(modelFiles);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file information
router.get('/api/models/info', async (req, res) => {
  try {
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const normalizedPath = path.normalize(filePath);
    const stats = await fs.stat(normalizedPath);
    const ext = path.extname(normalizedPath);
    const name = path.basename(normalizedPath);

    res.json({
      name,
      path: normalizedPath,
      size: stats.size,
      extension: ext,
      lastModified: stats.mtime,
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple files
router.delete('/api/models/batch', async (req, res) => {
  try {
    const { filePaths } = req.body;

    if (!Array.isArray(filePaths)) {
      return res.status(400).json({ error: 'File paths array is required' });
    }

    const results = { success: [], failed: [] };

    for (const filePath of filePaths) {
      try {
        const normalizedPath = path.normalize(filePath);
        await fs.unlink(normalizedPath);
        results.success.push(filePath);
      } catch (error) {
        console.error(`Failed to delete ${filePath}:`, error);
        results.failed.push(filePath);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error in batch delete:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
*/
