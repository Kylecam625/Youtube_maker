from flask import Blueprint, jsonify, request

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/", methods=["GET"])
def list_projects():
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = sb.table("projects").select("*").order("created_at", desc=True).execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/", methods=["POST"])
def create_project():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("projects").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/<project_id>", methods=["GET"])
def get_project(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = sb.table("projects").select("*").eq("id", project_id).single().execute()
        if not result.data:
            return jsonify({"error": "project not found"}), 404
        return jsonify(result.data)
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "project not found"}), 404
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/<project_id>", methods=["PATCH"])
def update_project(project_id: str):
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("projects").update(data).eq("id", project_id).execute()
        if not result.data:
            return jsonify({"error": "project not found"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@projects_bp.route("/<project_id>", methods=["DELETE"])
def delete_project(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        sb.table("projects").delete().eq("id", project_id).execute()
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500
