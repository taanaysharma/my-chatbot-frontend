export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, pdfContext } = req.body;

  // Build system prompt — include extracted PDF text if provided
  let systemPrompt =
    "You are a helpful college assistant. Answer questions about academics, exams, attendance, and college guidelines clearly and briefly.";

  if (pdfContext && pdfContext.trim().length > 0) {
    systemPrompt +=
      `\n\nThe user has uploaded a PDF document. Use the following extracted content to answer their questions accurately:\n\n---\n${pdfContext}\n---`;
  }

  // Convert messages to OpenAI format (role + content)
  const openAIMessages = messages.map((m) => ({
    role: m.role, // "user" or "assistant"
    content: m.content,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // cost-efficient; swap to "gpt-4o" for higher quality
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        ...openAIMessages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(response.status).json({ error: err });
  }

  const data = await response.json();
  const reply = data.choices[0].message.content;
  res.status(200).json({ reply });
}
