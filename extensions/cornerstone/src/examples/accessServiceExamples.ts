/**
 * Examples: How to Access ModelStateService
 *
 * This file demonstrates all the different ways to access the ModelStateService
 * in various contexts within the OHIF application.
 */

// ============================================================================
// METHOD 1: React Component with Custom Hook (RECOMMENDED)
// ============================================================================

import React from 'react';
import { useModelStateService } from '../hooks/useModelStateService';

export function Example1_ReactWithHook({ viewportId }) {
  const modelStateService = useModelStateService();

  const loadModel = async () => {
    await modelStateService.loadModel('path/to/model.obj', {
      viewportId,
      color: [1, 0, 0],
    });
  };

  return <button onClick={loadModel}>Load Model</button>;
}

// ============================================================================
// METHOD 2: React Component with Helper Hook
// ============================================================================

import { useModelState } from '../hooks/useModelStateService';

export function Example2_ReactWithHelpers({ viewportId }) {
  const { loadModel, getAllModels, toggleVisibility } = useModelState(viewportId);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    await loadModel(file);
  };

  return (
    <div>
      <input type="file" accept=".obj,.stl,.ply" onChange={handleFileUpload} />
      <p>Models: {getAllModels().length}</p>
    </div>
  );
}

// ============================================================================
// METHOD 3: React Component with useSystem Hook
// ============================================================================

import { useSystem } from '@ohif/core';

export function Example3_ReactWithUseSystem({ viewportId }) {
  const { servicesManager } = useSystem();
  const { modelStateService } = servicesManager.services;

  const loadModel = async () => {
    await modelStateService.loadModel('path/to/model.obj', { viewportId });
  };

  return <button onClick={loadModel}>Load Model</button>;
}

// ============================================================================
// METHOD 4: React Component with Props (withAppTypes)
// ============================================================================

import { withAppTypes } from '@ohif/core';

export function Example4_ReactWithProps({
  servicesManager,
  viewportId,
}: withAppTypes<{ viewportId: string }>) {
  const { modelStateService } = servicesManager.services;

  const loadModel = async () => {
    await modelStateService.loadModel('path/to/model.obj', { viewportId });
  };

  return <button onClick={loadModel}>Load Model</button>;
}

// ============================================================================
// METHOD 5: Command Module
// ============================================================================

export const Example5_CommandModule = ({ servicesManager, commandsManager }) => {
  const { modelStateService } = servicesManager.services;

  return {
    actions: {
      loadModel: ({ modelUrl, viewportId, options = {} }) => {
        return modelStateService.loadModel(modelUrl, { viewportId, ...options });
      },

      removeModel: ({ modelId }) => {
        return modelStateService.removeModel(modelId);
      },

      setModelColor: ({ modelId, color }) => {
        return modelStateService.setModelColor(modelId, color);
      },

      getAllModels: () => {
        return modelStateService.getAllModels();
      },
    },
  };
};

// ============================================================================
// METHOD 6: Extension preRegistration
// ============================================================================

export const Example6_ExtensionPreRegistration = async ({ servicesManager }) => {
  const { modelStateService } = servicesManager.services;

  // Use during extension initialization
  console.log('ModelStateService available:', !!modelStateService);

  // Set default directory
  modelStateService.setModelDirectory('C:\\path\\to\\models');
};

// ============================================================================
// METHOD 7: Extension onModeEnter
// ============================================================================

export const Example7_ExtensionOnModeEnter = ({ servicesManager, commandsManager }) => {
  const { modelStateService } = servicesManager.services;

  // Subscribe to events when mode is entered
  const unsubscribe = modelStateService.subscribe(
    modelStateService.EVENTS.MODEL_ADDED,
    ({ metadata }) => {
      console.log('Model added in mode:', metadata.name);
    }
  );

  // Clean up on mode exit
  return () => unsubscribe.unsubscribe();
};

// ============================================================================
// METHOD 8: Utility Function (Global Access)
// ============================================================================

export function Example8_UtilityFunction() {
  // Access via global window object
  if (typeof window === 'undefined' || !window.services) {
    throw new Error('Services not available');
  }

  const modelStateService = window.services.modelStateService;

  return {
    loadModelFromPath: async (path: string, viewportId: string) => {
      return await modelStateService.loadModel(path, {
        viewportId,
        color: [0.8, 0.2, 0.2],
      });
    },

    getAllModels: () => {
      return modelStateService.getAllModels();
    },

    deleteModelById: (modelId: string) => {
      return modelStateService.removeModel(modelId);
    },
  };
}

// ============================================================================
// METHOD 9: Browser Console Access
// ============================================================================

/**
 * Open browser console (F12) and try these commands:
 */

// Example 9a: Via window.services (Direct)
/*
const modelService = window.services.modelStateService;

await modelService.loadModel('C:\\path\\to\\model.obj', {
  viewportId: 'viewport-1',
  color: [1, 0, 0],
});

const models = modelService.getAllModels();
console.log('Loaded models:', models);
*/

