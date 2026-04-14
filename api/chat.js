export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message } = req.body;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: "You are a helpful college assistant. Answer questions about academics, exams, attendance, and college guidelines clearly and briefly.",
      messages: [{ role: "user", content: message }]
    })
  });

  const data = await response.json();
  const reply = data.content[0].text;
  res.status(200).json({ reply });
}
