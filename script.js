async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();
  if (!userText) return;

  // Show user message
  chatBox.innerHTML += `<div class="message user">${userText}</div>`;
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Show loading
  chatBox.innerHTML += `<div class="message bot" id="loading">Thinking...</div>`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText })
    });

    const data = await response.json();
    document.getElementById("loading").remove();
    chatBox.innerHTML += `<div class="message bot">${data.reply}</div>`;
  } catch (err) {
    document.getElementById("loading").innerText = "Error. Try again.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send on Enter key
document.getElementById("userInput")
  .addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
