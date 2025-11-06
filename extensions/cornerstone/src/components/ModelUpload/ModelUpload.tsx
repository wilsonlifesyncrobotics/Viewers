/**
 * ModelUpload Component
 *
 * A complete GUI for uploading 3D model files (.obj, .stl, .ply)
 * with drag-and-drop support.
 *
 * Based on DicomUpload component pattern.
 */

import React, { useCallback, useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import { Button, ButtonEnums, Icon } from '@ohif/ui';
import { useModelStateService } from '../../hooks/useModelStateService';

interface ModelUploadProps {
  viewportId: string;
  onComplete?: () => void;
  onStarted?: () => void;
  defaultColor?: [number, number, number];
  defaultOpacity?: number;
}

interface UploadedModel {
  file: File;
  status: 'pending' | 'loading' | 'success' | 'error';
  modelId?: string;
  error?: string;
  progress?: number;
}

const baseClassNames = 'flex flex-col items-center justify-center p-8';

function ModelUpload({
  viewportId,
  onComplete,
  onStarted,
  defaultColor = [0.8, 0.2, 0.2],
  defaultOpacity = 1.0,
}: ModelUploadProps) {
  console.log('🎨 [ModelUpload] Component rendering with props:', {
    viewportId,
    hasOnComplete: !!onComplete,
    hasOnStarted: !!onStarted,
    defaultColor,
    defaultOpacity,
  });

  const modelStateService = useModelStateService();
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  console.log('🎨 [ModelUpload] ModelStateService available:', !!modelStateService);
  console.log('🎨 [ModelUpload] Current viewport ID:', viewportId);

  useEffect(() => {
    console.log('🎨 [ModelUpload] Component mounted in DOM');
    return () => {
      console.log('🎨 [ModelUpload] Component unmounted from DOM');
    };
  }, []);

  useEffect(() => {
    console.log('🎨 [ModelUpload] ViewportId changed to:', viewportId);
  }, [viewportId]);

  const processFiles = async (files: File[]) => {
    if (onStarted) {
      onStarted();
    }

    setIsUploading(true);

    // Initialize upload status for all files
    const modelsToUpload: UploadedModel[] = files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploadedModels(modelsToUpload);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Update status to loading
      setUploadedModels(prev =>
        prev.map((m, idx) => (idx === i ? { ...m, status: 'loading', progress: 50 } : m))
      );

      try {
        const loadedModel = await modelStateService.loadModelFromFileInput(file, {
          viewportId,
          color: defaultColor,
          opacity: defaultOpacity,
          visible: true,
        });

        if (loadedModel) {
          // Success
          setUploadedModels(prev =>
            prev.map((m, idx) =>
              idx === i
                ? {
                    ...m,
                    status: 'success',
                    progress: 100,
                    modelId: loadedModel.metadata.id,
                  }
                : m
            )
          );
        } else {
          // Failed
          setUploadedModels(prev =>
            prev.map((m, idx) =>
              idx === i
                ? {
                    ...m,
                    status: 'error',
                    error: 'Failed to load model',
                  }
                : m
            )
          );
        }
      } catch (error) {
        console.error('Error loading model:', error);
        setUploadedModels(prev =>
          prev.map((m, idx) =>
            idx === i
              ? {
                  ...m,
                  status: 'error',
                  error: error.message || 'Unknown error',
                }
              : m
          )
        );
      }
    }

    setIsUploading(false);

    if (onComplete) {
      onComplete();
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['obj', 'stl', 'ply'].includes(ext || '');
      });

      if (validFiles.length === 0) {
        alert('Please upload valid 3D model files (.obj, .stl, .ply)');
        return;
      }

      await processFiles(validFiles);
    },
    [viewportId, defaultColor, defaultOpacity]
  );

  const handleReset = () => {
    setUploadedModels([]);
    setIsUploading(false);
  };

  const handleRemoveModel = (modelId: string) => {
    modelStateService.removeModel(modelId);
    setUploadedModels(prev => prev.filter(m => m.modelId !== modelId));
  };

  const getDropZoneComponent = () => {
    return (
      <Dropzone
        onDrop={acceptedFiles => {
          onDrop(acceptedFiles);
        }}
      >
        {({ getRootProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={classNames(
              'border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary-light bg-primary-dark/20'
                : 'border-secondary-light hover:border-primary-light',
              'p-12 text-center'
            )}
          >
            <div className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div className="text-primary-light">
                <Icon
                  name="launch-arrow"
                  className="w-16 h-16"
                />
              </div>

              {/* Title */}
              <div className="text-xl font-semibold text-white">
                {isDragActive ? 'Drop 3D Models Here' : 'Upload 3D Models'}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Dropzone
                  onDrop={onDrop}
                  noDrag
                >
                  {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <Button
                        type={ButtonEnums.type.primary}
                        onClick={() => {}}
                      >
                        Select Files
                      </Button>
                    </div>
                  )}
                </Dropzone>

                <Dropzone
                  onDrop={onDrop}
                  noDrag
                >
                  {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()}>
                      <input
                        {...getInputProps()}
                        {...({
                          webkitdirectory: '',
                          mozdirectory: '',
                          directory: '',
                        } as any)}
                      />
                      <Button
                        type={ButtonEnums.type.secondary}
                        onClick={() => {}}
                      >
                        Select Folder
                      </Button>
                    </div>
                  )}
                </Dropzone>
              </div>

              {/* Instructions */}
              <div className="text-base text-secondary-light">
                or drag and drop files or folders here
              </div>

              {/* Supported formats */}
              <div className="text-sm text-aqua-pale">
                Supported formats: <span className="font-semibold">.OBJ, .STL, .PLY</span>
              </div>

              {/* Info */}
              <div className="text-xs text-secondary-light max-w-md">
                <p className="mb-2">
                  💡 <span className="font-semibold">Tip:</span> You can upload multiple files at
                  once
                </p>
                <p>
                  🎨 Models will be rendered in red by default. You can change colors after loading.
                </p>
              </div>
            </div>
          </div>
        )}
      </Dropzone>
    );
  };

  const getProgressComponent = () => {
    const allSuccess = uploadedModels.every(m => m.status === 'success');
    const hasErrors = uploadedModels.some(m => m.status === 'error');

    return (
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Upload Progress ({uploadedModels.filter(m => m.status === 'success').length}/
            {uploadedModels.length} completed)
          </h3>
          <div className="flex gap-2">
            {allSuccess && (
              <Button
                type={ButtonEnums.type.secondary}
                onClick={handleReset}
              >
                Upload More
              </Button>
            )}
            <Button
              type={ButtonEnums.type.secondary}
              onClick={() => setUploadedModels([])}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Progress list */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {uploadedModels.map((model, index) => (
            <div
              key={index}
              className={classNames(
                'border rounded-lg p-4',
                model.status === 'success' && 'border-green-500 bg-green-900/20',
                model.status === 'error' && 'border-red-500 bg-red-900/20',
                model.status === 'loading' && 'border-primary-light bg-primary-dark/20',
                model.status === 'pending' && 'border-secondary-light'
              )}
            >
              <div className="flex items-center justify-between">
                {/* File info */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Status icon */}
                  <div>
                    {model.status === 'success' && (
                      <Icon
                        name="status-tracked"
                        className="text-green-500 w-6 h-6"
                      />
                    )}
                    {model.status === 'error' && (
                      <Icon
                        name="status-alert"
                        className="text-red-500 w-6 h-6"
                      />
                    )}
                    {model.status === 'loading' && (
                      <Icon
                        name="icon-status-loader"
                        className="text-primary-light w-6 h-6 animate-spin"
                      />
                    )}
                    {model.status === 'pending' && (
                      <Icon
                        name="icon-status-alert"
                        className="text-secondary-light w-6 h-6"
                      />
                    )}
                  </div>

                  {/* File name */}
                  <div className="flex-1">
                    <div className="font-semibold text-white">{model.file.name}</div>
                    <div className="text-sm text-secondary-light">
                      {(model.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {model.error && <div className="text-sm text-red-500 mt-1">{model.error}</div>}
                  </div>
                </div>

                {/* Actions */}
                {model.status === 'success' && model.modelId && (
                  <Button
                    type={ButtonEnums.type.secondary}
                    size={ButtonEnums.size.small}
                    onClick={() => handleRemoveModel(model.modelId!)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              {model.status === 'loading' && (
                <div className="mt-3 w-full bg-secondary-dark rounded-full h-2">
                  <div
                    className="bg-primary-light h-2 rounded-full transition-all duration-300"
                    style={{ width: `${model.progress || 0}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {(allSuccess || hasErrors) && (
          <div className="mt-6 p-4 rounded-lg bg-secondary-dark border border-secondary-light">
            {allSuccess && (
              <div className="text-green-500">
                ✅ All models loaded successfully! Check your viewport to see them.
              </div>
            )}
            {hasErrors && (
              <div className="text-yellow-500">
                ⚠️ Some models failed to load. Please check the file formats and try again.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={classNames('h-full', baseClassNames)}>
      {uploadedModels.length > 0 ? getProgressComponent() : getDropZoneComponent()}
    </div>
  );
}

export default ModelUpload;
