# 3D Model Loader Service

A comprehensive TypeScript service for loading, rendering, and managing 3D models (OBJ, STL, PLY) in the OHIF Cornerstone Viewer using vtk.js.

## 📚 Documentation Sources

This implementation is based on:
- **Cornerstone.js Mesh Loader**: https://www.cornerstonejs.org/live-examples/meshloader
- **vtk.js OBJ Viewer**: https://kitware.github.io/vtk-js/examples/OBJViewer.html

## ✨ Features

- ✅ Load 3D models from URLs or local files
- ✅ Support for multiple formats: OBJ, STL, PLY
- ✅ Render models in Cornerstone3D viewports
- ✅ Real-time model manipulation (color, opacity, visibility)
- ✅ Event-driven architecture with PubSub pattern
- ✅ Multiple model management per viewport
- ✅ Model state persistence
- ✅ File deletion capability (with backend API)

## 🚀 Quick Start

### 1. Service Access

The `ModelStateService` is automatically registered in the Cornerstone extension. Access it through the services manager:

```typescript
const { modelStateService } = servicesManager.services;
```

### 2. Load a Model from URL

```typescript
const loadedModel = await modelStateService.loadModel(
  'https://example.com/model.obj',
  {
    viewportId: 'viewport-1',
    color: [0.8, 0.2, 0.2], // Red (RGB 0-1 range)
    opacity: 1.0,
    visible: true,
  }
);

console.log('Model ID:', loadedModel.metadata.id);
```

### 3. Load from File Input

```typescript
// Create file input
const input = document.createElement('input');
input.type = 'file';
input.accept = '.obj,.stl,.ply';

input.onchange = async (e) => {
  const file = e.target.files[0];
  const loadedModel = await modelStateService.loadModelFromFileInput(file, {
    viewportId: 'viewport-1',
    color: [0.2, 0.8, 0.2], // Green
    opacity: 0.8,
  });
};

input.click();
```

### 4. Manage Models

```typescript
// Get all models
const allModels = modelStateService.getAllModels();

// Get specific model
const model = modelStateService.getModel(modelId);

// Update visibility
modelStateService.setModelVisibility(modelId, false);

// Change color
modelStateService.setModelColor(modelId, [0.0, 0.5, 1.0]); // Blue

// Adjust opacity
modelStateService.setModelOpacity(modelId, 0.5);

// Remove model
modelStateService.removeModel(modelId);

// Clear all models
modelStateService.clearAllModels();
```

## 📁 File Structure

```
extensions/cornerstone/src/
├── modelStateService.ts           # Main service implementation
├── utils/
│   └── modelFileManager.ts        # File system utilities
├── examples/
│   └── modelLoaderExample.ts      # Usage examples
└── MODEL_LOADER_README.md         # This file
```

## 🎯 API Reference

### ModelStateService

#### Methods

##### `loadModel(filePathOrUrl: string, options?: ModelLoadOptions): Promise<LoadedModel | null>`

Load a 3D model from a file path or URL.

**Parameters:**
- `filePathOrUrl`: Path to the model file or URL
- `options`: Loading options
  - `viewportId?`: Viewport to render the model in
  - `color?`: RGB color array [0-1, 0-1, 0-1]
  - `opacity?`: Opacity value (0-1)
  - `visible?`: Initial visibility
  - `position?`: 3D position [x, y, z]
  - `scale?`: 3D scale [x, y, z]
  - `rotation?`: 3D rotation [x, y, z] in degrees

**Returns:** `LoadedModel` object or `null` if failed

**Example:**
```typescript
const model = await modelStateService.loadModel(
  'https://example.com/screw.obj',
  {
    viewportId: 'ct-axial',
    color: [0.9, 0.7, 0.1],
    opacity: 0.8,
    scale: [1.5, 1.5, 1.5],
  }
);
```

---

##### `loadModelFromFileInput(file: File, options?: ModelLoadOptions): Promise<LoadedModel | null>`

Load a model from a File object (from file input).

