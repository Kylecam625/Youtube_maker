from flask import Blueprint, jsonify, request

ai_text_bp = Blueprint("ai_text", __name__)


@ai_text_bp.route("/generate-script", methods=["POST"])
def generate_script():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    topic = data.get("topic", "")
    if not topic:
        return jsonify({"error": "topic is required"}), 400

    try:
        outline = data.get("outline", "")
        tone = data.get("tone", "conversational")

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional YouTube scriptwriter. Generate well-structured "
                        "scripts with sections: Hook, Intro, Body (with subsections), CTA, Outro. "
                        "Use a {tone} tone. Include B-roll suggestions in [B-ROLL: description] format. "
                        "Return valid JSON with keys: title, sections (array of {heading, content, "
                        "b_roll_suggestions})."
                    ).format(tone=tone),
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\nOutline: {outline}\n\nGenerate a full YouTube script.",
                },
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"script": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_text_bp.route("/generate-hooks", methods=["POST"])
def generate_hooks():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    topic = data.get("topic", "")
    if not topic:
        return jsonify({"error": "topic is required"}), 400

    try:
        script_preview = data.get("script_preview", "")

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate 5 attention-grabbing YouTube video hooks (opening lines for the first "
                        "30 seconds). Each hook should use a different strategy: question, bold statement, "
                        "story, statistic, or controversy. Return JSON with key 'hooks' as an array of "
                        "{strategy, text, estimated_seconds}."
                    ),
                },
                {"role": "user", "content": f"Topic: {topic}\nScript preview: {script_preview}"},
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"hooks": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_text_bp.route("/optimize-title", methods=["POST"])
def optimize_title():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    current_title = data.get("title", "")
    if not current_title:
        return jsonify({"error": "title is required"}), 400

    try:
        topic = data.get("topic", "")

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a YouTube SEO expert. Optimize the given title for click-through rate. "
                        "Return JSON: {optimized_titles: [{title, score (1-10), reasoning}], "
                        "seo_keywords: [string]}."
                    ),
                },
                {"role": "user", "content": f"Current title: {current_title}\nTopic: {topic}"},
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"result": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_text_bp.route("/generate-description", methods=["POST"])
def generate_description():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    title = data.get("title", "")
    if not title:
        return jsonify({"error": "title is required"}), 400

    try:
        script_summary = data.get("script_summary", "")
        chapters = data.get("chapters", [])

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate an SEO-optimized YouTube description. Include: summary paragraph, "
                        "chapter timestamps if provided, relevant hashtags, and a call to action. "
                        "Return JSON: {description, hashtags: [string]}."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Title: {title}\nSummary: {script_summary}\nChapters: {chapters}",
                },
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"result": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_text_bp.route("/suggest-tags", methods=["POST"])
def suggest_tags():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    title = data.get("title", "")
    if not title:
        return jsonify({"error": "title is required"}), 400

    try:
        description = data.get("description", "")

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Suggest 15-20 YouTube tags optimized for discoverability. "
                        "Return JSON: {tags: [{tag, relevance_score (1-10)}]}."
                    ),
                },
                {"role": "user", "content": f"Title: {title}\nDescription: {description}"},
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"result": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_text_bp.route("/repurpose", methods=["POST"])
def repurpose_content():
    from app.services.openai_service import get_openai

    data = request.get_json()
    if not data:
        return jsonify({"error": "request body is required"}), 400
    script = data.get("script", "")
    if not script:
        return jsonify({"error": "script is required"}), 400

    try:
        target_format = data.get("format", "tweet_thread")

        format_instructions = {
            "tweet_thread": "a Twitter/X thread of 5-10 tweets",
            "blog_post": "a blog post with headers, intro, body, conclusion",
            "linkedin_post": "a professional LinkedIn post",
            "short_form_script": "a 60-second short-form video script (YouTube Shorts/TikTok/Reels)",
        }
        instruction = format_instructions.get(target_format, "a social media post")

        client = get_openai()
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"Repurpose the following YouTube script into {instruction}. Return JSON with key 'content'.",
                },
                {"role": "user", "content": script},
            ],
            response_format={"type": "json_object"},
        )
        return jsonify({"result": resp.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