// Example 9b: Via window.servicesManager
/*
const { modelStateService } = window.servicesManager.services;

await modelStateService.loadModel('path/to/model.obj', {
  viewportId: 'viewport-1',
});
*/

// ============================================================================
// METHOD 10: Custom Panel Component
// ============================================================================

import { useState, useEffect } from 'react';

export function Example10_CustomPanel({ servicesManager, commandsManager }) {
  const modelStateService = useModelStateService(); // Use hook
  // OR: const { modelStateService } = servicesManager.services; // From props

  const [models, setModels] = useState([]);

  useEffect(() => {
    // Load initial models
    setModels(modelStateService.getAllModels());

    // Subscribe to changes
    const unsubscribe = modelStateService.subscribe(
      modelStateService.EVENTS.MODEL_ADDED,
      () => setModels(modelStateService.getAllModels())
    );

    return () => unsubscribe.unsubscribe();
  }, [modelStateService]);

  return (
    <div>
      <h3>3D Models Panel</h3>
      <p>Loaded Models: {models.length}</p>
      {models.map((model) => (
        <div key={model.metadata.id}>
          {model.metadata.name}
          <button
            onClick={() =>
              modelStateService.setModelVisibility(
                model.metadata.id,
                !model.metadata.visible
              )
            }
          >
            Toggle
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COMPLETE EXAMPLE: Full Component with All Features
// ============================================================================

export function CompleteExample({ viewportId }) {
  const {
    modelStateService,
    loadModel,
    getAllModels,
    toggleVisibility,
    setColor,
    setOpacity,
    removeModel,
    clearAll,
  } = useModelState(viewportId);

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize
    setModels(getAllModels());

    // Subscribe to all events
    const subscriptions = [
      modelStateService.subscribe(modelStateService.EVENTS.MODEL_ADDED, handleUpdate),
      modelStateService.subscribe(modelStateService.EVENTS.MODEL_REMOVED, handleUpdate),
      modelStateService.subscribe(
        modelStateService.EVENTS.MODEL_VISIBILITY_CHANGED,
        handleUpdate
      ),
    ];

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [modelStateService]);

  const handleUpdate = () => {
    setModels(getAllModels());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      await loadModel(file, {
        color: [0.8, 0.2, 0.2],
        opacity: 0.8,
      });
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromUrl = async () => {
    const url = prompt('Enter model URL:');
    if (!url) return;

    setLoading(true);
    try {
      await modelStateService.loadModel(url, {
        viewportId,
        color: [0.2, 0.8, 0.2],
      });
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>3D Model Manager</h2>

      {/* Upload Section */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".obj,.stl,.ply"
          onChange={handleFileUpload}
          disabled={loading}
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleLoadFromUrl} disabled={loading}>
          Load from URL
        </button>
        <button onClick={clearAll} disabled={loading || models.length === 0}>
          Clear All
        </button>
      </div>

      {/* Status */}
      {loading && <div>Loading model...</div>}

      {/* Models List */}
      <div>
        <h3>Loaded Models: {models.length}</h3>
        {models.map((model) => (
          <div
            key={model.metadata.id}
            style={{
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{model.metadata.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Format: {model.metadata.format} | Visible: {model.metadata.visible ? 'Yes' : 'No'}
            </div>

            <div style={{ marginTop: '10px' }}>
              <button onClick={() => toggleVisibility(model.metadata.id)}>
                {model.metadata.visible ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => setColor(model.metadata.id, [1, 0, 0])}>Red</button>
              <button onClick={() => setColor(model.metadata.id, [0, 1, 0])}>Green</button>
              <button onClick={() => setColor(model.metadata.id, [0, 0, 1])}>Blue</button>
              <button onClick={() => setOpacity(model.metadata.id, 0.5)}>50%</button>
              <button onClick={() => setOpacity(model.metadata.id, 1.0)}>100%</button>
              <button
                onClick={() => removeModel(model.metadata.id)}
                style={{ marginLeft: '10px', color: 'red' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {models.length === 0 && !loading && (
          <div style={{ color: '#999' }}>No models loaded</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY TABLE
// ============================================================================

/**
 * Quick Reference: How to Access ModelStateService
 *
 * | Context                | Method                                      | Recommended |
 * |------------------------|---------------------------------------------|-------------|
 * | React Component        | useModelStateService() hook                 | ✅ Yes      |
 * | React Component        | useModelState() hook (with helpers)         | ✅ Yes      |
 * | React Component        | useSystem() hook                            | Good        |
 * | React Component        | Props (withAppTypes)                        | Legacy      |
 * | Command Module         | servicesManager parameter                   | ✅ Yes      |
 * | Extension Method       | servicesManager parameter                   | ✅ Yes      |
 * | Utility Function       | window.services.modelStateService           | Good        |
 * | Browser Console        | window.services.modelStateService           | ✅ Yes      |
 * | Browser Console        | window.servicesManager.services             | Alternative |
 *
 * For more details, see: HOW_TO_ACCESS_SERVICES.md
 */
