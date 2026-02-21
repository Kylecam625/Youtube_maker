from flask import Blueprint, jsonify, request

scripts_bp = Blueprint("scripts", __name__)


@scripts_bp.route("/project/<project_id>", methods=["GET"])
def list_scripts(project_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = (
            sb.table("scripts")
            .select("*")
            .eq("project_id", project_id)
            .order("version", desc=True)
            .execute()
        )
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@scripts_bp.route("/", methods=["POST"])
def create_script():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("project_id"):
        return jsonify({"error": "project_id is required"}), 400

    try:
        sb = get_supabase()

        plain_text = data.get("plain_text", "")
        word_count = len(plain_text.split())
        data["word_count"] = word_count
        data["est_duration_seconds"] = int(word_count / 2.5)

        result = sb.table("scripts").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@scripts_bp.route("/<script_id>", methods=["PATCH"])
def update_script(script_id: str):
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400

    try:
        sb = get_supabase()

        if "plain_text" in data:
            word_count = len(data["plain_text"].split())
            data["word_count"] = word_count
            data["est_duration_seconds"] = int(word_count / 2.5)

        result = sb.table("scripts").update(data).eq("id", script_id).execute()
        if not result.data:
            return jsonify({"error": "script not found"}), 404
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
