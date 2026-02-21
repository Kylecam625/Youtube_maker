from flask import Blueprint, jsonify, request

thumbnails_bp = Blueprint("thumbnails", __name__)


@thumbnails_bp.route("/project/<project_id>", methods=["GET"])
def list_thumbnails(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = (
            sb.table("thumbnails")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thumbnails_bp.route("/", methods=["POST"])
def create_thumbnail():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("project_id"):
        return jsonify({"error": "project_id is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("thumbnails").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thumbnails_bp.route("/<thumbnail_id>/primary", methods=["PATCH"])
def set_primary(thumbnail_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        thumb = sb.table("thumbnails").select("project_id").eq("id", thumbnail_id).single().execute()
        pid = thumb.data["project_id"]
        sb.table("thumbnails").update({"is_primary": False}).eq("project_id", pid).execute()
        result = sb.table("thumbnails").update({"is_primary": True}).eq("id", thumbnail_id).execute()
        return jsonify(result.data[0])
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "thumbnail not found"}), 404
        return jsonify({"error": str(e)}), 500