**Parameters:**
- `file`: File object from input element
- `options`: Same as `loadModel`

**Example:**
```typescript
const file = event.target.files[0];
const model = await modelStateService.loadModelFromFileInput(file, {
  viewportId: 'viewport-1',
  color: [1, 0, 0],
});
```

---

##### `getAllModels(): LoadedModel[]`

Get all currently loaded models.

**Returns:** Array of `LoadedModel` objects

---

##### `getModel(modelId: string): LoadedModel | undefined`

Get a specific model by ID.

**Returns:** `LoadedModel` or `undefined`

---

##### `getModelsByViewport(viewportId: string): LoadedModel[]`

Get all models in a specific viewport.

**Returns:** Array of `LoadedModel` objects

---

##### `setModelVisibility(modelId: string, visible: boolean): boolean`

Toggle model visibility.

**Returns:** `true` if successful

---

##### `setModelColor(modelId: string, color: [number, number, number]): boolean`

Change model color.

**Parameters:**
- `color`: RGB array with values 0-1

**Example:**
```typescript
modelStateService.setModelColor(modelId, [0.8, 0.2, 0.2]); // Red
```

---

##### `setModelOpacity(modelId: string, opacity: number): boolean`

Change model opacity.

**Parameters:**
- `opacity`: Value between 0 (transparent) and 1 (opaque)

---

##### `removeModel(modelId: string): boolean`

Remove model from all viewports and memory.

**Returns:** `true` if successful

---

##### `removeModelFromViewport(modelId: string, viewportId: string): boolean`

Remove model from a specific viewport only.

**Returns:** `true` if successful

---

##### `deleteModelFile(modelId: string): Promise<boolean>`

Delete the model file from disk (requires backend API).

**Returns:** `true` if successful

---

##### `clearAllModels(): void`

Remove all loaded models.

---

##### `setModelDirectory(directory: string): void`

Set the default model directory.

---

##### `getModelDirectory(): string`

Get the current model directory.

---

### Events

Subscribe to model events using the PubSub pattern:

```typescript
const unsubscribe = modelStateService.subscribe(
  modelStateService.EVENTS.MODEL_ADDED,
  ({ modelId, metadata }) => {
    console.log('Model added:', metadata.name);
  }
);

// Later: unsubscribe
unsubscribe.unsubscribe();
```

#### Available Events

- `MODEL_ADDED`: Fired when a model is added
- `MODEL_REMOVED`: Fired when a model is removed
- `MODEL_UPDATED`: Fired when model properties change
- `MODEL_VISIBILITY_CHANGED`: Fired when visibility changes
- `MODEL_LOADING_START`: Fired when loading starts
- `MODEL_LOADING_COMPLETE`: Fired when loading completes
- `MODEL_LOADING_ERROR`: Fired when loading fails
- `MODELS_CLEARED`: Fired when all models are cleared

## 🎨 Usage in Commands Module

Add model commands to your extension's command module:

```typescript
// In commandsModule.ts
const commands = {
  loadModel: ({ modelUrl, viewportId, options = {} }) => {
    const { modelStateService } = servicesManager.services;
    return modelStateService.loadModel(modelUrl, { viewportId, ...options });
  },

  removeModel: ({ modelId }) => {
    const { modelStateService } = servicesManager.services;
    return modelStateService.removeModel(modelId);
  },

  toggleModelVisibility: ({ modelId }) => {
    const { modelStateService } = servicesManager.services;
    const model = modelStateService.getModel(modelId);
    if (model) {
      return modelStateService.setModelVisibility(
        modelId,
        !model.metadata.visible
      );
    }
  },

  setModelColor: ({ modelId, color }) => {
    const { modelStateService } = servicesManager.services;
    return modelStateService.setModelColor(modelId, color);
  },

  getAllModels: () => {
    const { modelStateService } = servicesManager.services;
    return modelStateService.getAllModels();
  },
};
```

## 🖼️ Usage in React Components

