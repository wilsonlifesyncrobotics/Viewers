import json
from pathlib import Path
import os 
import numpy as np

frameOfReferenceUID="1.2.826.0.1.3680043.8.498.11285705374895339963569694290012006948"
volumeId="cornerstoneStreamingImageVolume:default"
parallelScale=234.20727282007405
camera_distance=350

def calculate_camera_position(focal_pt, view_normal, distance):
    """Camera looks toward the focal point along the negative view normal"""
    return focal_pt + view_normal * distance

# Helper function to calculate in-plane vector 2 (cross product)
def calculate_inplane_vector2(view_up, view_normal):
    """Calculate the second in-plane vector perpendicular to both view up and view normal"""
    vec2 = np.cross(view_up, view_normal)
    return vec2 / np.linalg.norm(vec2)  # Normalize
    
source_dir = r"C:\slicer_data"


# Path to the JSON file (same filename as provided)
json_path = Path(os.path.join(source_dir, "transformation.json"))

# Read and parse JSON
with json_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

# Access top-level keys
L1R = data.get("L1R", {})
L1L = data.get("L1L", {})
ijkToRas = data.get("ijkToRas", [])

# Example: extract matrices, radius, length
L1R_matrix = L1R.get("matrix", [])
L1R_radius = L1R.get("radius")
L1R_length = L1R.get("length")

L1L_matrix = L1L.get("matrix", [])
L1L_radius = L1L.get("radius")
L1L_length = L1L.get("length")

# Print a quick summary
print("L1R radius:", L1R_radius)
print("L1R length:", L1R_length)
print("L1R 4x4 matrix:")
for row in L1R_matrix:
    print(row)

# print("\nL1L radius:", L1L_radius)
# print("L1L length:", L1L_length)
# print("L1L 4x4 matrix:")
# for row in L1L_matrix:
#     print(row)

print("\nijkToRas 4x4 matrix:")
for row in ijkToRas:
    print(row)

screw_name = "L1R"

axial_viewup = np.array(L1R_matrix)[0:3, 1]
# viewup = np.array([0, 0, 1])
# planeNormal = np.array(L1R_matrix)[0:3, 0]
axial_planeNormal = np.array([0, 0, 1])
# focalPoint = np.array(L1R_matrix)[0:3, 3]
focalPoint = np.array([-21.979, 54, -658])

position = calculate_camera_position(focalPoint, axial_planeNormal, camera_distance)
viewport_rotation = 0

axial_slice_index = 1425
axial_inplane_vec2 = calculate_inplane_vector2(axial_viewup, 
                                               axial_planeNormal)

axial_viewport = {
        "frameOfReferenceUID": frameOfReferenceUID,
        "camera": {
            "viewUp": axial_viewup.tolist(),
            "viewPlaneNormal": axial_planeNormal.tolist(),
            "position": position.tolist(),
            "focalPoint": focalPoint.tolist(),
            "parallelProjection": True,
            "parallelScale": parallelScale,
            "viewAngle": 90,
            "flipHorizontal": False,
            "flipVertical": False,
            "rotation": viewport_rotation
        },
        "viewReference": {
            "FrameOfReferenceUID": frameOfReferenceUID,
            "cameraFocalPoint": focalPoint.tolist(),
            "viewPlaneNormal": axial_planeNormal.tolist(),
            "viewUp": axial_viewup.tolist(),
            "sliceIndex": axial_slice_index,
            "planeRestriction": {
                "FrameOfReferenceUID": frameOfReferenceUID,
                "point": focalPoint.tolist(),
                "inPlaneVector1": axial_viewup.tolist(),
                "inPlaneVector2": {
                    "0": float(axial_inplane_vec2[0]),
                    "1": float(axial_inplane_vec2[1]),
                    "2": float(axial_inplane_vec2[2])
                }
            },
            "volumeId": volumeId
        },
        "viewPresentation": {
            "rotation": viewport_rotation,
            "zoom": 1,
            "pan": [0, 0],
            "flipHorizontal": False,
            "flipVertical": False
        },
        "metadata": {
            "viewportId": "mpr-axial",
            "viewportType": "orthographic",
            "renderingEngineId": "OHIFCornerstoneRenderingEngine",
            "zoom": 1,
            "pan": [0, 0]
        }
    }



# sagittal_view_normal = np.array(L1R_matrix)[0:3, 2]
sagittal_view_normal = np.array([1,0,0])
sagittal_view_up = np.array(L1R_matrix)[0:3, 0]



