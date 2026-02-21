import uuid

from flask import Blueprint, jsonify, request

ai_audio_bp = Blueprint("ai_audio", __name__)


@ai_audio_bp.route("/tts", methods=["POST"])
def text_to_speech():
    from app.services.openai_service import get_openai
    from app.services.supabase_service import get_supabase

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "text is required"}), 400

    try:
        voice = data.get("voice", "alloy")
        model = data.get("model", "gpt-4o-mini-tts")
        speed = data.get("speed", 1.0)
        instructions = data.get("instructions", "")
        response_format = data.get("response_format", "mp3")

        client = get_openai()
        kwargs = {
            "model": model,
            "voice": voice,
            "input": text,
            "speed": speed,
            "response_format": response_format,
        }
        if instructions and model == "gpt-4o-mini-tts":
            kwargs["instructions"] = instructions

        response = client.audio.speech.create(**kwargs)

        audio_bytes = response.content
        storage_path = f"voiceovers/{uuid.uuid4()}.{response_format}"

        sb = get_supabase()
        sb.storage.from_("assets").upload(storage_path, audio_bytes)
        public_url = sb.storage.from_("assets").get_public_url(storage_path)

        record = {
            "name": f"Voiceover: {text[:40]}...",
            "type": "audio",
            "storage_path": storage_path,
            "supabase_url": public_url,
            "file_size": len(audio_bytes),
            "metadata_json": {"voice": voice, "model": model, "speed": speed},
            "project_id": data.get("project_id"),
        }
        asset = sb.table("assets").insert(record).execute()
        return jsonify(asset.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_audio_bp.route("/transcribe", methods=["POST"])
def transcribe_audio():
    from app.services.openai_service import get_openai

    if "file" not in request.files:
        return jsonify({"error": "audio file required"}), 400

    try:
        audio_file = request.files["file"]
        model = request.form.get("model", "gpt-4o-transcribe")
        response_format = request.form.get("response_format", "json")

        client = get_openai()
        kwargs = {
            "model": model,
            "file": audio_file,
            "response_format": response_format,
        }
        if model == "gpt-4o-transcribe-diarize":
            kwargs["chunking_strategy"] = "auto"

        result = client.audio.transcriptions.create(**kwargs)

        if response_format == "json":
            return jsonify({"text": result.text})
        return jsonify({"text": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
