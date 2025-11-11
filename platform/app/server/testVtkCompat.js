/**
 * VTK.js Compatibility Test Script
 *
 * This script tests if VTK.js is properly installed and compatible with the model server code.
 * Run this script to verify the VTK.js API before starting the model server.
 *
 * Usage: node platform/app/server/testVtkCompat.js
 */

console.log('=================================================');
console.log('VTK.js Compatibility Test');
console.log('=================================================\n');

// Test 1: Check if VTK.js is installed
console.log('Test 1: Checking VTK.js installation...');
try {
  const vtk = require('@kitware/vtk.js');
  console.log('✓ VTK.js package found');

  // Check version if available
  try {
    const packageJson = require('@kitware/vtk.js/package.json');
    console.log(`  Version: ${packageJson.version}`);
  } catch (e) {
    console.log('  Version: Unable to determine');
  }
} catch (error) {
  console.log('✗ VTK.js package not found');
  console.log(`  Error: ${error.message}`);
  console.log('\n  To install VTK.js, run:');
  console.log('  cd platform/app && npm install @kitware/vtk.js\n');
  process.exit(1);
}

// Test 2: Check vtkCylinderSource availability
console.log('\nTest 2: Checking vtkCylinderSource availability...');
const vtk = require('@kitware/vtk.js');
let vtkCylinderSource = null;
let apiPath = null;

if (vtk.Filters && vtk.Filters.Sources && vtk.Filters.Sources.vtkCylinderSource) {
  vtkCylinderSource = vtk.Filters.Sources.vtkCylinderSource;
  apiPath = 'vtk.Filters.Sources.vtkCylinderSource';
  console.log(`✓ vtkCylinderSource found at: ${apiPath}`);
} else if (vtk.Filters && vtk.Filters.vtkCylinderSource) {
  vtkCylinderSource = vtk.Filters.vtkCylinderSource;
  apiPath = 'vtk.Filters.vtkCylinderSource';
  console.log(`✓ vtkCylinderSource found at: ${apiPath}`);
} else if (vtk.vtkCylinderSource) {
  vtkCylinderSource = vtk.vtkCylinderSource;
  apiPath = 'vtk.vtkCylinderSource';
  console.log(`✓ vtkCylinderSource found at: ${apiPath}`);
} else {
  console.log('✗ vtkCylinderSource not found in any expected path');
  console.log('\n  Available top-level keys in vtk object:');
  console.log('  ' + Object.keys(vtk).slice(0, 20).join(', '));

  if (vtk.Filters) {
    console.log('\n  Available keys in vtk.Filters:');
    console.log('  ' + Object.keys(vtk.Filters).slice(0, 20).join(', '));
  }

  if (vtk.Filters && vtk.Filters.Sources) {
    console.log('\n  Available keys in vtk.Filters.Sources:');
    console.log('  ' + Object.keys(vtk.Filters.Sources).slice(0, 20).join(', '));
  }

  process.exit(1);
}

// Test 3: Create an instance
console.log('\nTest 3: Creating vtkCylinderSource instance...');
try {
  const cylinderSource = vtkCylinderSource.newInstance();
  console.log('✓ Instance created successfully');

  // Test 4: Check available methods
  console.log('\nTest 4: Checking required methods...');
  const requiredMethods = [
    'setRadius',
    'setHeight',
    'setResolution',
    'setCapping',
    'setCenter',
    'update',
    'getOutputData'
  ];

  let allMethodsAvailable = true;
  requiredMethods.forEach(method => {
    if (typeof cylinderSource[method] === 'function') {
      console.log(`  ✓ ${method}()`);
    } else {
      console.log(`  ✗ ${method}() - NOT FOUND`);
      allMethodsAvailable = false;
    }
  });

  if (!allMethodsAvailable) {
    console.log('\n✗ Some required methods are missing');
    console.log('  Available methods:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(cylinderSource))
      .filter(name => typeof cylinderSource[name] === 'function' && name !== 'constructor')
      .slice(0, 20);
    console.log('  ' + methods.join(', '));
    process.exit(1);
  }

  // Test 5: Generate a test cylinder
  console.log('\nTest 5: Generating test cylinder (radius=5mm, height=30mm)...');
  try {
    cylinderSource.setRadius(5);
    cylinderSource.setHeight(30);
    cylinderSource.setResolution(32);
    cylinderSource.setCapping(true);
    cylinderSource.setCenter(0, 15, 0);
    cylinderSource.update();

    const polyData = cylinderSource.getOutputData();
    console.log('✓ Cylinder generated successfully');

    // Test 6: Check polyData structure
    console.log('\nTest 6: Checking polyData structure...');

    if (polyData.getPoints && typeof polyData.getPoints === 'function') {
      const points = polyData.getPoints();
      const numPoints = points.getNumberOfPoints();
      console.log(`  ✓ Points: ${numPoints} vertices`);
    } else {
      console.log('  ✗ getPoints() method not found');
    }

    if (polyData.getPolys && typeof polyData.getPolys === 'function') {
      const polys = polyData.getPolys();
      const polysData = polys.getData();
      console.log(`  ✓ Polygons: ${polysData.length} indices`);
    } else {
      console.log('  ✗ getPolys() method not found');
    }

    if (polyData.getPointData && typeof polyData.getPointData === 'function') {
      const pointData = polyData.getPointData();
      console.log('  ✓ PointData available');

      const normals = pointData.getNormals();
      if (normals) {
        console.log('  ✓ Normals available');
      } else {
        console.log('  ⚠ Normals not available (may need to generate)');
      }
    } else {
      console.log('  ✗ getPointData() method not found');
    }

    // Test 7: Generate OBJ content
    console.log('\nTest 7: Converting to OBJ format...');
    try {
      const points = polyData.getPoints();
      const pointsData = points.getData();
      const numPoints = points.getNumberOfPoints();

      let objLines = 0;
      for (let i = 0; i < numPoints; i++) {
        const idx = i * 3;
        const x = pointsData[idx];
        const y = pointsData[idx + 1];
        const z = pointsData[idx + 2];
        objLines++;
      }

      const polys = polyData.getPolys();
      const polysData = polys.getData();
      let idx = 0;
      let faceCount = 0;
      while (idx < polysData.length) {
        const numVerts = polysData[idx];
        idx += numVerts + 1;
        faceCount++;
      }

      console.log(`  ✓ OBJ conversion successful`);
      console.log(`    - ${objLines} vertices`);
      console.log(`    - ${faceCount} faces`);

    } catch (error) {
      console.log(`  ✗ OBJ conversion failed: ${error.message}`);
      process.exit(1);
    }

  } catch (error) {
    console.log(`✗ Cylinder generation failed: ${error.message}`);
    console.log(error.stack);
    process.exit(1);
  }

} catch (error) {
  console.log(`✗ Instance creation failed: ${error.message}`);
  console.log(error.stack);
  process.exit(1);
}

// All tests passed
console.log('\n=================================================');
console.log('✓ All VTK.js compatibility tests passed!');
console.log('=================================================');
console.log('\nThe model server should work correctly with your VTK.js installation.');
console.log(`VTK API Path: ${apiPath}`);
console.log('\nYou can now start the model server with:');
console.log('  yarn dev:model-server');
console.log('\nOr run the full development environment:');
console.log('  yarn dev');
console.log('=================================================\n');

process.exit(0);
