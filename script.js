// ── Configure marked.js ───────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ── Theme ────────────────────────────────────────────────────────────────────
let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  document.getElementById("themeBtn").innerText = isDark ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ── Utilities ────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Renders markdown and types the HTML char by char into the element
async function typeMarkdown(element, text, speed = 12) {
  const html = marked.parse(text);
  element.innerHTML = "";
  // Type the raw HTML content node by node for a smooth effect
  const temp = document.createElement("div");
  temp.innerHTML = html;
  for (const node of Array.from(temp.childNodes)) {
    element.appendChild(node.cloneNode(true));
    await new Promise((r) => setTimeout(r, speed * 3));
  }
}

function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerText = "✅ Copied";
    setTimeout(() => (btn.innerText = "📋 Copy"), 2000);
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
  utterance.onend = () => (btn.innerText = "🔊 Speak");
  btn.innerText = "⏹ Stop";
  window.speechSynthesis.speak(utterance);
}

// ── Quick-reply Chips ────────────────────────────────────────────────────────
function useChip(text) {
  document.getElementById("userInput").value = text;
  // Hide chips bar after first use so it doesn't clutter
  document.getElementById("chipsBar").style.display = "none";
  sendMessage();
}

// ── PDF Handling ─────────────────────────────────────────────────────────────
let pdfContext = "";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

document.getElementById("pdfInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("pdfStatus");
  const clearBtn = document.getElementById("pdfClearBtn");

  statusEl.textContent = "⏳ Reading PDF…";
  statusEl.style.color = "#f0a500";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    pdfContext = fullText.slice(0, 12000);

    statusEl.textContent = `✅ ${file.name} (${pdf.numPages} page${pdf.numPages > 1 ? "s" : ""})`;
    statusEl.style.color = "#22c55e";
    clearBtn.style.display = "inline-block";

    addSystemNote(`📄 PDF "${file.name}" loaded. You can now ask questions about it.`);
  } catch (err) {
    statusEl.textContent = "❌ Failed to read PDF";
    statusEl.style.color = "#ef4444";
    console.error(err);
  }
});

function clearPDF() {
  pdfContext = "";
  document.getElementById("pdfInput").value = "";
  document.getElementById("pdfStatus").textContent = "No PDF loaded";
  document.getElementById("pdfStatus").style.color = "";
  document.getElementById("pdfClearBtn").style.display = "none";
  addSystemNote("🗑️ PDF cleared. Back to general college assistant mode.");
}

function addSystemNote(text) {
  const chatBox = document.getElementById("chatBox");
  const note = document.createElement("div");
  note.className = "system-note";
  note.innerText = text;
  chatBox.appendChild(note);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ── Chat History Persistence ─────────────────────────────────────────────────
let chatHistory = [];

const STORAGE_KEY = "college_chatbot_history";

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
  } catch (_) {}
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return [];
}

// Rebuilds the chat UI from a history array (used on page load)
function restoreChatUI(history) {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  for (const msg of history) {
    if (msg.role === "user") {
      const wrapper = document.createElement("div");
      wrapper.className = "message-wrapper user-wrapper";
      wrapper.innerHTML = `
        <div class="message user">${escapeHtml(msg.content)}</div>
        <span class="timestamp">${msg.time || ""}</span>
      `;
      chatBox.appendChild(wrapper);
    } else if (msg.role === "assistant") {
      const wrapper = document.createElement("div");
      wrapper.className = "message-wrapper bot-wrapper";

      const msgEl = document.createElement("div");
      msgEl.className = "message bot markdown-body";
      msgEl.innerHTML = marked.parse(msg.content);

      const actions = document.createElement("div");
      actions.className = "msg-actions";

      const copyBtn = document.createElement("button");
      copyBtn.className = "action-btn";
      copyBtn.innerText = "📋 Copy";
      copyBtn.onclick = () => copyText(copyBtn, msg.content);

      const speakBtn = document.createElement("button");
      speakBtn.className = "action-btn";
      speakBtn.innerText = "🔊 Speak";
      speakBtn.onclick = () => speakText(speakBtn, msg.content);

      actions.appendChild(copyBtn);
      actions.appendChild(speakBtn);

      const ts = document.createElement("span");
      ts.className = "timestamp";
      ts.innerText = msg.time || "";

      wrapper.appendChild(msgEl);
      wrapper.appendChild(actions);
      wrapper.appendChild(ts);
      chatBox.appendChild(wrapper);
    }
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── New Chat ─────────────────────────────────────────────────────────────────
function newChat() {
  if (chatHistory.length === 0) return;
  if (!confirm("Start a new chat? This will clear the current conversation.")) return;
  chatHistory = [];
  saveHistory();
  document.getElementById("chatBox").innerHTML = "";
  // Re-show chips
  document.getElementById("chipsBar").style.display = "flex";
  clearPDF();
}

// ── Export Chat ──────────────────────────────────────────────────────────────
function exportChat() {
  if (chatHistory.length === 0) {
    alert("No conversation to export yet.");
    return;
  }

  const lines = ["College Assistant – Chat Export", "================================", ""];
  for (const msg of chatHistory) {
    const role = msg.role === "user" ? "You" : "Assistant";
    const time = msg.time ? ` [${msg.time}]` : "";
    lines.push(`${role}${time}:`);
    lines.push(msg.content);
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `chat-export-${date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Add Bot Message ──────────────────────────────────────────────────────────
function addBotMessage(text) {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot-wrapper";

  const msg = document.createElement("div");
  msg.className = "message bot markdown-body";

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

// ── Send Message ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  const time = getTime();

  // Hide chips after first message
  document.getElementById("chipsBar").style.display = "none";

  chatHistory.push({ role: "user", content: userText, time });

  const userWrapper = document.createElement("div");
  userWrapper.className = "message-wrapper user-wrapper";
  userWrapper.innerHTML = `
    <div class="message user">${escapeHtml(userText)}</div>
    <span class="timestamp">${time}</span>
  `;
  chatBox.appendChild(userWrapper);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  const loadWrapper = document.createElement("div");
  loadWrapper.className = "message-wrapper bot-wrapper";
  loadWrapper.innerHTML = `<div class="message bot" id="loading"><span class="dot-typing"><span></span><span></span><span></span></span></div>`;
  chatBox.appendChild(loadWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
        pdfContext: pdfContext,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = typeof data.error === "string"
        ? data.error
        : data?.error?.message || `Server error ${response.status}`;
      loadWrapper.innerHTML = `<div class="message bot error-msg">❌ ${errMsg}</div>`;
      chatHistory.pop();
      return;
    }

    const reply = data.reply;
    const replyTime = getTime();

    chatHistory.push({ role: "assistant", content: reply, time: replyTime });
    saveHistory();

    loadWrapper.remove();
    const botMsgEl = addBotMessage(reply);
    await typeMarkdown(botMsgEl, reply);
  } catch (err) {
    loadWrapper.innerHTML = `<div class="message bot error-msg">❌ Network error: ${err.message}</div>`;
    chatHistory.pop();
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

document
  .getElementById("userInput")
  .addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// ── Init on page load ────────────────────────────────────────────────────────
(function init() {
  // Restore theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDark = true;
    document.body.classList.add("dark");
    document.getElementById("themeBtn").innerText = "☀️ Light";
  }

  // Restore chat history
  const saved = loadHistory();
  if (saved.length > 0) {
    chatHistory = saved;
    restoreChatUI(chatHistory);
    // Hide chips if there's already a conversation
    document.getElementById("chipsBar").style.display = "none";
    addSystemNote("💬 Previous conversation restored. Click 🗑️ New to start fresh.");
  }
})();
