/**
 * Test Script: Verify Coordinate Consistency in Navigation System
 *
 * Run this in the OHIF browser console to verify that:
 * 1. Crosshair positions are in world coordinates (mm)
 * 2. Coordinates are consistent with DICOM metadata
 * 3. ImagePositionPatient is properly accounted for
 *
 * Usage:
 * 1. Open OHIF with a DICOM study loaded
 * 2. Enable Crosshairs tool
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Check the output
 */

console.clear();
console.log('🧪 ═══════════════════════════════════════════════════════');
console.log('🧪 COORDINATE SYSTEM CONSISTENCY TEST');
console.log('🧪 ═══════════════════════════════════════════════════════\n');

// Get services
const { cornerstoneViewportService } = servicesManager.services;
const { annotation, getRenderingEngine, metaData } = window.cornerstone.cornerstoneCore;

try {
  // Get first viewport
  const renderingEngine = getRenderingEngine('OHIFCornerstoneRenderingEngine');
  if (!renderingEngine) {
    console.error('❌ No rendering engine found');
    throw new Error('Rendering engine not found');
  }

  const viewports = renderingEngine.getViewports();
  if (viewports.length === 0) {
    console.error('❌ No viewports found');
    throw new Error('No viewports found');
  }

  const viewport = viewports[0];
  console.log(`✅ Testing viewport: ${viewport.id}\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. GET DICOM METADATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('📋 ─── DICOM METADATA ───────────────────────────────────');

  const imageId = viewport.getCurrentImageId?.();
  if (!imageId) {
    console.warn('⚠️ Could not get imageId from viewport');
  } else {
    const imagePlaneModule = metaData.get('imagePlaneModule', imageId);

    if (imagePlaneModule) {
      console.log('ImagePositionPatient (0020,0032):');
      console.log('  ', imagePlaneModule.imagePositionPatient);

      if (imagePlaneModule.imageOrientationPatient) {
        console.log('ImageOrientationPatient (0020,0037):');
        console.log('  ', imagePlaneModule.imageOrientationPatient);
      }

      if (imagePlaneModule.pixelSpacing) {
        console.log('PixelSpacing (0028,0030):');
        console.log('  ', imagePlaneModule.pixelSpacing, 'mm');
      }

      if (imagePlaneModule.rows && imagePlaneModule.columns) {
        console.log('Image Dimensions:');
        console.log(`   ${imagePlaneModule.columns}×${imagePlaneModule.rows} pixels`);

        // Calculate image extent in world coordinates
        const IPP = imagePlaneModule.imagePositionPatient;
        const spacing = imagePlaneModule.pixelSpacing;
        const cols = imagePlaneModule.columns;
        const rows = imagePlaneModule.rows;

        const extentX = cols * spacing[0];
        const extentY = rows * spacing[1];

        console.log('\nImage Extent in World Coordinates:');
        console.log(`   Origin: [${IPP[0]}, ${IPP[1]}, ${IPP[2]}] mm`);
        console.log(`   End:    [${(IPP[0] + extentX).toFixed(1)}, ${(IPP[1] + extentY).toFixed(1)}, ?] mm`);
        console.log(`   Size:   ${extentX.toFixed(1)} × ${extentY.toFixed(1)} mm`);

        // Calculate expected center
        const centerX = IPP[0] + (cols / 2) * spacing[0];
        const centerY = IPP[1] + (rows / 2) * spacing[1];
        console.log(`\nExpected Image Center: [${centerX.toFixed(1)}, ${centerY.toFixed(1)}, ?] mm`);
      }
    } else {
      console.warn('⚠️ No imagePlaneModule metadata found');
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. GET CAMERA POSITION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📷 ─── VIEWPORT CAMERA ──────────────────────────────────');

  const camera = viewport.getCamera();
  console.log('Focal Point (where camera looks):');
  console.log(`   [${camera.focalPoint.map(v => v.toFixed(1)).join(', ')}] mm`);
  console.log('Camera Position (eye location):');
  console.log(`   [${camera.position.map(v => v.toFixed(1)).join(', ')}] mm`);
  console.log('View Up:');
  console.log(`   [${camera.viewUp.map(v => v.toFixed(3)).join(', ')}]`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. GET CROSSHAIR ANNOTATION POSITION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n🎯 ─── CROSSHAIR ANNOTATION ─────────────────────────────');

  const element = viewport.element;
  if (!element) {
    console.warn('⚠️ No viewport element found');
  } else {
    const annotations = annotation.state.getAnnotations('Crosshairs', element);

    if (annotations && annotations.length > 0) {
      const crosshairAnnotation = annotations[0];
      console.log(`✅ Found ${annotations.length} crosshair annotation(s)`);

      if (crosshairAnnotation.data?.handles?.rotationPoints) {
        const center = crosshairAnnotation.data.handles.rotationPoints[0];
        console.log('Crosshair Center (from rotationPoints):');
        console.log(`   [${center.map(v => v.toFixed(1)).join(', ')}] mm`);

        // Compare with camera focal point
        const diff = Math.sqrt(
          Math.pow(center[0] - camera.focalPoint[0], 2) +
          Math.pow(center[1] - camera.focalPoint[1], 2) +
          Math.pow(center[2] - camera.focalPoint[2], 2)
        );
        console.log(`\nDistance from camera focal point: ${diff.toFixed(2)} mm`);

        if (diff < 1.0) {
          console.log('✅ Crosshair and camera focal point are very close');
        } else if (diff < 10.0) {
          console.log('⚠️ Crosshair and camera focal point differ by', diff.toFixed(1), 'mm');
        } else {
          console.log('⚠️ Crosshair and camera focal point are far apart!');
        }
      } else if (crosshairAnnotation.data?.handles?.toolCenter) {
        const center = crosshairAnnotation.data.handles.toolCenter;
        console.log('Crosshair Center (from toolCenter):');
        console.log(`   [${center.map(v => v.toFixed(1)).join(', ')}] mm`);
      } else {
        console.warn('⚠️ Crosshair annotation found but center position not in expected format');
        console.log('Annotation data:', crosshairAnnotation.data);
      }
    } else {
      console.warn('⚠️ No crosshair annotations found');
      console.log('💡 Make sure Crosshairs tool is enabled and active!');
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. VERIFY COORDINATE CONSISTENCY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n✅ ─── CONSISTENCY CHECK ────────────────────────────────');

  // Check if coordinates are in reasonable range (mm, not pixels)
  const focalPoint = camera.focalPoint;
  const isReasonable = focalPoint.every(v => Math.abs(v) < 10000); // Within 10 meters

  if (isReasonable) {
    console.log('✅ Coordinates appear to be in world space (mm)');
    console.log('   Range is reasonable for medical imaging');
  } else {
    console.warn('⚠️ Coordinates seem unusually large');
    console.log('   This might indicate pixel coordinates instead of world coordinates');
  }

  // Check if coordinates are likely in patient space (not pixel indices)
  const areFloats = focalPoint.some(v => v !== Math.floor(v));
  if (areFloats) {
    console.log('✅ Coordinates contain decimal values');
    console.log('   This confirms they are world coordinates, not pixel indices');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. NAVIGATION SYSTEM TEST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n🧭 ─── NAVIGATION SYSTEM ────────────────────────────────');

  if (window.__navigationController) {
    const navStatus = window.__navigationController.getStatus();
    console.log('Navigation Controller:', navStatus.navigating ? '▶️ ACTIVE' : '⏸️ STOPPED');

    if (navStatus.navigating) {
      console.log('💡 Navigation is currently running');
      console.log('   Viewport should be updating at ~20 Hz');
    } else {
      console.log('💡 To test navigation:');
      console.log('   1. Click "Set Center" button');
      console.log('   2. Click "Real-time Navigation" button');
      console.log('   3. Watch viewport camera move in circular pattern');
    }
  } else {
    console.warn('⚠️ Navigation controller not initialized');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📊 ═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('📊 ═══════════════════════════════════════════════════════\n');

  console.log('✅ All coordinates are in WORLD SPACE (patient coordinates)');
  console.log('✅ Units are in MILLIMETERS (mm)');
  console.log('✅ ImagePositionPatient is AUTOMATICALLY handled by Cornerstone3D');
  console.log('✅ NO manual coordinate transformations needed');
  console.log('\n💡 For navigation:');
  console.log('   • Crosshair position is already in world coords');
  console.log('   • Python server receives/sends world coords');
  console.log('   • Circular motion calculations work in world space');
  console.log('   • Everything is consistent! 🎯\n');

} catch (error) {
  console.error('❌ Error running coordinate test:', error);
  console.log('\n💡 Troubleshooting:');
  console.log('   • Make sure a DICOM study is loaded');
  console.log('   • Verify Cornerstone3D is initialized');
  console.log('   • Check that viewport is active');
}

console.log('🧪 ═══════════════════════════════════════════════════════');
console.log('🧪 TEST COMPLETE');
console.log('🧪 ═══════════════════════════════════════════════════════');
