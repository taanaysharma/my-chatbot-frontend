let isDark = false;
let chatHistory = []; // stores full conversation for memory

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  document.getElementById("themeBtn").innerText = isDark ? "☀️ Light" : "🌙 Dark";
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function typeText(element, text, speed = 18) {
  element.innerText = "";
  for (let char of text) {
    element.innerText += char;
    await new Promise(r => setTimeout(r, speed));
  }
}

function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerText = "✅ Copied";
    setTimeout(() => btn.innerText = "📋 Copy", 2000);
  });
}

function speakText(btn, text) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    btn.innerText = "🔊 Speak";
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onend = () => btn.innerText = "🔊 Speak";
  btn.innerText = "⏹ Stop";
  window.speechSynthesis.speak(utterance);
}

function addBotMessage(text) {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot-wrapper";

  const msg = document.createElement("div");
  msg.className = "message bot";

  // Action buttons row
  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "action-btn";
  copyBtn.innerText = "📋 Copy";
  copyBtn.onclick = () => copyText(copyBtn, text);

  const speakBtn = document.createElement("button");
  speakBtn.className = "action-btn";
  speakBtn.innerText = "🔊 Speak";
  speakBtn.onclick = () => speakText(speakBtn, text);

  actions.appendChild(copyBtn);
  actions.appendChild(speakBtn);

  const ts = document.createElement("span");
  ts.className = "timestamp";
  ts.innerText = getTime();

  wrapper.appendChild(msg);
  wrapper.appendChild(actions);
  wrapper.appendChild(ts);
  chatBox.appendChild(wrapper);

  return msg;
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  // Add to history
  chatHistory.push({ role: "user", content: userText });

  // Show user message
  const userWrapper = document.createElement("div");
  userWrapper.className = "message-wrapper user-wrapper";
  userWrapper.innerHTML = `
    <div class="message user">${userText}</div>
    <span class="timestamp">${getTime()}</span>
  `;
  chatBox.appendChild(userWrapper);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Loading
  const loadWrapper = document.createElement("div");
  loadWrapper.className = "message-wrapper bot-wrapper";
  loadWrapper.innerHTML = `<div class="message bot" id="loading">...</div>`;
  chatBox.appendChild(loadWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }) // sends full history
    });

    const data = await response.json();
    const reply = data.reply;

    // Add assistant reply to history
    chatHistory.push({ role: "assistant", content: reply });

    loadWrapper.remove();
    const botMsgEl = addBotMessage(reply);
    await typeText(botMsgEl, reply);

  } catch {
    document.getElementById("loading").innerText = "Error. Please try again.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput")
  .addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