sagittal_camera_position = calculate_camera_position(focalPoint, sagittal_view_normal, camera_distance)
sagittal_inplane_vec2 = calculate_inplane_vector2(sagittal_view_up, sagittal_view_normal)
sagittal_slice_index = 526



sagittal_viewport = {
    "frameOfReferenceUID": frameOfReferenceUID,
    "camera": {
        "viewUp": sagittal_view_up.tolist(),
        "viewPlaneNormal": sagittal_view_normal.tolist(),
        "position": sagittal_camera_position.tolist(),
        "focalPoint": focalPoint.tolist(),
        "parallelProjection": True,
        "parallelScale": parallelScale,
        "viewAngle": 90,
        "flipHorizontal": False,
        "flipVertical": False,
        "rotation": viewport_rotation
    },
    "viewReference": {
        "FrameOfReferenceUID": frameOfReferenceUID,
        "cameraFocalPoint": focalPoint.tolist(),
        "viewPlaneNormal": sagittal_view_normal.tolist(),
        "viewUp": sagittal_view_up.tolist(),
        "sliceIndex": sagittal_slice_index,
        "planeRestriction": {
            "FrameOfReferenceUID": frameOfReferenceUID,
            "point": focalPoint.tolist(),
            "inPlaneVector1": sagittal_view_up.tolist(),
            "inPlaneVector2": {
                "0": float(sagittal_inplane_vec2[0]),
                "1": float(sagittal_inplane_vec2[1]),
                "2": float(sagittal_inplane_vec2[2])
            }
        },
        "volumeId": volumeId
    },
    "viewPresentation": {
        "rotation": viewport_rotation,
        "zoom": 1,
        "pan": [0, 0],
        "flipHorizontal": False,
        "flipVertical": False
    },
    "metadata": {
        "viewportId": "mpr-sagittal",
        "viewportType": "orthographic",
        "renderingEngineId": "OHIFCornerstoneRenderingEngine",
        "zoom": 1,
        "pan": [0, 0]
    }
}



coronal_view_normal = np.array(L1R_matrix)[0:3, 1]
coronal_view_up = np.array(L1R_matrix)[0:3, 0]


coronal_camera_position = calculate_camera_position(focalPoint, coronal_view_normal, camera_distance)
coronal_inplane_vec2 = calculate_inplane_vector2(coronal_view_up, coronal_view_normal)
coronal_slice_index = 446



coronal_viewport = {
    "frameOfReferenceUID": frameOfReferenceUID,
    "camera": {
        "viewUp": coronal_view_up.tolist(),
        "viewPlaneNormal": coronal_view_normal.tolist(),
        "position": coronal_camera_position.tolist(),
        "focalPoint": focalPoint.tolist(),
        "parallelProjection": True,
        "parallelScale": parallelScale,
        "viewAngle": 90,
        "flipHorizontal": False,
        "flipVertical": False,
        "rotation": viewport_rotation
    },
    "viewReference": {
        "FrameOfReferenceUID": frameOfReferenceUID,
        "cameraFocalPoint": focalPoint.tolist(),
        "viewPlaneNormal": coronal_view_normal.tolist(),
        "viewUp": coronal_view_up.tolist(),
        "sliceIndex": coronal_slice_index,
        "planeRestriction": {
            "FrameOfReferenceUID": frameOfReferenceUID,
            "point": focalPoint.tolist(),
            "inPlaneVector1": coronal_view_up.tolist(),
            "inPlaneVector2": {
                "0": float(coronal_inplane_vec2[0]),
                "1": float(coronal_inplane_vec2[1]),
                "2": float(coronal_inplane_vec2[2])
            }
        },
        "volumeId": volumeId
    },
    "viewPresentation": {
        "rotation": viewport_rotation,
        "zoom": 1,
        "pan": [0, 0],
        "flipHorizontal": False,
        "flipVertical": False
    },
    "metadata": {
        "viewportId": "mpr-coronal",
        "viewportType": "orthographic",
        "renderingEngineId": "OHIFCornerstoneRenderingEngine",
        "zoom": 1,
        "pan": [0, 0]
    }
}

# Generate timestamp
from datetime import datetime
timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

# Combine all viewports into final output
viewport_snapshot = {
    "name": screw_name,
    "timestamp": timestamp,
    "viewports": [axial_viewport, sagittal_viewport, coronal_viewport]
}

# formatting
viewport_snapshots = [[screw_name, viewport_snapshot]]

# Save to JSON file
output_file = os.path.join(source_dir, f'viewport_{screw_name}.json')

with open(output_file, 'w') as f:
    json.dump(viewport_snapshots, f, indent=2)
