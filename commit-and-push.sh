#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "🚀 Committing and Pushing Viewers Changes"
echo "═══════════════════════════════════════════════════════"
echo ""

cd /home/asclepius/github/Viewers

echo "📋 Current status:"
git status -s
echo ""

echo "➕ Adding changes..."
git add -A

echo "💾 Committing..."
git commit -m "feat: Implement fiducial crosshair jump and measurement save/load

- Add fiducial jump feature: click fiducial in measurement table to move crosshairs
- Fix viewport reference errors for FiducialMarker handling
- Fix viewport iteration (Map vs Array) in jumpToMeasurementViewport
- Update API endpoints from surgical_case to syncforge
- Implement JSON measurement save/load functionality
- Add recreateAnnotationsFromJSON utility for loading saved measurements
- Update CSV/JSON save utilities to use new syncforge API endpoints
- Remove old syncforge folder (moved to ModularPlatformPrototype)"

echo ""
echo "📤 Pushing to origin navigation-viewer..."
git push origin navigation-viewer

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Viewers repository updated!"
echo "═══════════════════════════════════════════════════════"
