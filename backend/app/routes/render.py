import base64
import os
from fastapi import APIRouter, UploadFile
from dotenv import load_dotenv

from openai import OpenAI
import trimesh
import logging
import pyrender
import numpy as np
from PIL import Image
import glob

load_dotenv()


app = APIRouter()
client = OpenAI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def analyze_glb(file):
    try:
        mesh = trimesh.load_mesh(file, file_type="glb", force="mesh")
    except Exception as e:
        logger.error(f"Failed to load mesh: {e}")
        return {"error": f"Failed to load mesh: {e}"}

    # Check for mesh validity
    if hasattr(mesh, "vertices") and (np.isnan(mesh.vertices).any() or np.isinf(mesh.vertices).any()):
        logger.error("Mesh contains NaN or infinite values in vertices.")
        return {"error": "Mesh contains NaN or infinite values in vertices."}
    if hasattr(mesh, "faces") and (len(mesh.faces) == 0):
        logger.error("Mesh has no faces.")
        return {"error": "Mesh has no faces."}
    if hasattr(mesh, "is_watertight") and not mesh.is_watertight:
        logger.warning("Mesh is not watertight. Proceeding, but rendering may fail.")

    info = {
        "is_scene": isinstance(mesh, trimesh.Scene),
        "geometry_count": len(mesh.geometry) if isinstance(mesh, trimesh.Scene) else 1,
        "bounding_box": mesh.bounds.tolist(),
        "extents": mesh.extents.tolist() if hasattr(mesh, "extents") else None,
        "vertices": len(mesh.vertices) if hasattr(mesh, "vertices") else 0,
        "faces": len(mesh.faces) if hasattr(mesh, "faces") else 0,
    }
    if isinstance(mesh, trimesh.Scene):
        combined = mesh.dump().sum()
    else:
        combined = mesh

    # Model center and size
    center = combined.bounding_box.centroid
    size = combined.bounding_box.extents
    distance = max(size) * 2.5

    os.makedirs("renders", exist_ok=True)
    viewpoints = {
        "front": (0, 10),
        "back": (180, 10),
        "left": (90, 10),
        "right": (-90, 10),
        "top": (0, 90),
        "bottom": (0, -90),
        "angled": (45, 30),
    }

    def get_camera_pose(azimuth_deg, elevation_deg, distance, center):
        az = np.radians(azimuth_deg)
        el = np.radians(elevation_deg)
        x = distance * np.cos(el) * np.sin(az)
        y = distance * np.sin(el)
        z = distance * np.cos(el) * np.cos(az)
        position = np.array([x, y, z]) + center

        forward = center - position
        forward /= np.linalg.norm(forward)

        if abs(elevation_deg) == 90:
            up = np.array([0, 0, 1 if elevation_deg > 0 else -1])
        else:
            up = np.array([0, 1, 0])

        right = np.cross(forward, up)
        right /= np.linalg.norm(right)
        true_up = np.cross(right, forward)

        pose = np.eye(4)
        pose[:3, 0] = right
        pose[:3, 1] = true_up
        pose[:3, 2] = -forward
        pose[:3, 3] = position
        return pose

    renderer = pyrender.OffscreenRenderer(viewport_width=800, viewport_height=800)

    for name, (az, el) in viewpoints.items():
        scene = pyrender.Scene()
        try:
            mesh_to_add = pyrender.Mesh.from_trimesh(combined, smooth=False)
            scene.add(mesh_to_add)
        except Exception as e:
            logger.error(f"Failed to add mesh to scene: {e}")
            continue
        camera = pyrender.PerspectiveCamera(yfov=np.pi / 3.0)
        pose = get_camera_pose(az, el, distance, center)
        scene.add(camera, pose=pose)
        light = pyrender.DirectionalLight(color=np.ones(3), intensity=3.0)
        scene.add(light, pose=pose)
        try:
            color, _ = renderer.render(scene)
            Image.fromarray(color).save(f"renders/{name}.png")
        except np.linalg.LinAlgError as e:
            logger.error(f"Rendering failed for view {name}: {e}")
            continue
        except Exception as e:
            logger.error(f"Unexpected error during rendering for view {name}: {e}")
            continue
    renderer.delete()

    return info


@app.post("/render")
async def render(file: UploadFile):
    """
    Render a 3D model from the uploaded file using openai
    """
    # Creates images in renders folder
    await analyze_glb(file.file)

    # Upload rendered images to OpenAI and request DALL·E to create a 3D render

    # Collect all rendered image paths
    render_paths = sorted(glob.glob("renders/*.png"))

    # Upload images to OpenAI and collect file IDs
    uploaded_file_ids = []
    for path in render_paths:
        with open(path, "rb") as img_file:
            uploaded = client.files.create(file=img_file, purpose="user_data")
            uploaded_file_ids.append(uploaded.id)

    # Compose prompt for DALL·E
    prompt = """
        Given these multiple view renders of a 3D object that represents a design for an Unmanned Aerial Vehicle (UAV),
        create a realistic 3D render of the object as if it were photographed in a studio.
        
        The final design should look practical and functional, suitable for a UAV.
        The renders include views from the front, back, left, right, top, bottom, and an angled view.
        The object should be detailed and realistic, with a focus on the UAV's design features.
        The final render should be a high-quality image that captures the essence of the UAV design.
    """

    # Call DALL·E with the uploaded images
    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": prompt,
                    },
                    *[
                        {
                            "type": "input_image",
                            "file_id": file_id,
                        }
                        for file_id in uploaded_file_ids
                    ],
                ],
            }
        ],
        tools=[{"type": "image_generation"}],
    )
    image_generation_calls = [
        output for output in response.output if output.type == "image_generation_call"
    ]
    image_data = [output.result for output in image_generation_calls]

    if image_data:
        image_base64 = image_data[0]
        with open("final-render.png", "wb") as f:
            f.write(base64.b64decode(image_base64))
    else:
        print(response.output.content)
