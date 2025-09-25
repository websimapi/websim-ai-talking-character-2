let currentCharacterFrames = { neutral: null, talking: null };
let isGenerating = false;
let isSpeaking = false;
let talkInterval = null;

const characterImg = document.getElementById('character');
const mouthOverlay = document.getElementById('mouthOverlay');
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const speakBtn = document.getElementById('speakBtn');
const status = document.getElementById('status');

generateBtn.addEventListener('click', generateCharacter);
speakBtn.addEventListener('click', speakText);

async function generateCharacter() {
    if (isGenerating) return;
    
    isGenerating = true;
    generateBtn.disabled = true;
    status.textContent = 'Generating character... This will take about 20 seconds (2 images).';
    
    try {
        // Generate first frame using Flux Schnell
        status.textContent = 'Generating neutral frame with Flux Schnell...';
        const result1 = await websim.imageGen({
            prompt: "A friendly cartoon character face, neutral expression, clean simple design, bright colors, 2D illustration style",
            width: 512,
            height: 512
        });
        
        currentCharacterFrames.neutral = result1.url;
        characterImg.src = currentCharacterFrames.neutral;
        
        // Generate talking frame using Nano Bananas by showing the first image
        status.textContent = 'Generating talking frame with Nano Bananas...';
        
        // Convert first image to base64 for input
        const response = await fetch(result1.url);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        
        const result2 = await websim.imageGen({
            prompt: "Make this character's mouth open as if talking or speaking, keep the same art style and colors",
            image_inputs: [{ url: base64 }],
            width: 512,
            height: 512
        });
        
        currentCharacterFrames.talking = result2.url;
        
        status.textContent = 'Character generated with 2 frames! Now you can make it talk.';
        textInput.disabled = false;
        speakBtn.disabled = false;
        
    } catch (error) {
        console.error('Error generating character:', error);
        status.textContent = 'Error generating character. Please try again.';
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
    }
}

async function speakText() {
    if (isSpeaking || !textInput.value.trim()) return;
    
    isSpeaking = true;
    speakBtn.disabled = true;
    const text = textInput.value;
    
    try {
        // Generate speech
        status.textContent = 'Generating speech...';
        const ttsResult = await websim.textToSpeech({
            text: text,
            voice: 'en-male'
        });
        
        // Create audio element
        const audio = new Audio(ttsResult.url);
        
        // Start mouth animation by cycling frames
        let showTalking = true;
        characterImg.src = currentCharacterFrames.talking;
        talkInterval = setInterval(() => {
            characterImg.src = showTalking ? currentCharacterFrames.talking : currentCharacterFrames.neutral;
            showTalking = !showTalking;
        }, 200); // toggle every 200ms
        
        // Play audio
        audio.play();
        
        // Update status
        status.textContent = 'Character is speaking...';
        
        // Stop animation when audio ends
        audio.addEventListener('ended', () => {
            clearInterval(talkInterval);
            talkInterval = null;
            characterImg.src = currentCharacterFrames.neutral;
            isSpeaking = false;
            speakBtn.disabled = false;
            status.textContent = 'Ready to speak again!';
        });
        
        // Handle audio errors
        audio.addEventListener('error', () => {
            if (talkInterval) { clearInterval(talkInterval); talkInterval = null; }
            characterImg.src = currentCharacterFrames.neutral;
            isSpeaking = false;
            speakBtn.disabled = false;
            status.textContent = 'Error playing audio. Please try again.';
        });
        
    } catch (error) {
        console.error('Error with TTS:', error);
        if (talkInterval) { clearInterval(talkInterval); talkInterval = null; }
        characterImg.src = currentCharacterFrames.neutral;
        isSpeaking = false;
        speakBtn.disabled = false;
        status.textContent = 'Error generating speech. Please try again.';
    }
}

// Initialize UI state
textInput.disabled = true;
speakBtn.disabled = true;