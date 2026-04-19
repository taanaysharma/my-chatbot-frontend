// ════════════════════════════════════════════════════════════════════
//  MANIT Chatbot — script.js  (Supabase auth + persistent history)
//  Uses window._sb (set in supabase-config.js) to avoid name collision
// ════════════════════════════════════════════════════════════════════

marked.setOptions({ breaks: true, gfm: true });

// ── Auth guard ────────────────────────────────────────────────────────────────
let currentUser = null;

(async () => {
  const { data: { session } } = await window._sb.auth.getSession();
  if (!session) { window.location.href = "login.html"; return; }
  currentUser = session.user;

  const name = currentUser.user_metadata?.full_name || currentUser.email.split("@")[0];
  document.getElementById("userBadge").textContent = "👤 " + name;

  if (localStorage.getItem("theme") === "dark") {
    isDark = true;
    document.body.classList.add("dark");
    document.getElementById("themeBtn").textContent = "☀️ Light";
  }

  await loadHistoryFromDB();
})();

async function handleLogout() {
  try {
    await window._sb.auth.signOut();
  } catch (e) {
    console.error("Logout error:", e);
  }
  // Force-clear any lingering session from localStorage
  localStorage.removeItem("supabase.auth.token");
  // Supabase v2 stores session under this key pattern
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("sb-")) localStorage.removeItem(k);
  });
  window.location.href = "login.html";
}

// ── Theme ─────────────────────────────────────────────────────────────────────
let isDark = false;
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("dark", isDark);
  document.getElementById("themeBtn").textContent = isDark ? "☀️ Light" : "🌙 Dark";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
async function typeMarkdown(element, text, speed = 10) {
  const html = marked.parse(text);
  element.innerHTML = "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  for (const node of Array.from(temp.childNodes)) {
    element.appendChild(node.cloneNode(true));
    await new Promise(r => setTimeout(r, speed * 3));
  }
}
function copyText(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "✅ Copied";
    setTimeout(() => btn.textContent = "📋 Copy", 2000);
  });
}
function speakText(btn, text) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel(); btn.textContent = "🔊 Speak"; return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.onend = () => btn.textContent = "🔊 Speak";
  btn.textContent = "⏹ Stop";
  window.speechSynthesis.speak(u);
}

// ── Quick chips ───────────────────────────────────────────────────────────────
function useChip(text) {
  document.getElementById("userInput").value = text;
  document.getElementById("chipsBar").style.display = "none";
  sendMessage();
}

// ── PDF ───────────────────────────────────────────────────────────────────────
let pdfContext = "";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

document.getElementById("pdfInput").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const statusEl = document.getElementById("pdfStatus");
  const clearBtn = document.getElementById("pdfClearBtn");
  statusEl.textContent = "⏳ Reading PDF…"; statusEl.style.color = "#f0a500";
  try {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }
    pdfContext = fullText.slice(0, 12000);
    statusEl.textContent = `✅ ${file.name} (${pdf.numPages}p)`;
    statusEl.style.color = "#22c55e";
    clearBtn.style.display = "inline-block";
    addSystemNote(`📄 PDF "${file.name}" loaded.`);
  } catch { statusEl.textContent = "❌ Failed to read PDF"; statusEl.style.color = "#ef4444"; }
});

function clearPDF() {
  pdfContext = "";
  document.getElementById("pdfInput").value = "";
  document.getElementById("pdfStatus").textContent = "No PDF loaded";
  document.getElementById("pdfStatus").style.color = "";
  document.getElementById("pdfClearBtn").style.display = "none";
  addSystemNote("🗑️ PDF cleared.");
}
function addSystemNote(text) {
  const chatBox = document.getElementById("chatBox");
  const note = document.createElement("div");
  note.className = "system-note"; note.textContent = text;
  chatBox.appendChild(note); chatBox.scrollTop = chatBox.scrollHeight;
}

// ── Supabase history ──────────────────────────────────────────────────────────
let chatHistory = [];

async function loadHistoryFromDB() {
  const { data, error } = await window._sb
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("DB error:", error);
    addSystemNote("⚠️ Could not load history: " + error.message + " (Code: " + error.code + ")");
    addSystemNote("👋 Starting fresh. Ask me anything!");
    return;
  }
  if (!data || data.length === 0) {
    addSystemNote("👋 Welcome to MANIT Assistant! Ask me anything.");
    return;
  }

  chatHistory = data.map(r => ({
    role: r.role, content: r.content,
    time: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }));
  restoreChatUI(chatHistory);
  document.getElementById("chipsBar").style.display = "none";
  addSystemNote("💬 Your previous conversation has been restored.");
}

