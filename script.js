let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  document.getElementById("themeBtn").innerText = isDark ? "☀️ Light" : "🌙 Dark";
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function typeText(element, text, speed = 18) {
  element.innerText = "";
  for (let i = 0; i < text.length; i++) {
    element.innerText += text[i];
    await new Promise(r => setTimeout(r, speed));
  }
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  // User message with timestamp
  const userMsg = document.createElement("div");
  userMsg.className = "message-wrapper user-wrapper";
  userMsg.innerHTML = `
    <div class="message user">${userText}</div>
    <span class="timestamp">${getTime()}</span>
  `;
  chatBox.appendChild(userMsg);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Loading bubble
  const botWrapper = document.createElement("div");
  botWrapper.className = "message-wrapper bot-wrapper";
  const botMsg = document.createElement("div");
  botMsg.className = "message bot";
  botMsg.innerText = "...";
  const timeSpan = document.createElement("span");
  timeSpan.className = "timestamp";
  botWrapper.appendChild(botMsg);
  botWrapper.appendChild(timeSpan);
  chatBox.appendChild(botWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });
    const data = await response.json();
    await typeText(botMsg, data.reply);
    timeSpan.innerText = getTime();
  } catch {
    botMsg.innerText = "Error. Please try again.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput")
  .addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
