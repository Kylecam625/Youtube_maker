import base64
import uuid

from flask import Blueprint, jsonify, request

ai_images_bp = Blueprint("ai_images", __name__)


@ai_images_bp.route("/generate", methods=["POST"])
def generate_image():
    from app.services.openai_service import get_openai
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        model = data.get("model", "gpt-image-1")
        size = data.get("size", "1024x1024")
        quality = data.get("quality", "medium")
        background = data.get("background", "opaque")
        output_format = data.get("output_format", "png")

        client = get_openai()
        result = client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            quality=quality,
            background=background,
            output_format=output_format,
            n=1,
        )

        image_b64 = result.data[0].b64_json
        image_bytes = base64.b64decode(image_b64)
        storage_path = f"ai_generated/{uuid.uuid4()}.{output_format}"

        sb = get_supabase()
        sb.storage.from_("assets").upload(storage_path, image_bytes)
        public_url = sb.storage.from_("assets").get_public_url(storage_path)

        record = {
            "name": f"AI: {prompt[:60]}",
            "type": "image",
            "storage_path": storage_path,
            "supabase_url": public_url,
            "file_size": len(image_bytes),
            "ai_prompt": prompt,
            "metadata_json": {"model": model, "size": size, "quality": quality, "background": background},
            "project_id": data.get("project_id"),
        }
        asset = sb.table("assets").insert(record).execute()
        return jsonify(asset.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_images_bp.route("/edit", methods=["POST"])
def edit_image():
    from app.services.openai_service import get_openai
    from app.services.supabase_service import get_supabase

    if "image" not in request.files:
        return jsonify({"error": "image file required"}), 400

    prompt = request.form.get("prompt", "")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        image_file = request.files["image"]
        model = request.form.get("model", "gpt-image-1")
        size = request.form.get("size", "1024x1024")

        client = get_openai()
        result = client.images.edit(
            model=model,
            image=image_file,
            prompt=prompt,
            size=size,
            n=1,
        )

        image_b64 = result.data[0].b64_json
        image_bytes = base64.b64decode(image_b64)
        storage_path = f"ai_edited/{uuid.uuid4()}.png"

        sb = get_supabase()
        sb.storage.from_("assets").upload(storage_path, image_bytes)
        public_url = sb.storage.from_("assets").get_public_url(storage_path)

        record = {
            "name": f"AI Edit: {prompt[:50]}",
            "type": "image",
            "storage_path": storage_path,
            "supabase_url": public_url,
            "file_size": len(image_bytes),
            "ai_prompt": prompt,
        }
        asset = sb.table("assets").insert(record).execute()
        return jsonify(asset.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
