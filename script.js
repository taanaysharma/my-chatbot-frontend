// ── Theme ────────────────────────────────────────────────────────────────────
let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  document.getElementById("themeBtn").innerText = isDark ? "☀️ Light" : "🌙 Dark";
}

// ── Utilities ────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function typeText(element, text, speed = 18) {
  element.innerText = "";
  for (let char of text) {
    element.innerText += char;
    await new Promise((r) => setTimeout(r, speed));
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

// ── PDF Handling ─────────────────────────────────────────────────────────────
let pdfContext = ""; // extracted text from uploaded PDF

// Point PDF.js to its worker
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

    // Limit context to ~12 000 chars to stay within token budget
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

// Renders a neutral info note in the chat
function addSystemNote(text) {
  const chatBox = document.getElementById("chatBox");
  const note = document.createElement("div");
  note.className = "system-note";
  note.innerText = text;
  chatBox.appendChild(note);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ── Chat ─────────────────────────────────────────────────────────────────────
let chatHistory = []; // full conversation for memory

function addBotMessage(text) {
  const chatBox = document.getElementById("chatBox");

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot-wrapper";

  const msg = document.createElement("div");
  msg.className = "message bot";

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

  // Show user bubble
  const userWrapper = document.createElement("div");
  userWrapper.className = "message-wrapper user-wrapper";
  userWrapper.innerHTML = `
    <div class="message user">${userText}</div>
    <span class="timestamp">${getTime()}</span>
  `;
  chatBox.appendChild(userWrapper);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Loading indicator
  const loadWrapper = document.createElement("div");
  loadWrapper.className = "message-wrapper bot-wrapper";
  loadWrapper.innerHTML = `<div class="message bot" id="loading">⏳ Thinking…</div>`;
  chatBox.appendChild(loadWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory,   // full history
        pdfContext: pdfContext,  // extracted PDF text (empty string if none)
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || "API error");
    }

    const data = await response.json();
    const reply = data.reply;

    // Add assistant reply to history
    chatHistory.push({ role: "assistant", content: reply });

    loadWrapper.remove();
    const botMsgEl = addBotMessage(reply);
    await typeText(botMsgEl, reply);
  } catch (err) {
    loadWrapper.innerHTML = `<div class="message bot" style="color:#ef4444;">❌ Error: ${err.message}</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

document
  .getElementById("userInput")
  .addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
