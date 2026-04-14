export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Guard: ensure API key is present ─────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error:
        "GROQ_API_KEY is not set. Add it in your Vercel project settings under Environment Variables, then redeploy.",
    });
  }

  const { messages, pdfContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages array is required." });
  }

  // ── System prompt (with optional PDF context) ────────────────────────────
  let systemPrompt =
    "You are a helpful college assistant. Answer questions about academics, exams, attendance, and college guidelines clearly and briefly.";

  if (pdfContext && pdfContext.trim().length > 0) {
    systemPrompt +=
      `\n\nThe user has uploaded a PDF document. Use the following extracted content to answer their questions accurately:\n\n---\n${pdfContext}\n---`;
  }

  // ── Build Groq (OpenAI-compatible) 'messages' array ──────────────────────
  // Groq expects { role: "system" | "user" | "assistant", content: "..." }
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: m.content,
    }))
  ];

  try {
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // You can also swap this to "mixtral-8x7b-32768" if you need larger context
        messages: formattedMessages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // ── Relay exact Groq error ─────────────────────────────────────────
    if (!response.ok) {
      const message =
        data?.error?.message || `Groq API returned status ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    // ── Extract text from Groq response ────────────────────────────────
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "Empty response received from Groq.",
      });
    }

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: `Network error reaching Groq: ${err.message}` });
  }
}
