document.addEventListener('DOMContentLoaded', () => {
    const startRecognitionBtn = document.getElementById('startRecognition');
    const outputDiv = document.getElementById('output');
    const statusDiv = document.getElementById('status');
    const browsingFrame = document.getElementById('browsingFrame');

    if (!('webkitSpeechRecognition' in window)) {
        statusDiv.textContent = 'Speech recognition not supported. Please use Google Chrome.';
        startRecognitionBtn.disabled = true;
        return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Set to true for continuous listening
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false; // Track the listening state

    startRecognitionBtn.addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            statusDiv.textContent = 'Listening...';
            outputDiv.textContent = 'Say a command...';
            startRecognitionBtn.textContent = 'Stop Listening';
            isListening = true;
        } else {
            recognition.stop();
            statusDiv.textContent = 'Stopped listening.';
            startRecognitionBtn.textContent = 'Start Listening';
            isListening = false;
        }
        startRecognitionBtn.disabled = false; // Ensure button is not disabled during toggle
    });

    recognition.onstart = () => {
        isListening = true;
        startRecognitionBtn.textContent = 'Stop Listening';
        statusDiv.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        outputDiv.textContent = `You said: "${transcript}"`;
        statusDiv.textContent = 'Processing command...';
        
        // Send transcript to backend for processing
        processSpeechCommand(transcript);
    };

    recognition.onend = () => {
        isListening = false;
        startRecognitionBtn.textContent = 'Start Listening';
        statusDiv.textContent = 'Recognition ended.';
    };

    recognition.onerror = (event) => {
        isListening = false;
        startRecognitionBtn.textContent = 'Start Listening';
        statusDiv.textContent = `Error: ${event.error}`;
        console.error('Speech recognition error:', event.error);
    };

    async function processSpeechCommand(command) {
        try {
            const response = await fetch('http://127.0.0.1:5000/process_command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: command })
            });
            const data = await response.json();
            statusDiv.textContent = data.message;
            console.log('Backend response:', data);

            // Execute action based on backend response
            executeAction(data.action);

        } catch (error) {
            statusDiv.textContent = 'Error communicating with backend.';
            console.error('Error sending command to backend:', error);
        }
        // Do not disable the button after processing a command in continuous mode
        // startRecognitionBtn.disabled = false;
    }

    function executeAction(action) {
        if (action.type === 'navigate') {
            browsingFrame.src = action.url;
            browsingFrame.style.display = 'block'; // Show the iframe
        } else if (action.type === 'scroll') {
            // Scrolling within the iframe might be complex due to same-origin policy
            // For now, this will scroll the main window. If target is iframe, 
            // more advanced techniques like postMessage or content script injection would be needed.
            if (action.direction === 'down') {
                window.scrollBy(0, window.innerHeight / 2); // Scroll half a screen height down
            } else if (action.direction === 'up') {
                window.scrollBy(0, -window.innerHeight / 2); // Scroll half a screen height up
            }
        } else if (action.type === 'click') {
            findAndClickElement(action.target);
        } else if (action.type === 'fill') {
            fillFormField(action.field, action.value);
        }
        // Add more action types as needed (e.g., click, fill form, etc.)
    }

    function findAndClickElement(text) {
        const elements = document.querySelectorAll('button, a, input[type="submit"], [role="button"], [tabindex="0"]');
        let clicked = false;

        for (const element of elements) {
            if (element.textContent.toLowerCase().includes(text.toLowerCase())) {
                element.click();
                statusDiv.textContent = `Clicked on: ${element.textContent.trim()}`;
                clicked = true;
                break;
            }
        }

        if (!clicked) {
            statusDiv.textContent = `Could not find an element to click with text: "${text}"`;
        }
    }

    function fillFormField(fieldName, value) {
        const inputElements = document.querySelectorAll('input, textarea, select');
        let filled = false;

        for (const element of inputElements) {
            // Check for id, name, or placeholder match
            if (element.id.toLowerCase().includes(fieldName.toLowerCase()) ||
                element.name.toLowerCase().includes(fieldName.toLowerCase()) ||
                (element.placeholder && element.placeholder.toLowerCase().includes(fieldName.toLowerCase()))
            ) {
                element.value = value;
                statusDiv.textContent = `Typed \"${value}\" into field: ${element.id || element.name || element.placeholder}`;
                filled = true;
                break;
            }
        }

        if (!filled) {
            statusDiv.textContent = `Could not find a form field matching: "${fieldName}"`;
        }
    }
});
