import uuid

from flask import Blueprint, jsonify, request

assets_bp = Blueprint("assets", __name__)


@assets_bp.route("/", methods=["GET"])
def list_assets():
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        query = sb.table("assets").select("*").order("created_at", desc=True)

        asset_type = request.args.get("type")
        project_id = request.args.get("project_id")
        folder_id = request.args.get("folder_id")
        search = request.args.get("search")

        if asset_type:
            query = query.eq("type", asset_type)
        if project_id:
            query = query.eq("project_id", project_id)
        if folder_id:
            query = query.eq("folder_id", folder_id)
        if search:
            query = query.ilike("name", f"%{search}%")

        result = query.execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@assets_bp.route("/upload", methods=["POST"])
def upload_asset():
    from app.services.supabase_service import get_supabase

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    try:
        sb = get_supabase()

        file = request.files["file"]
        asset_type = request.form.get("type", "image")
        project_id = request.form.get("project_id")
        tags = request.form.get("tags", "").split(",") if request.form.get("tags") else []

        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
        storage_path = f"{asset_type}s/{uuid.uuid4()}.{ext}"

        file_bytes = file.read()
        sb.storage.from_("assets").upload(storage_path, file_bytes)
        public_url = sb.storage.from_("assets").get_public_url(storage_path)

        record = {
            "name": file.filename,
            "type": asset_type,
            "storage_path": storage_path,
            "supabase_url": public_url,
            "file_size": len(file_bytes),
            "tags": tags,
            "project_id": project_id,
        }
        result = sb.table("assets").insert(record).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@assets_bp.route("/<asset_id>", methods=["DELETE"])
def delete_asset(asset_id: str):
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        asset = sb.table("assets").select("storage_path").eq("id", asset_id).single().execute()
        if asset.data and asset.data.get("storage_path"):
            sb.storage.from_("assets").remove([asset.data["storage_path"]])
        sb.table("assets").delete().eq("id", asset_id).execute()
        return "", 204
    except Exception as e:
        if "0 rows" in str(e).lower():
            return jsonify({"error": "asset not found"}), 404
        return jsonify({"error": str(e)}), 500


@assets_bp.route("/folders", methods=["GET"])
def list_folders():
    from app.services.supabase_service import get_supabase

    try:
        sb = get_supabase()
        result = sb.table("asset_folders").select("*").order("name").execute()
        return jsonify(result.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@assets_bp.route("/folders", methods=["POST"])
def create_folder():
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    try:
        sb = get_supabase()
        result = sb.table("asset_folders").insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
