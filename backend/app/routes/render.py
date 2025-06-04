import base64
import os
import shutil
from textwrap import dedent
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from openai import OpenAI
from sqlmodel import Session, select
import trimesh
from trimesh.exchange.stl import load_stl
from trimesh.exchange.gltf import load_glb, load_gltf
import logging
import pyrender
import numpy as np
from PIL import Image
import glob

from app.main import get_session
from app.models import Attachment

load_dotenv()


app = APIRouter()
client = OpenAI()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s:%(lineno)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def analyze_glb(file_path, file_type):
    try:
        if file_type.lower() == "glb":
            mesh = trimesh.load(file_path, force="scene")
        else:
            mesh = trimesh.load_mesh(file_path)
    except Exception as e:
        logger.exception(f"Failed to load mesh")
        return {"error": f"Failed to load mesh: {e}"}

    # Check for mesh validity
    if hasattr(mesh, "vertices") and (
        np.isnan(mesh.vertices).any() or np.isinf(mesh.vertices).any()
    ):
        logger.error("Mesh contains NaN or infinite values in vertices.")
        return {"error": "Mesh contains NaN or infinite values in vertices."}
    if hasattr(mesh, "faces") and (len(mesh.faces) == 0):
        logger.error("Mesh has no faces.")
        return {"error": "Mesh has no faces."}
    if hasattr(mesh, "is_watertight") and not mesh.is_watertight:
        logger.warning("Mesh is not watertight. Proceeding, but rendering may fail.")

    if isinstance(mesh, trimesh.Scene):
        meshes = [g for g in mesh.dump()]
        combined = trimesh.util.concatenate(meshes)
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

        # Right-hand coordinate system
        right = np.cross(forward, up)
        if np.linalg.norm(right) < 1e-6:
            right = np.array([1, 0, 0])  # fallback
        else:
            right /= np.linalg.norm(right)

        true_up = np.cross(right, forward)

        # Build 4x4 pose matrix
        pose = np.eye(4)
        pose[:3, 0] = right
        pose[:3, 1] = true_up
        pose[:3, 2] = -forward  # camera looks along -Z
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
        if not np.isfinite(pose).all():
            logger.error(f"Invalid pose matrix for view {name}: contains NaN or Inf.")
            continue
        scene.add(
            camera, pose=pose
        )  # Fails here numpy.linalg.LinAlgError: Eigenvalues did not converge
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
    return {}


@app.post("/render/{attachment_id}")
async def render(
    attachment_id: int,
    session: Session = Depends(get_session),
):
    """
    Render a 3D model from the uploaded file using openai
    """
    attachment = session.exec(
        select(Attachment).where(Attachment.id == attachment_id)
    ).first()

    logger.info(f"Analyzing {attachment.file_url}")

    # Creates images in renders folder
    metadata = await analyze_glb(attachment.file_url, attachment.file_type)
    if "error" in metadata:
        raise HTTPException(status_code=500, detail=metadata["error"])

    # Collect all rendered image paths
    render_paths = sorted(glob.glob("renders/*.png"))

    if not render_paths:
        raise HTTPException(
            status_code=500,
            detail="No rendered images found. Ensure the model is valid and rendering was successful.",
        )

    # Upload images to OpenAI and collect file IDs
    uploaded_file_ids = []
    for path in render_paths:
        with open(path, "rb") as img_file:
            uploaded = client.files.create(file=img_file, purpose="user_data")
            uploaded_file_ids.append(uploaded.id)

    # Compose prompt for DALL·E
    prompt = dedent("""
        Given a complete set of reference images (front, back, left, right, top, bottom, and an angled perspective) of a 3D-model generate a high-quality, photorealistic render as if it were professionally photographed in a studio environment.

        The final image should:
        - Use realistic materials (e.g., matte composites, brushed metal, polycarbonate) with subtle lighting and shadows.

        - Be composed with a clean background (e.g., gradient gray or studio white) and soft reflections to enhance depth.
        
        - Contain the entire model in the frame, ensuring all angles are visible and well-lit.

        This render should visually communicate the object's readiness for real-world application, balancing aesthetics with realism and technical credibility.
    """)

    logger.info("Uploading images and generating render...")
    response = client.responses.create(
        model="gpt-4.1-mini",
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

    logger.info("Render generation completed.")
    dir_path = "renders"
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        shutil.rmtree(dir_path)
    if image_data:
        image_base64 = image_data[0]
        with open("final-render.png", "wb") as f:
            f.write(base64.b64decode(image_base64))
        return FileResponse(
            "final-render.png",
            media_type="image/png",
            filename="render.png",
        )
    else:
        print(response.output.content)
