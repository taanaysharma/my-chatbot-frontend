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

  // ── System prompt — MANIT Bhopal knowledge base ──────────────────────────
  let systemPrompt = `You are an official AI assistant for Maulana Azad National Institute of Technology (MANIT), Bhopal. Answer student questions clearly, helpfully, and concisely using the college information provided below. If a question falls outside this knowledge, say so politely and suggest the student contact the relevant office.

=== MANIT BHOPAL — COMPLETE STUDENT GUIDE ===

## About MANIT
- Full name: Maulana Azad National Institute of Technology (MANIT), Bhopal
- An Institute of National Importance under the Ministry of Education
- Established in 1960 as Maulana Azad College of Technology (MACT); became NIT in 2002
- Located on a 650-acre campus in Bhopal, Madhya Pradesh
- Offers UG, PG, and doctoral programs in engineering, science, management, and architecture

## Admission Process (B.Tech)
Steps:
1. Students appear for JEE Main conducted by NTA
2. Based on rank, students participate in JoSAA counselling
3. Candidates select preferred colleges and branches
4. Seats allotted based on rank, category, and availability
5. Selected students report to institute for document verification and admission

Required Documents:
- JEE Main scorecard
- Class 10 and 12 marksheets
- Transfer certificate
- Identity proof
- Category certificate (if applicable)

## Academic Departments

### Major Engineering Departments:
- Computer Science and Engineering (CSE)
- Electronics and Communication Engineering (ECE)
- Electrical Engineering (EE)
- Mechanical Engineering (ME)
- Civil Engineering (CE)
- Chemical Engineering
- Metallurgical and Materials Engineering

### Other Departments:
- Mathematics, Bioinformatics and Computer Applications
- Physics
- Chemistry
- Management Studies
- Architecture and Planning

## Academic Structure
- MANIT follows the Choice Based Credit System (CBCS)
- Academic components: Core subjects, Elective subjects, Laboratory sessions, Internships, Minor projects, Final year major project

## Campus Infrastructure
- Smart classrooms
- Laboratories and computer centres
- Central library
- Research labs
- Auditoriums and seminar halls
- Residential hostels

## Student Societies & Clubs

### Cultural Societies:
- Roobaroo – music and dance society
- Ae Se Aenak – drama and theatre society
- SPIC MACAY chapter – promotes Indian classical arts

### Technical Societies:
- Robotics Club
- Vision Society
- Pixel Society
- QCM Society

### Social Societies:
- Rotaract Club
- NCC (National Cadet Corps)
- Aaroha and Inspire
- Alumni Cell

## Major Festivals

### Maffick – Annual Cultural Festival
- Dance competitions, fashion shows, music performances, street plays, celebrity concerts

### Technosearch – Annual Technical Festival
- Started in 2003
- Coding competitions, robotics contests, technical workshops, engineering challenges

### E-Summit – Entrepreneurship Summit
- Organized by the E-Cell
- Promotes startups, innovation, and entrepreneurship
- Business competitions and talks by entrepreneurs

## Internships
- Students typically complete internships during 2nd, 3rd, or final year
- Sectors: software companies, engineering industries, research labs, startups

## Training and Placement

### Placement Statistics (approximate):
- Highest Package: ₹56 LPA
- Average Package: ₹16 LPA
- Median Package: ₹13 LPA
- Placement Rate: ~87%

### Top Recruiters:
Microsoft, Amazon, Google, Adobe, TCS, Infosys, Deloitte, IBM, Goldman Sachs, Maruti Suzuki

## Sports and Campus Activities
- Cricket and football grounds
- Basketball and badminton courts
- Gymnasium
- Inter-hostel tournaments organized regularly

## Graduation Requirements
- Complete required credits
- Pass all examinations
- Complete final-year major project
- Degrees awarded at the annual convocation ceremony

=== END OF GUIDE ===`;

  if (pdfContext && pdfContext.trim().length > 0) {
    systemPrompt +=
      `\n\nThe user has also uploaded an additional PDF document. Use the following extracted content to supplement your answers:\n\n---\n${pdfContext}\n---`;
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
