import { id } from './id';
import './utils/performanceLogger';  // ← ADD THIS LINE!

// === CHECKPOINT -3: Extension File Load ===
console.log('🔷 [CHECKPOINT -3] index.tsx: Extension file loading started');
console.log('🔷 [CHECKPOINT -3] index.tsx: Extension ID:', id);

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  /**
   * Perform any pre-registration tasks here. This is called before the extension
   * is registered. Usually we run tasks such as: configuring the libraries
   * (e.g. cornerstone, cornerstoneTools, ...) or registering any services that
   * this extension is providing.
   */
  preRegistration: ({ servicesManager, commandsManager, configuration = {} }) => {
    console.log('🔷 [CHECKPOINT -4] Performance logger auto-initialized');
  },

  // Stubs to suppress "null or undefined" warnings for unused modules
  getPanelModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getPanelModule called (returning empty array)');
    return [];
  },

  getViewportModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getViewportModule called (returning empty array)');
    return [];
  },

  getToolbarModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getToolbarModule called (returning empty array)');
    return [];
  },

  getLayoutTemplateModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getLayoutTemplateModule called (returning empty array)');
    return [];
  },

  getSopClassHandlerModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getSopClassHandlerModule called (returning empty array)');
    return [];
  },

  getHangingProtocolModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getHangingProtocolModule called (returning empty array)');
    return [];
  },

  getCommandsModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getCommandsModule called (returning empty object)');
    return {};
  },

  getContextModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getContextModule called (returning empty array)');
    return [];
  },

  getDataSourcesModule: ({ servicesManager, commandsManager, extensionManager }) => {
    console.log('🔷 [STUB] index.tsx: getDataSourcesModule called (returning empty array)');
    return [];
  },
};

console.log('🔷 [CHECKPOINT -3] index.tsx: Extension export complete');
