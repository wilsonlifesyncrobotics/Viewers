/**
 * PanelModelUpload - Panel for uploading 3D models
 *
 * This panel can be registered in getPanelModule to provide
 * a dedicated UI for uploading 3D model files.
 */

import React from 'react';
import { useSystem } from '@ohif/core';
import ModelUpload from '../components/ModelUpload';

function PanelModelUpload() {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;

  // Get active viewport ID
  const [activeViewportId, setActiveViewportId] = React.useState<string>('');

  React.useEffect(() => {
    // Get the active viewport
    const viewports = cornerstoneViewportService.getViewports();
    if (viewports.length > 0) {
      // Use the first viewport or active viewport
      setActiveViewportId(viewports[0].viewportId);
    }

    // Listen for viewport changes
    const { unsubscribe } = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      () => {
        const viewports = cornerstoneViewportService.getViewports();
        if (viewports.length > 0) {
          setActiveViewportId(viewports[0].viewportId);
        }
      }
    );

    return () => unsubscribe();
  }, [cornerstoneViewportService]);

  return (
    <div className="h-full overflow-hidden bg-black p-4">
      <div className="h-full overflow-auto">
        <h2 className="text-2xl font-bold text-white mb-4">3D Model Upload</h2>

        {activeViewportId ? (
          <>
            <div className="mb-4 text-sm text-secondary-light">
              Models will be loaded into viewport: <span className="text-white font-semibold">{activeViewportId}</span>
            </div>

            <ModelUpload
              viewportId={activeViewportId}
              onComplete={() => {
                console.log('Model upload complete');
              }}
              onStarted={() => {
                console.log('Model upload started');
              }}
              defaultColor={[0.8, 0.2, 0.2]} // Red
              defaultOpacity={0.8}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-secondary-light">
            <div className="text-center">
              <p className="mb-2">No viewport available</p>
              <p className="text-sm">Please open a study first</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelModelUpload;