```typescript
import React, { useEffect, useState } from 'react';

function ModelViewer({ servicesManager, viewportId }) {
  const { modelStateService } = servicesManager.services;
  const [models, setModels] = useState([]);

  useEffect(() => {
    // Subscribe to model events
    const unsubscribe = modelStateService.subscribe(
      modelStateService.EVENTS.MODEL_ADDED,
      () => {
        setModels(modelStateService.getAllModels());
      }
    );

    // Load initial model
    modelStateService.loadModel('path/to/model.obj', { viewportId });

    return () => unsubscribe.unsubscribe();
  }, [modelStateService, viewportId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    await modelStateService.loadModelFromFileInput(file, { viewportId });
  };

  return (
    <div>
      <input type="file" accept=".obj,.stl,.ply" onChange={handleFileUpload} />

      <div>
        <h3>Loaded Models: {models.length}</h3>
        {models.map((model) => (
          <div key={model.metadata.id}>
            <span>{model.metadata.name}</span>
            <button
              onClick={() =>
                modelStateService.setModelVisibility(
                  model.metadata.id,
                  !model.metadata.visible
                )
              }
            >
              {model.metadata.visible ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => modelStateService.removeModel(model.metadata.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🗂️ Backend API for File Deletion

To enable file deletion functionality, implement these backend endpoints:

### Required Endpoints

1. **DELETE /api/models/file** - Delete a single file
2. **GET /api/models/list** - List files in directory
3. **GET /api/models/info** - Get file information
4. **DELETE /api/models/batch** - Delete multiple files

### Example Implementation (Node.js/Express)

See `utils/modelFileManager.ts` for a complete example backend implementation.

Quick example:

```javascript
// server.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(express.json());

// Delete model file
app.delete('/api/models/file', async (req, res) => {
  try {
    const { filePath } = req.body;

    // Validate and normalize path
    const normalizedPath = path.normalize(filePath);

    // Delete file
    await fs.unlink(normalizedPath);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## 🔒 Security Considerations

1. **Path Validation**: Always validate and normalize file paths to prevent directory traversal attacks
2. **Access Control**: Implement proper authentication/authorization for file deletion endpoints
3. **CORS**: Configure CORS properly if frontend and backend are on different domains
4. **File Type Validation**: Validate file types on both frontend and backend
5. **File Size Limits**: Implement file size limits to prevent abuse

## 📝 Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| OBJ    | `.obj`    | Wavefront OBJ format (with optional `.mtl` material files) |
| STL    | `.stl`    | STereoLithography format |
| PLY    | `.ply`    | Polygon File Format |

## 🐛 Troubleshooting

### Models not appearing

1. Check viewport ID is correct
2. Verify rendering engine is initialized
3. Check browser console for errors
4. Ensure model file format is supported

### File loading fails

1. Check CORS headers if loading from URL
2. Verify file path is correct
3. Ensure file format is valid
4. Check browser console for specific error

### Backend API not working

1. Verify backend server is running
2. Check API endpoint URLs
3. Verify CORS configuration
4. Check file system permissions

## 🎯 Configuration

Set the default model directory:

```typescript
modelStateService.setModelDirectory(
  'C:\\path\\to\\your\\models'
);
```

Current directory can be retrieved:

```typescript
const directory = modelStateService.getModelDirectory();
```

Default directory: `C:\Users\hp\tableTop\mvisioner\slicer\slicer\deployment\addScrew\addScrew\Resources\20250415_U-Peidcle Screw_7300_T10`

## 📚 Additional Resources

- [vtk.js Documentation](https://kitware.github.io/vtk-js/)
- [Cornerstone3D Documentation](https://www.cornerstonejs.org/)
- [OHIF Viewer Documentation](https://docs.ohif.org/)

## 🤝 Contributing

To extend the service:

1. Add new model formats by implementing readers in `_createModelFromText`
2. Add new manipulation methods (e.g., rotation, translation)
3. Implement material support for OBJ files
4. Add model animation capabilities

## 📄 License

Part of the OHIF Viewer project.

---

**Created**: November 2025
**Author**: OHIF Development Team
**Version**: 1.0.0
