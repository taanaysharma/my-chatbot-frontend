export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Guard: make sure the key is actually present at runtime ──────────────
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not set in environment variables. Please add it in your Vercel project settings and redeploy."
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

  // ── Build OpenAI messages array ──────────────────────────────────────────
  const openAIMessages = messages.map((m) => ({
    role: m.role,       // "user" or "assistant"
    content: m.content,
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",   // swap to "gpt-4o" for higher quality
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          ...openAIMessages,
        ],
      }),
    });

    const data = await response.json();

    // ── Relay exact OpenAI error so the frontend can display it ─────────────
    if (!response.ok) {
      const message =
        data?.error?.message ||
        `OpenAI returned status ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "Empty response received from OpenAI." });
    }

    res.status(200).json({ reply });

  } catch (err) {
    // Network-level failure (DNS, timeout, etc.)
    res.status(500).json({ error: `Network error reaching OpenAI: ${err.message}` });
  }
}
