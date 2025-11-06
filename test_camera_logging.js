/**
 * Test Script for Camera Focal Point Logging in OHIF
 *
 * This script tests the real-time camera focal point logging feature
 * for MPR viewports in OHIF.
 *
 * Usage:
 * 1. Open OHIF with MPR mode loaded
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script into the console
 * 4. Run the test commands
 */

(function() {
  console.log('🧪 Camera Focal Point Logging Test Suite');
  console.log('========================================\n');

  // Get OHIF services
  const commandsManager = window.ohif?.commandsManager;
  const servicesManager = window.ohif?.servicesManager;
  const viewportStateService = servicesManager?.services?.viewportStateService;

  if (!commandsManager || !viewportStateService) {
    console.error('❌ OHIF services not found. Make sure you\'re running this in OHIF.');
    return;
  }

  // Test functions
  const tests = {
    /**
     * Test 1: Enable camera logging
     */
    testEnable: function() {
      console.log('\n📝 Test 1: Enable Camera Logging');
      console.log('-----------------------------------');
      try {
        commandsManager.runCommand('enableCameraLogging');
        const isEnabled = viewportStateService.isCameraLoggingEnabled();
        console.log(isEnabled ? '✅ PASS: Logging enabled' : '❌ FAIL: Logging not enabled');
        return isEnabled;
      } catch (error) {
        console.error('❌ FAIL:', error.message);
        return false;
      }
    },

    /**
     * Test 2: Get current focal points
     */
    testGetFocalPoints: function() {
      console.log('\n📝 Test 2: Get Current Focal Points');
      console.log('-----------------------------------');
      try {
        const focalPoints = viewportStateService.getCurrentFocalPoints();
        const viewportCount = Object.keys(focalPoints).length;
        console.log(`Found ${viewportCount} MPR viewport(s)`);

        if (viewportCount === 0) {
          console.warn('⚠️ WARNING: No MPR viewports found. Make sure you\'re in MPR mode.');
          return false;
        }

        Object.entries(focalPoints).forEach(([viewportId, point]) => {
          console.log(`  ${viewportId}:`, point);
        });

        const expectedCount = 3; // axial, sagittal, coronal
        if (viewportCount === expectedCount) {
          console.log(`✅ PASS: Found all ${expectedCount} expected MPR viewports`);
          return true;
        } else {
          console.log(`⚠️ PARTIAL: Expected ${expectedCount} viewports, found ${viewportCount}`);
          return true;
        }
      } catch (error) {
        console.error('❌ FAIL:', error.message);
        return false;
      }
    },

    /**
     * Test 3: Toggle logging
     */
    testToggle: function() {
      console.log('\n📝 Test 3: Toggle Camera Logging');
      console.log('-----------------------------------');
      try {
        const initialState = viewportStateService.isCameraLoggingEnabled();
        console.log(`Initial state: ${initialState ? 'enabled' : 'disabled'}`);

        commandsManager.runCommand('toggleCameraLogging');
        const afterToggle = viewportStateService.isCameraLoggingEnabled();
        console.log(`After toggle: ${afterToggle ? 'enabled' : 'disabled'}`);

        if (initialState !== afterToggle) {
          console.log('✅ PASS: Toggle works correctly');
          // Toggle back to original state
          commandsManager.runCommand('toggleCameraLogging');
          return true;
        } else {
          console.log('❌ FAIL: Toggle did not change state');
          return false;
        }
      } catch (error) {
        console.error('❌ FAIL:', error.message);
        return false;
      }
    },

    /**
     * Test 4: Disable camera logging
     */
    testDisable: function() {
      console.log('\n📝 Test 4: Disable Camera Logging');
      console.log('-----------------------------------');
      try {
        commandsManager.runCommand('disableCameraLogging');
        const isEnabled = viewportStateService.isCameraLoggingEnabled();
        console.log(isEnabled ? '❌ FAIL: Logging still enabled' : '✅ PASS: Logging disabled');
        return !isEnabled;
      } catch (error) {
        console.error('❌ FAIL:', error.message);
        return false;
      }
    },

    /**
     * Test 5: Command via commandsManager
     */
    testCommandManager: function() {
      console.log('\n📝 Test 5: Test getCameraFocalPoints Command');
      console.log('-----------------------------------');
      try {
        const result = commandsManager.runCommand('getCameraFocalPoints');
        const hasData = result && Object.keys(result).length > 0;

        if (hasData) {
          console.log('✅ PASS: Command returned focal points');
          return true;
        } else {
          console.log('❌ FAIL: Command returned no data');
          return false;
        }
      } catch (error) {
        console.error('❌ FAIL:', error.message);
        return false;
      }
    },
  };

  // Interactive test runner
  const runner = {
    runAll: function() {
      console.log('\n🏃 Running All Tests...\n');

      const results = {
        testEnable: tests.testEnable(),
        testGetFocalPoints: tests.testGetFocalPoints(),
        testToggle: tests.testToggle(),
        testDisable: tests.testDisable(),
        testCommandManager: tests.testCommandManager(),
      };

      console.log('\n📊 Test Summary');
      console.log('===============');

      const passed = Object.values(results).filter(r => r).length;
      const total = Object.keys(results).length;
      const percentage = Math.round((passed / total) * 100);

      Object.entries(results).forEach(([name, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${name}`);
      });

      console.log(`\nTotal: ${passed}/${total} tests passed (${percentage}%)`);

      if (passed === total) {
        console.log('\n🎉 All tests passed!');
      } else {
        console.log('\n⚠️ Some tests failed. Please review the output above.');
      }

      return results;
    },

    testEnable: tests.testEnable,
    testGetFocalPoints: tests.testGetFocalPoints,
    testToggle: tests.testToggle,
    testDisable: tests.testDisable,
    testCommandManager: tests.testCommandManager,
  };

  // Expose to window for easy access
  window.cameraLoggingTests = runner;

  console.log('\n✨ Test suite loaded successfully!');
  console.log('\nAvailable commands:');
  console.log('  cameraLoggingTests.runAll()          - Run all tests');
  console.log('  cameraLoggingTests.testEnable()      - Test enable');
  console.log('  cameraLoggingTests.testGetFocalPoints() - Test get focal points');
  console.log('  cameraLoggingTests.testToggle()      - Test toggle');
  console.log('  cameraLoggingTests.testDisable()     - Test disable');
  console.log('  cameraLoggingTests.testCommandManager() - Test command manager');
  console.log('\n💡 Quick start: cameraLoggingTests.runAll()\n');
})();
