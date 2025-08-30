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
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    startRecognitionBtn.addEventListener('click', () => {
        recognition.start();
        statusDiv.textContent = 'Listening...';
        outputDiv.textContent = 'Say a command...';
        startRecognitionBtn.disabled = true;
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        outputDiv.textContent = `You said: "${transcript}"`;
        statusDiv.textContent = 'Processing command...';
        
        // Send transcript to backend for processing
        processSpeechCommand(transcript);
    };

    recognition.onend = () => {
        statusDiv.textContent = 'Recognition ended.';
        startRecognitionBtn.disabled = false;
    };

    recognition.onerror = (event) => {
        statusDiv.textContent = `Error: ${event.error}`;
        console.error('Speech recognition error:', event.error);
        startRecognitionBtn.disabled = false;
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
        startRecognitionBtn.disabled = false;
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
        }
        // Add more action types as needed (e.g., click, fill form, etc.)
    }
});
