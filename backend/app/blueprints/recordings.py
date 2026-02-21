import uuid
from flask import Blueprint, jsonify, request

recordings_bp = Blueprint("recordings", __name__)


@recordings_bp.route("/upload", methods=["POST"])
def upload_recording():
    from app.services.supabase_service import get_supabase

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file is required"}), 400

    project_id = request.form.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    rec_type = request.form.get("type", "webcam")
    duration_seconds = int(request.form.get("duration_seconds", 0))
    take_number = int(request.form.get("take_number", 1))
    is_starred = request.form.get("is_starred", "false").lower() == "true"

    try:
        sb = get_supabase()
        filename = f"{project_id}/{uuid.uuid4().hex}.webm"
        file_bytes = file.read()
        sb.storage.from_("recordings").upload(filename, file_bytes, {"content-type": "video/webm"})
        public_url = sb.storage.from_("recordings").get_public_url(filename)

        result = sb.table("recordings").insert({
            "project_id": project_id,
            "type": rec_type,
            "storage_path": filename,
            "supabase_url": public_url,
            "duration_seconds": duration_seconds,
            "take_number": take_number,
            "is_starred": is_starred,
        }).execute()

        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recordings_bp.route("/project/<project_id>", methods=["GET"])
def list_recordings(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = (
            sb.table("recordings")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recordings_bp.route("/", methods=["POST"])
def create_recording():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("project_id"):
        return jsonify({"error": "project_id is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("recordings").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recordings_bp.route("/<recording_id>/star", methods=["PATCH"])
def toggle_star(recording_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        current = sb.table("recordings").select("is_starred").eq("id", recording_id).single().execute()
        new_val = not current.data.get("is_starred", False)
        result = sb.table("recordings").update({"is_starred": new_val}).eq("id", recording_id).execute()
        return jsonify(result.data[0])
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "recording not found"}), 404
        return jsonify({"error": str(e)}), 500


@recordings_bp.route("/<recording_id>", methods=["DELETE"])
def delete_recording(recording_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        rec = sb.table("recordings").select("storage_path").eq("id", recording_id).single().execute()
        if rec.data and rec.data.get("storage_path"):
            sb.storage.from_("recordings").remove([rec.data["storage_path"]])
        sb.table("recordings").delete().eq("id", recording_id).execute()
        return "", 204
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "recording not found"}), 404
        return jsonify({"error": str(e)}), 500
