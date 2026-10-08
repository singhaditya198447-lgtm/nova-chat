import json
import urllib.request
import urllib.error

SERVER_URL = "http://127.0.0.1:8080/v1/chat/completions"


def get_ai_stream(messages):
    # Keep recent conversation only
    recent_messages = messages[-12:]

    data = {
        "messages": recent_messages,
        "max_tokens": 100,
        "temperature": 0.7,
        "stream": True
    }

    try:
        request = urllib.request.Request(
            SERVER_URL,
            data=json.dumps(data).encode("utf-8"),
            headers={
                "Content-Type": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=120) as response:
            for line in response:
                line = line.decode("utf-8").strip()

                if not line or not line.startswith("data:"):
                    continue

                data_line = line[5:].strip()

                if data_line == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_line)
                    content = (
                        chunk.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content", "")
                    )

                    if content:
                        yield content

                except json.JSONDecodeError:
                    continue

    except urllib.error.URLError as e:
        print("AI server error:", e)
        yield "AI server is not running. Please start llama-server first."

    except Exception as e:
        print("AI error:", e)
        yield "Sorry, the local AI could not generate a response."

