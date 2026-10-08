from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from config import SITE_NAME, BOT_NAME
from ai import get_ai_stream

app = Flask(__name__)


@app.route("/")
def home():
    return render_template(
        "index.html",
        site_name=SITE_NAME,
        bot_name=BOT_NAME
    )


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])

    if not isinstance(messages, list) or not messages:
        return jsonify({"reply": "Please type a message first."}), 400

    safe_messages = []

    for item in messages[-20:]:
        if isinstance(item, dict) and item.get("role") in ("user", "assistant"):
            content = str(item.get("content", ""))[:6000]

            if content.strip():
                safe_messages.append({
                    "role": item["role"],
                    "content": content
                })

    if not safe_messages or safe_messages[-1]["role"] != "user":
        return jsonify({"reply": "Please send a user message."}), 400

    @stream_with_context
    def generate():
        for chunk in get_ai_stream(safe_messages):
            yield f"data: {chunk}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        threaded=True
    )

