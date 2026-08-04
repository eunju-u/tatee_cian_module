#!/usr/bin/env python3
"""
TripoSR Open-Source 2D to 3D PyTorch Runner Script
Uses Stability AI's official open-source TripoSR neural network to convert 2D garment pictures into 3D .GLB models!
100% Free & Open Source (No API cost)
"""

import sys
import os
import argparse

def run_tripo_sr_open_source(image_path, output_glb_path):
    print(f"🤖 [TripoSR PyTorch Engine] Processing 2D Garment Image: {image_path}")
    print(f"📦 Output 3D Target File: {output_glb_path}")

    try:
        import torch
        import numpy as np
        from PIL import Image
        import trimesh

        print("✅ PyTorch & Trimesh environment detected!")

        # Attempting official TripoSR TSR module invocation
        try:
            from tsr.system import TSR
            from tsr.utils import remove_background, resize_foreground

            print("🚀 Loading Stability AI TripoSR Pre-trained Model...")
            model = TSR.from_pretrained("stabilityai/TripoSR", config_name="config.yaml", weight_name="model.ckpt")
            model.renderer.set_chunk_size(8192)
            model.to("cuda" if torch.cuda.is_available() else "cpu")

            # Remove background and process 2D garment image
            img = Image.open(image_path).convert("RGB")
            processed_img = remove_background(img)
            processed_img = resize_foreground(processed_img, 0.85)

            # Generate 3D Triplane Mesh
            with torch.no_grad():
                scene_codes = model([processed_img], device="cuda" if torch.cuda.is_available() else "cpu")
                meshes = model.extract_mesh(scene_codes)

            # Export 3D .GLB file
            meshes[0].export(output_glb_path)
            print(f"🎉 [TripoSR PyTorch] Successfully generated real 3D .GLB model: {output_glb_path}")
            return True

        except ImportError:
            print("ℹ️ 'tsr' PyTorch package not found. Run 'pip install tsr rembg trimesh' to enable local PyTorch 3D generation.")
            return False

    except ImportError as e:
        print(f"⚠️ PyTorch environment error: {e}. Falling back to API mode.")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python tripo_runner.py <input_image_path> <output_glb_path>")
        sys.exit(1)
    
    input_img = sys.argv[1]
    out_glb = sys.argv[2]

    run_tripo_sr_open_source(input_img, out_glb)
