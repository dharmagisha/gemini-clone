const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;


const API_KEY = import.meta.env.VITE_API_KEY;
const API_URL = `${import.meta.env.VITE_API_URL}?key=${import.meta.env.VITE_API_KEY}`;

// const API_KEY = "AIzaSyAJLFHnXCe5IgVDzT0kFDLpCYeFey0XIUs";
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


const loadLocalstorageData = () => {
  const savedChats = localStorage.getItem("savedChats")
  const isLightMode = (localStorage.getItem("theme") === "light_mode");


  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

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

const showtTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if(currentWordIndex === words.length) {
    clearInterval(typingInterval);
    isResponseGenerating = false;
    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
    localStorage.setItem("savedChats", chatList.innerHTML);
    }
    chatList.scrollTo(0, chatList.scrollHeight);
  }, 75);
}

const generateAPIResponse  = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try{
      const response = await fetch(API_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           contents: [{
             role: "user",
             parts: [{ text: userMessage }]
          }]
        })
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data.error.message);

      const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
      showtTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
      isResponseGenerating = false;
      textElement.innerText = error.message;
      textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");

    }

}

const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                    <img src="strr.jpeg" alt="user image" class="avatar">
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

  navigator.clipboard.writeText(messageText)
  copyIcon.innerText = "done";
  setTimeout(() => copyIcon.innerText = "content_copy", 1000);
}


const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

   const html = `<div class="message-content">
                   <img src="user.jpg" alt="user image" class="avatar">
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

suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("theme", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

});
deleteChatButton.addEventListener("click", () => {
  if(confirm("Are you sure you want to delete this messages")) {
    localStorage.removeItem("savedChats")
    loadLocalstorageData();
  }
});

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat();
});