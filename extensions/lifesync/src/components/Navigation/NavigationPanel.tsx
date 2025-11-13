import React from 'react';
import { useSystem } from '@ohif/core';
import NavigationComponent from './NavigationComponent';

export default function NavigationPanel() {
  const { servicesManager } = useSystem();
  const { cornerstoneViewportService } = servicesManager.services;

  // Get the active viewport ID
  const activeViewportId = cornerstoneViewportService?.getActiveViewportId?.();

  if (!activeViewportId) {
    return (
      <div className="navigation-panel">
        <div className="panel-header">
          <h2>🧭 Navigation</h2>
        </div>
        <div className="panel-content">
          <p className="text-gray-500 text-sm">No active viewport</p>
        </div>
      </div>
    );
  }

  return (
    <div className="navigation-panel">
      <div className="panel-header">
        <h2>🧭 Navigation</h2>
      </div>
      <div className="panel-content">
        <NavigationComponent viewportId={activeViewportId} />
      </div>
    </div>
  );
}

