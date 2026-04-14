export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Guard: ensure API key is present ─────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY is not set. Add it in your Vercel project settings under Environment Variables, then redeploy.",
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

  // ── Build Gemini 'contents' array ────────────────────────────────────────
  // Gemini uses { role: "user" | "model", parts: [{ text }] }
  // "assistant" maps to "model" in Gemini's format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    // gemini-2.0-flash — free tier, fast, high quality
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        },
      }),
    });

    const data = await response.json();

    // ── Relay exact Gemini error ─────────────────────────────────────────
    if (!response.ok) {
      const message =
        data?.error?.message || `Gemini API returned status ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    // ── Extract text from Gemini response ────────────────────────────────
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      const blockReason = data?.candidates?.[0]?.finishReason;
      return res.status(500).json({
        error: blockReason
          ? `Response blocked by Gemini (reason: ${blockReason}). Try rephrasing your question.`
          : "Empty response received from Gemini.",
      });
    }

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: `Network error reaching Gemini: ${err.message}` });
  }
}
