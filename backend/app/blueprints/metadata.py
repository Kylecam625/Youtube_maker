from flask import Blueprint, jsonify, request

metadata_bp = Blueprint("metadata", __name__)


@metadata_bp.route("/project/<project_id>", methods=["GET"])
def get_metadata(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = (
            sb.table("video_metadata")
            .select("*")
            .eq("project_id", project_id)
            .maybe_single()
            .execute()
        )
        return jsonify(result.data or {})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@metadata_bp.route("/project/<project_id>", methods=["PUT"])
def upsert_metadata(project_id: str):
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400

    try:
        sb = get_supabase()
        data["project_id"] = project_id
        result = sb.table("video_metadata").upsert(data, on_conflict="project_id").execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
