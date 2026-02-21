from flask import Blueprint, jsonify, request

ideas_bp = Blueprint("ideas", __name__)


@ideas_bp.route("/", methods=["GET"])
def list_ideas():
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = sb.table("ideas").select("*").order("created_at", desc=True).execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ideas_bp.route("/", methods=["POST"])
def create_idea():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("ideas").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ideas_bp.route("/<idea_id>", methods=["PATCH"])
def update_idea(idea_id: str):
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("ideas").update(data).eq("id", idea_id).execute()
        if not result.data:
            return jsonify({"error": "idea not found"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ideas_bp.route("/<idea_id>/promote", methods=["POST"])
def promote_idea(idea_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        idea = sb.table("ideas").select("*").eq("id", idea_id).single().execute()
        project = sb.table("projects").insert({
            "title": idea.data["title"],
            "description": idea.data.get("notes", ""),
            "status": "idea",
        }).execute()
        sb.table("ideas").update({
            "status": "promoted",
            "promoted_project_id": project.data[0]["id"],
        }).eq("id", idea_id).execute()
        return jsonify(project.data[0]), 201
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "idea not found"}), 404
        return jsonify({"error": str(e)}), 500


@ideas_bp.route("/<idea_id>", methods=["DELETE"])
def delete_idea(idea_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        sb.table("ideas").delete().eq("id", idea_id).execute()
        return "", 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500
