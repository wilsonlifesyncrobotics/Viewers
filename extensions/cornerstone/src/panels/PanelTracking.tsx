/**
 * PanelTracking - Panel for tracking system configuration and control
 *
 * This panel provides controls for:
 * - Switching between simulation/hardware tracking modes
 * - Enabling/disabling specific tracking tools
 * - Viewing tracking status and quality metrics
 * - Starting/stopping tracking sessions
 */

import React from 'react';
import { useSystem } from '@ohif/core';

interface TrackingConfig {
  version: string;
  tracking_mode: {
    current: string;
    type: string;
    options: string[];
  };
  active_tools: {
    [toolKey: string]: {
      asset_id: string;
      enabled: boolean;
      required?: boolean;
      description?: string;
    };
  };
  quality_thresholds: {
    min_quality_score: number;
  };
}

interface TrackingStatus {
  connected: boolean;
  mode: string;
  tools: {
    [toolId: string]: {
      visible: boolean;
      quality_score: number;
      position: [number, number, number];
    };
  };
}

function PanelTracking() {
  const { servicesManager } = useSystem();
  const [config, setConfig] = React.useState<TrackingConfig | null>(null);
  const [status, setStatus] = React.useState<TrackingStatus | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load tracking configuration
  const loadConfig = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:5001/api/tracking/config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.config);
      } else {
        setError('Failed to load tracking configuration');
      }
    } catch (err) {
      setError('Failed to connect to tracking service');
      console.error('Error loading tracking config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Switch tracking mode
  const switchMode = React.useCallback(async (mode: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/tracking/mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });

      const result = await response.json();
      if (result.success) {
        // Update local config
        if (config) {
          setConfig({
            ...config,
            tracking_mode: { ...config.tracking_mode, current: mode }
          });
        }
        setError(null);
      } else {
        setError(result.error || 'Failed to switch mode');
      }
    } catch (err) {
      setError('Failed to switch tracking mode');
      console.error('Error switching mode:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Toggle tool enable/disable
  const toggleTool = React.useCallback(async (toolKey: string, enabled: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/tracking/tools/${toolKey}/enable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      const result = await response.json();
      if (result.success) {
        // Update local config
        if (config) {
          setConfig({
            ...config,
            active_tools: {
              ...config.active_tools,
              [toolKey]: { ...config.active_tools[toolKey], enabled }
            }
          });
        }
        setError(null);
      } else {
        setError(result.error || 'Failed to update tool status');
      }
    } catch (err) {
      setError('Failed to update tool status');
      console.error('Error updating tool:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Load config on mount
  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return (
    <div className="h-full overflow-hidden bg-black p-4">
      <div className="h-full overflow-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Tracking Control</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center text-secondary-light">
            Loading...
          </div>
        )}

        {/* Mode Selection */}
        {config && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Tracking Mode</h3>
            <div className="space-y-2">
              {config.tracking_mode.options.map(mode => (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  disabled={loading}
                  className={`w-full p-3 rounded border transition-colors ${
                    config.tracking_mode.current === mode
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{mode}</span>
                    {config.tracking_mode.current === mode && (
                      <span className="text-green-400">● Active</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {mode === 'simulation' ? 'Use simulated tracking data' : 'Connect to NDI hardware'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tool Configuration */}
        {config && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Tracking Tools</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(config.active_tools).map(([toolKey, tool]) => (
                <div
                  key={toolKey}
                  className={`p-3 rounded border transition-colors ${
                    tool.enabled
                      ? 'bg-green-900 border-green-700'
                      : 'bg-gray-800 border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {toolKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-400">
                        {tool.description || tool.asset_id}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tool.required && (
                        <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-white">
                          Required
                        </span>
                      )}
                      <button
                        onClick={() => toggleTool(toolKey, !tool.enabled)}
                        disabled={loading || tool.required}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          tool.enabled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {tool.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded border border-gray-600">
              <span className="text-gray-300">Tracking Service</span>
              <span className={`text-sm ${config ? 'text-green-400' : 'text-red-400'}`}>
                {config ? '● Connected' : '● Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded border border-gray-600">
              <span className="text-gray-300">Asset Management</span>
              <span className="text-sm text-yellow-400">● Checking...</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={loadConfig}
            disabled={loading}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded transition-colors"
          >
            Refresh Configuration
          </button>

          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5001/api/tracking/reload-config', {
                  method: 'POST'
                });
                const result = await response.json();
                if (result.success) {
                  setError(null);
                } else {
                  setError('Failed to reload configuration');
                }
              } catch (err) {
                setError('Failed to reload configuration');
              }
            }}
            disabled={loading}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded transition-colors"
          >
            Reload Tracking Servers
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <div>SyncForge API: localhost:5001</div>
            <div>Asset Manager: localhost:4500</div>
            <div>Protocol Bridge: localhost:5001/ws</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PanelTracking;
