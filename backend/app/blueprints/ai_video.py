from flask import Blueprint, jsonify, request

ai_video_bp = Blueprint("ai_video", __name__)


@ai_video_bp.route("/generate", methods=["POST"])
def generate_video():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    try:
        client = get_openai()
        result = client.videos.create(prompt=prompt)
        return jsonify({"video_id": result.id, "status": result.status}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_video_bp.route("/status/<video_id>", methods=["GET"])
def video_status(video_id: str):
    from app.services.openai_service import get_openai

    try:
        client = get_openai()
        result = client.videos.retrieve(video_id)
        return jsonify({"video_id": result.id, "status": result.status})
    except Exception as e:
        if "not found" in str(e).lower():
            return jsonify({"error": "video not found"}), 404
        return jsonify({"error": str(e)}), 500


@ai_video_bp.route("/download/<video_id>", methods=["POST"])
def download_video(video_id: str):
    import uuid

    from app.services.openai_service import get_openai
    from app.services.supabase_service import get_supabase

    try:
        client = get_openai()
        content = client.videos.retrieve_content(video_id)

        storage_path = f"ai_video/{uuid.uuid4()}.mp4"
        sb = get_supabase()
        sb.storage.from_("assets").upload(storage_path, content)
        public_url = sb.storage.from_("assets").get_public_url(storage_path)

        record = {
            "name": f"AI Video: {video_id[:20]}",
            "type": "video",
            "storage_path": storage_path,
            "supabase_url": public_url,
            "file_size": len(content),
            "project_id": (request.get_json() or {}).get("project_id"),
        }
        asset = sb.table("assets").insert(record).execute()
        return jsonify(asset.data[0]), 201
    except Exception as e:
        if "not found" in str(e).lower():
            return jsonify({"error": "video not found"}), 404
        return jsonify({"error": str(e)}), 500
