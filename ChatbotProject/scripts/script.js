/* 
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

// API Key and URL setup
const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const deleteChatButton = document.querySelector("#delete-chat-button");
let userMessage = null;

const API_KEY = "AIzaSyDzr27y6MN-BPpBBbPxj9afTTIEihqro8Y";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

let latestApiResponseText = "";

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);
}

loadLocalstorageData();

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordIndex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
            latestApiResponseText = text;
        }
        chatList.scrollTo(0, chatList.scrollHeight);
    }, 75);
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");
    console.log("User Message:", userMessage);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }]
                    }
                ],
                systemInstruction: {
                    role: "user",
                    parts: [
                        {
                            text: "You name is May and you are my friend. Occasionally use casual slang, reference TikTok trends, and emojis. Incorporate informal phrases and slang commonly used by Gen Z. Words like \"lit,\" \"vibe,\" \"bet,\" and \"fam\"."
                        }
                    ]
                },
                generationConfig: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 64,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain",
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.candidates || data.candidates.length === 0) {
            console.error("Invalid API response structure");
            textElement.innerText = "No valid response from API.";
            return;
        }

        const apiResponse = data?.candidates[0]?.content?.parts[0]?.text?.replace(/\*\*\((.*?)\*\*/g, '$1') || "No response from API.";
        latestApiResponseText = apiResponse;
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        console.error("Error fetching response:", error);
        textElement.innerText = "Error in fetching response.";
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};

const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                       <img src="assets/images/gemini.svg" alt="Gemini Icon">
                       <p class="text"></p>
                       <div class="loading-indicator">
                           <div class="loading-bar"></div>
                           <div class="loading-bar"></div>
                           <div class="loading-bar"></div>
                       </div>
                   </div>
                   <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => copyIcon.innerText = "content_copy", 1000);
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage) return;

    const html = `<div class="message-content">
                    <img src="assets/images/user.jpg" alt="User Image">
                    <p class="text"></p>
                 </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation, 500);
}

const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported in this browser');
        return;
    }

    console.log("Attempting to speak:", text);
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set up voice once voices are loaded
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices);
        // Try to find a female English voice
        const voice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
        if (voice) {
            utterance.voice = voice;
            console.log("Selected voice:", voice.name);
        }
    };

    // If voices are already loaded, set voice immediately
    if (speechSynthesis.getVoices().length) {
        setVoice();
    } else {
        // If voices aren't loaded yet, wait for them
        speechSynthesis.onvoiceschanged = setVoice;
    }

    // Configure speech parameters
    utterance.rate = 1;    // Speed: 0.1 to 10
    utterance.pitch = 1;   // Pitch: 0 to 2
    utterance.volume = 1;  // Volume: 0 to 1

    // Add error handling
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
    };

    // Add completion handling
    utterance.onend = () => {
        console.log('Finished speaking');
    };

    // Speak the text
    try {
        window.speechSynthesis.speak(utterance);
        console.log('Started speaking');
    } catch (error) {
        console.error('Error while trying to speak:', error);
    }
};

suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});

const textToSpeechButton = document.getElementById("text-to-speech-button");
textToSpeechButton.addEventListener("click", () => {
    console.log("TTS button clicked");
    if (latestApiResponseText) {
        console.log("Speaking text:", latestApiResponseText);
        speakText(latestApiResponseText);
    } else {
        // Fallback to get last message if latestApiResponseText is empty
        const lastIncomingMessages = document.querySelectorAll(".chat-list .incoming .text");
        if (lastIncomingMessages.length > 0) {
            const lastMessage = lastIncomingMessages[lastIncomingMessages.length - 1].innerText;
            console.log("Speaking last message:", lastMessage);
            speakText(lastMessage);
        } else {
            console.log("No text available to speak");
        }
    }
});