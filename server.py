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

    response_message, action = interpret_command(command)

    return jsonify({"message": response_message, "action": action})

def interpret_command(command):
    action = {"type": "none"}
    response_message = ""

    command_lower = command.lower()

    if "scroll down" in command_lower:
        response_message += "Scrolling down.\n"
        action = {"type": "scroll", "direction": "down"}
    elif "scroll up" in command_lower:
        response_message += "Scrolling up.\n"
        action = {"type": "scroll", "direction": "up"}
    elif "go to" in command_lower or "navigate to" in command_lower or "open" in command_lower:
        url_keywords = ["go to ", "navigate to ", "open "]
        url = None
        for keyword in url_keywords:
            if keyword in command_lower:
                parts = command_lower.split(keyword)
                if len(parts) > 1:
                    url = parts[1].strip()
                    break

        if url:
            if not url.startswith("http"): # Basic URL validation
                url = "https://" + url
            response_message += f"Navigating to {url}.\n"
            action = {"type": "navigate", "url": url}
        else:
            response_message += "Please specify a URL to navigate to.\n"
    elif "click" in command_lower:
        click_keywords = ["click ", "click the ", "select ", "press "]
        target = None
        for keyword in click_keywords:
            if keyword in command_lower:
                parts = command_lower.split(keyword)
                if len(parts) > 1:
                    target = parts[1].strip()
                    break

        if target:
            response_message += f"Attempting to click: {target}.\n"
            action = {"type": "click", "target": target}
        else:
            response_message += "Please specify what to click.\n"
    elif ("type" in command_lower or "enter" in command_lower) and ("into" in command_lower or "in the" in command_lower):
        type_split_keywords = ["type ", "enter "]
        into_split_keywords = [" into ", " in the "]
        
        value = None
        field = None

        for type_keyword in type_split_keywords:
            if type_keyword in command_lower:
                parts_after_type = command_lower.split(type_keyword, 1)
                if len(parts_after_type) > 1:
                    remaining_command = parts_after_type[1]
                    for into_keyword in into_split_keywords:
                        if into_keyword in remaining_command:
                            parts_after_into = remaining_command.split(into_keyword, 1)
                            if len(parts_after_into) == 2:
                                value = parts_after_into[0].strip()
                                field = parts_after_into[1].strip()
                                break
                    if value and field:
                        break
            if value and field:
                break

        if value and field:
            response_message += f"Attempting to type \"{value}\" into field: {field}.\n"
            action = {"type": "fill", "field": field, "value": value}
        else:
            response_message += "Please specify what to type and into which field (e.g., 'type hello into name' or 'enter password in the password field').\n"
    else:
        response_message = f"Command \"{command}\" not recognized.\n"

    return response_message, action

if __name__ == '__main__':
    app.run(debug=True)
