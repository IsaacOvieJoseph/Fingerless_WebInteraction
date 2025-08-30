from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/process_command', methods=['POST'])
def process_command():
    data = request.json
    command = data.get('command')

    # In a real application, you'd use an AI/NLP model here to interpret the command.
    # For now, let's do a simple keyword-based interpretation.
    response_message = f"Received command: \"{command}\".\n"
    action = {"type": "none"}

    if "scroll down" in command.lower():
        response_message += "Scrolling down.\n"
        action = {"type": "scroll", "direction": "down"}
    elif "scroll up" in command.lower():
        response_message += "Scrolling up.\n"
        action = {"type": "scroll", "direction": "up"}
    elif "go to" in command.lower():
        parts = command.lower().split("go to ")
        if len(parts) > 1:
            url = parts[1].strip()
            if not url.startswith("http"): # Basic URL validation
                url = "https://" + url
            response_message += f"Navigating to {url}.\n"
            action = {"type": "navigate", "url": url}
        else:
            response_message += "Please specify a URL to navigate to.\n"

    return jsonify({"message": response_message, "action": action})

if __name__ == '__main__':
    app.run(debug=True)
