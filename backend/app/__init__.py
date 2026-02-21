from flask import Flask
from flask_cors import CORS


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(f"app.config.{config_name.capitalize()}Config")

    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

    from app.blueprints.projects import projects_bp
    from app.blueprints.scripts import scripts_bp
    from app.blueprints.assets import assets_bp
    from app.blueprints.recordings import recordings_bp
    from app.blueprints.thumbnails import thumbnails_bp
    from app.blueprints.metadata import metadata_bp
    from app.blueprints.ideas import ideas_bp
    from app.blueprints.ai_images import ai_images_bp
    from app.blueprints.ai_text import ai_text_bp
    from app.blueprints.ai_audio import ai_audio_bp
    from app.blueprints.ai_video import ai_video_bp

    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(scripts_bp, url_prefix="/api/scripts")
    app.register_blueprint(assets_bp, url_prefix="/api/assets")
    app.register_blueprint(recordings_bp, url_prefix="/api/recordings")
    app.register_blueprint(thumbnails_bp, url_prefix="/api/thumbnails")
    app.register_blueprint(metadata_bp, url_prefix="/api/metadata")
    app.register_blueprint(ideas_bp, url_prefix="/api/ideas")
    app.register_blueprint(ai_images_bp, url_prefix="/api/ai/images")
    app.register_blueprint(ai_text_bp, url_prefix="/api/ai/text")
    app.register_blueprint(ai_audio_bp, url_prefix="/api/ai/audio")
    app.register_blueprint(ai_video_bp, url_prefix="/api/ai/video")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