async function saveMessageToDB(role, content) {
  const { error } = await window._sb.from("chat_messages").insert({
    user_id: currentUser.id, role, content
  });
  if (error) console.error("Save error:", error.message);
}

async function clearHistoryFromDB() {
  const { error } = await window._sb.from("chat_messages")
    .delete().eq("user_id", currentUser.id);
  if (error) console.error("Clear error:", error.message);
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function buildActions(text) {
  const actions = document.createElement("div");
  actions.className = "msg-actions";
  const copyBtn  = document.createElement("button"); copyBtn.className  = "action-btn";
  copyBtn.textContent  = "📋 Copy";  copyBtn.onclick  = () => copyText(copyBtn, text);
  const speakBtn = document.createElement("button"); speakBtn.className = "action-btn";
  speakBtn.textContent = "🔊 Speak"; speakBtn.onclick = () => speakText(speakBtn, text);
  actions.appendChild(copyBtn); actions.appendChild(speakBtn);
  return actions;
}

function restoreChatUI(history) {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";
  for (const msg of history) {
    if (msg.role === "user") {
      const w = document.createElement("div"); w.className = "message-wrapper user-wrapper";
      w.innerHTML = `<div class="message user">${escapeHtml(msg.content)}</div>
                     <span class="timestamp">${msg.time||""}</span>`;
      chatBox.appendChild(w);
    } else if (msg.role === "assistant") {
      const w = document.createElement("div"); w.className = "message-wrapper bot-wrapper";
      const msgEl = document.createElement("div"); msgEl.className = "message bot markdown-body";
      msgEl.innerHTML = marked.parse(msg.content);
      const ts = document.createElement("span"); ts.className = "timestamp"; ts.textContent = msg.time||"";
      w.appendChild(msgEl); w.appendChild(buildActions(msg.content)); w.appendChild(ts);
      chatBox.appendChild(w);
    }
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(text) {
  const chatBox = document.getElementById("chatBox");
  const w = document.createElement("div"); w.className = "message-wrapper bot-wrapper";
  const msg = document.createElement("div"); msg.className = "message bot markdown-body";
  const ts  = document.createElement("span"); ts.className = "timestamp"; ts.textContent = getTime();
  w.appendChild(msg); w.appendChild(buildActions(text)); w.appendChild(ts);
  chatBox.appendChild(w);
  return msg;
}

// ── New Chat / Export ─────────────────────────────────────────────────────────
async function newChat() {
  if (chatHistory.length === 0) return;
  if (!confirm("Clear entire conversation history? This cannot be undone.")) return;
  await clearHistoryFromDB();
  chatHistory = [];
  document.getElementById("chatBox").innerHTML = "";
  document.getElementById("chipsBar").style.display = "flex";
  clearPDF();
  addSystemNote("✨ New chat started!");
}

function exportChat() {
  if (chatHistory.length === 0) { alert("No conversation to export yet."); return; }
  const lines = ["MANIT Assistant – Chat Export", "================================", ""];
  for (const msg of chatHistory) {
    lines.push(`${msg.role === "user" ? "You" : "Assistant"}${msg.time?" ["+msg.time+"]":""}:`);
    lines.push(msg.content); lines.push("");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `manit-chat-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
}

// ── Send ──────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const input   = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  const time = getTime();
  document.getElementById("chipsBar").style.display = "none";
  chatHistory.push({ role: "user", content: userText, time });

  const userWrapper = document.createElement("div");
  userWrapper.className = "message-wrapper user-wrapper";
  userWrapper.innerHTML = `<div class="message user">${escapeHtml(userText)}</div>
                            <span class="timestamp">${time}</span>`;
  chatBox.appendChild(userWrapper);
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  const loadWrapper = document.createElement("div");
  loadWrapper.className = "message-wrapper bot-wrapper";
  loadWrapper.innerHTML = `<div class="message bot">
    <span class="dot-typing"><span></span><span></span><span></span></span></div>`;
  chatBox.appendChild(loadWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
        pdfContext,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = typeof data.error === "string" ? data.error : `Server error ${response.status}`;
      loadWrapper.innerHTML = `<div class="message bot error-msg">❌ ${errMsg}</div>`;
      chatHistory.pop(); return;
    }

    const reply     = data.reply;
    const replyTime = getTime();

    // Save both to Supabase
    await saveMessageToDB("user", userText);
    await saveMessageToDB("assistant", reply);

    chatHistory.push({ role: "assistant", content: reply, time: replyTime });
    loadWrapper.remove();
    const botMsgEl = addBotMessage(reply);
    await typeMarkdown(botMsgEl, reply);
  } catch (err) {
    loadWrapper.innerHTML = `<div class="message bot error-msg">❌ Network error: ${err.message}</div>`;
    chatHistory.pop();
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("userInput")
  .addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
