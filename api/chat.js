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

  // ── System prompt — MANIT Bhopal knowledge base (from official documentation) ──
  let systemPrompt = `You are an official AI assistant for Maulana Azad National Institute of Technology (MANIT), Bhopal. Answer student questions clearly, helpfully, and concisely using the college information provided below. If a question falls outside this knowledge, say so politely and suggest the student contact the relevant office.

=== MANIT BHOPAL — COMPREHENSIVE INSTITUTE DOCUMENTATION ===

## Quick Reference – MANIT at a Glance
- Full Name: Maulana Azad National Institute of Technology, Bhopal
- Also Known As: NIT Bhopal | NIT-B | MANIT | formerly MACT/REC Bhopal
- Established: 1960 (as MACT/REC) → NIT status 2002 → Institute of National Importance 2007
- Location: Link Road No. 3, Near Kali Mata Mandir, Bhopal, MP – 462003
- Campus Area: 650 acres (260 hectares) – one of the largest NIT campuses in India
- Funding: Fully funded by Ministry of Education, Government of India
- Governance: NIT Council under NIT Act 2007
- Director: Prof. Karunesh Kumar Shukla (as of 2024–25)
- JoSAA Institute Code: 203
- NIRF Engineering Rank: 72nd (2024) | 80th (2023)
- NIRF Architecture Rank: 17th (2024) | 24th (2023)
- Total Departments: 14 departments + 6 centres of excellence
- Total Enrollment: ~5,279 students (2024)
- Library Books: 1,14,694+ books + e-journals (IEEE, ScienceDirect)
- Website: www.manit.ac.in | Email: pro@manit.ac.in | Phone: 0755-4051000
- Accreditation: UGC, AICTE, NBA, ARIIA

## 1. History and Background

### 1.1 Foundation and Early Years
MANIT traces its origins to 1960 when it was established as Maulana Azad College of Technology (MACT) – also classified as Regional Engineering College (REC), Bhopal. It was among the first eight Regional Engineering Colleges launched during India's Second Five-Year Plan (1956–1960).

The institute was named after Maulana Abul Kalam Azad – independent India's first Minister of Education. The foundation stone was laid by Prime Minister Pandit Jawaharlal Nehru on 23 April 1961. MACT started with 120 students and seven faculty members, offering three branches: Civil, Mechanical, and Electrical Engineering. In 1963, the institute shifted to its own campus.

### 1.2 Key Milestones
- 1960: Established as MACT / REC Bhopal; 120 students, 7 faculty, 3 branches
- 1961: Foundation stone laid by PM Jawaharlal Nehru on 23 April
- 1963: Shifted to own campus
- 2002: Upgraded to NIT status; Deemed University status granted
- 2003: World Bank-assisted TEQIP commenced; Central Computer Facility established
- 2004: First Convocation held
- 2005: PG courses in Computer Engineering launched; Dept. of GIS & Remote Sensing started
- 2006: MBA programme commenced
- 2007: Declared Institute of National Importance under NIT Act
- 2012: New Girls' Hostel (capacity 600) built
- 2013: New Boys' Hostel (capacity 1000) completed
- 2014: Artificial lake 'Lotus Lake' and Boat Club created; Dept. of Biological Science & Engineering started
- 2015–2020: Four new department blocks completed; Space Technology Incubation Centre and AI Centre added
- 2024: NIRF Engineering rank 72nd; Architecture rank 17th; ~5,279 students enrolled

## 2. Location, Campus and Infrastructure

### 2.1 Location
- Address: Link Road No. 3, Near Kali Mata Mandir, Bhopal, Madhya Pradesh – 462003
- Distance from airport: ~11 km (Raja Bhoj Airport)
- Distance from Bhopal Railway Station: ~8 km (Habibganj/Rani Kamlapati Station is closer, ~5 km)
- Nearest market: New Market is directly in front of the main gate
- Coordinates: 23.2133° N, 77.4000° E (approx.)

### 2.2 Campus Overview
650 acres (260 hectares), divided into four sectors: academic, residential, sports, and administrative.
- Auditorium Capacity: 1,000–2,000 persons (Dr. Radhakrishnan Auditorium)
- Number of Hostels: 12 hostels (9 boys + 1 NRI boys + 2 girls)
- Lake: Lotus Lake (artificial, with Boat Club, est. 2014)
- Bank: State Bank of India branch with ATM on campus
- Post Office, campus school, shopping complex on campus
- Medical: Dispensary with ambulance, OPD, medicines
- Internet: Wi-Fi across hostels, labs, classrooms, canteen, sports complex

### 2.3 Academic Infrastructure
- Smart classrooms with audio-video interfaces, projectors, microphones, and smart boards
- Central Research Lab and interdisciplinary research facilities
- High-capacity lecture halls (up to 150 students per class)
- Central Library: 1,14,694+ books, periodicals, CDs, newspapers, e-journals (IEEE Xplore, ScienceDirect)
- Rolta Incubation Centre for startups
- Centre of Excellence in Product Design and Smart Manufacturing (CEPDSM)

### 2.4 Hostel Facilities
- Boys Hostels: Hostel No. 1–6, 8–11 (9 hostels for boys; Hostel No. 2 = Vikram Sarabhai Bhawan)
- NRI Boys Hostel: Hostel No. 10 (for NRI & foreign students, also senior batches)
- Girls Hostels: Hostel No. 7 & 12 (2 dedicated girls' hostels; capacity ~900 girls)
- Room Sharing: 3-seater rooms for first years; 2-seater and single rooms for senior years
- Room Amenities: 2 cupboards, 2 study tables, fan, 3 beds, 6 sockets, Wi-Fi
- Hostel Mess: Student-managed; provides breakfast, lunch, and dinner
- Night Canteen: Available within hostel premises
- Security: 24x7 security; access control for freshers
- Hostel Fee: Single occupancy ~₹10,000/year; 3-seater ~₹6,776/year
- Guest House: VIP Guest House for visiting faculty, researchers, parents
- Laundry rooms on each floor

### 2.5 Sports Facilities
- Cricket ground (full-size), Football ground
- Track and field (athletics)
- Basketball courts, Volleyball courts
- Sports complex with indoor games: table tennis, badminton, chess, carrom
- Meditation hall, Gymnasium, Swimming pool (in development)

## 3. Academic Departments

MANIT comprises 14 academic departments and 6 centres of excellence.

### Departments and Programmes:
1. Architecture & Planning – B.Arch (5 yr), B.Plan (4 yr), M.Plan, PhD
2. Biological Sciences & Engineering – M.Tech, PhD
3. Chemical Engineering – B.Tech, M.Tech, PhD
4. Civil Engineering – B.Tech, M.Tech (Structural, Transport, Env. Engg.), PhD
5. Computer Science & Engineering – B.Tech CSE, M.Tech (Adv. Computing, Networks, InfoSec, AI), PhD
6. Electrical Engineering – B.Tech, M.Tech (Power Systems, Power Electronics), PhD
7. Electronics & Communication Engg. – B.Tech ECE, M.Tech (VLSI, Communication Engg.), PhD
8. Humanities & Social Sciences – MBA (2 yr), PhD
9. Mathematics – M.Sc. (Mathematics), PhD
10. Mechanical Engineering – B.Tech, M.Tech (Machine Design, Manufacturing), PhD
11. Materials Science & Metallurgical Engg. – B.Tech, M.Tech, PhD
12. Physics – M.Sc. (Physics), PhD
13. Energy Centre – M.Tech (Renewable Energy), PhD
14. GIS & Remote Sensing – M.Tech, M.Sc., PhD
15. Information Technology – Minor Specialization in IT, MCA (3 yr), PhD

### Department Highlights:
- **CSE**: Most competitive department. Average package ~₹25 LPA. Top recruiters: Microsoft, Amazon, Google, Goldman Sachs, Deutsche Bank.
- **ECE**: Strong research in embedded systems, signal processing. Recruiters: Samsung, Qualcomm, Texas Instruments, Siemens.
- **Mechanical**: Founding department. Top recruiters: Suzuki, Honda, TATA, Mahindra, Hyundai, Cummins India.
- **Architecture**: NIRF Rank 17th (2024); top architecture school in Central India.
- **Civil**: Founding department (1960). M.Tech in Structural, Transportation, Environmental Engineering.
- **MBA**: Intake ~66 seats. Admission via CAT/MAT/CMAT. Average package ~₹8–12 LPA.
- **MCA**: 3-year programme, admission via NIMCET.

## 4. Centres of Excellence

1. Centre of Artificial Intelligence (CAI) – ML, deep learning, AI applications, NLP
2. Centre of Excellence in Water Management (CEWM) – water resources, waste-water treatment
3. Space Technology Incubation Centre (Space-TIC) – satellite tech, collaborations with ISRO
4. Energy Centre – renewable energy (solar, wind, biomass), smart grids
5. Centre of Excellence in Product Design and Smart Manufacturing (CEPDSM) – Industry 4.0
6. Rolta Incubation Centre – startup ecosystem, entrepreneurship, technology commercialisation

## 5. Academic Programmes

### Undergraduate Programmes (UG):
| Programme | Duration | Intake | Admission | Annual Fee |
|---|---|---|---|---|
| B.Tech (Civil, CSE, EE, ECE, ME) | 4 years | 60 each | JEE Main + JoSAA | ₹91,500 |
| B.Tech (Chemical Engg., Metallurgy) | 4 years | 30 each | JEE Main + JoSAA | ₹91,500 |
| B.Arch | 5 years | 30 | JEE Main/NATA + JoSAA | ₹91,500 |
| B.Plan | 4 years | 30 | JEE Main + JoSAA | ₹91,500 |
| B.Tech + M.Tech Dual Degree | 5 years | 20 (new) | JEE Main + JoSAA | ₹91,500 |

### Postgraduate Programmes (PG):
| Programme | Duration | Admission | Annual Fee |
|---|---|---|---|
| M.Tech (14+ specialisations) | 2 years | GATE + CCMT | ₹25,000–65,000 |
| M.Plan | 2 years | GATE + CCMT | ₹25,000 |
| MBA | 2 years | CAT/MAT/CMAT | ₹65,000/yr |
| MCA | 3 years | NIMCET | ₹65,000/yr |
| M.Sc. Mathematics / Physics | 2 years | IIT JAM + CCMN | ₹25,000 |
| M.Sc./M.Tech GIS & Remote Sensing | 2 years | GATE/JAM | ₹25,000 |

### PhD Programme:
- Available in all 14 departments
- Admissions twice a year (June and December)
- Joint PhD with IIT Jammu (from 2025–26)
- Teaching Assistantship (TA) for up to 3 years (₹12,400–₹25,000/month)
- ~300+ PhD scholars enrolled

## 6. Admission Process

### B.Tech / B.Arch / B.Plan Admission:
1. Appear and qualify JEE Main (conducted by NTA, January & April sessions)
2. Register for JoSAA counselling at josaa.nic.in
3. Fill in choices (institute + branch preferences)
4. Seat allotment (6 rounds) based on JEE Main rank, category, and quota
5. Report to MANIT for document verification and fee payment
6. CSAB Special Round (if seats remain after JoSAA)

Eligibility: 75% in Class XII (65% for SC/ST/PwD) with Physics, Chemistry, Mathematics, OR top 20 percentile of Class XII Board.

Quotas: Home State (HS) = Madhya Pradesh domicile | Other State (OS) = all other states
Reservations: OBC-NCL 27%, SC 15%, ST 7.5%, EWS 10%, PwD 5% horizontal

NRI/International: Through DASA scheme (SAT Subject Test required). Scholarships via ICCR.

Required Documents: JEE Main scorecard, Class 10 & 12 marksheets, Transfer certificate, Identity proof, Category certificate (if applicable)

### M.Tech / M.Plan: GATE score + CCMT counselling
### MBA: CAT/MAT/CMAT + GD + PI
### MCA: NIMCET + centralised counselling

### Fee Structure (2024–25):
| Programme | Tuition Fee/Year | First Year Total |
|---|---|---|
| B.Tech / B.Arch / B.Plan | ₹62,500 | ~₹91,500 |
| M.Tech / M.Plan | ₹17,500 | ~₹37,500 |
| MBA | ₹65,000 | ~₹85,000 |
| MCA | ₹65,000 | ~₹85,000 |
| M.Sc. | ₹10,000 | ~₹25,000 |
| PhD (with stipend) | ₹10,000 (waived for TA) | ₹15,000–25,000 |
| Hostel 3-seater | — | ~₹6,776/year |
| Hostel single room | — | ~₹10,000/year |

### Scholarships and Financial Aid:
- 100% tuition fee waiver for families with annual income below ₹1 lakh
- 2/3rd tuition fee waiver for families with annual income ₹1–5 lakh
- Merit Scholarship for academically outstanding students
- SC/ST scholarships from Government of India (Post-Matric)
- Central Sector Scholarship Scheme for top NTA percentile achievers
- M.Tech/PhD Teaching Assistantship: ₹12,400–₹25,000/month

## 7. JEE Main Opening and Closing Ranks

### 2025 Cutoffs – All B.Tech Branches (General Category):
| Branch | HS Opening | HS Closing | OS Opening | OS Closing |
|---|---|---|---|---|
| Civil Engineering | 27877 | 40724 | 26437 | 36084 |
| Computer Science & Engg. | 5601 | 10863 | 5163 | 8547 |
| Electronics & Comm. Engg. | 11302 | 16536 | 9640 | 12706 |
| Mechanical Engineering | 22945 | 31264 | 18342 | 25728 |
| Electrical Engineering | 16974 | 21441 | 12816 | 18379 |
| Chemical Engineering | 24126 | 35187 | 23432 | 31982 |
| Material Sci. & Metallurgy | N/A | 51350 | N/A | 45800 |
| B.Arch | 629 | 3688 | 414 | 639 |
| B.Plan | 2144 | 4500 | 1900 | 4100 |

### 2024 Cutoffs – General Category, OS Quota (Last Round):
| Branch | Opening Rank | Closing Rank |
|---|---|---|
| Civil Engineering | 5680 | 35820 |
| Computer Science & Engg. | 2945 | 8243 |
| Electronics & Comm. Engg. | 8000 | 12100 |
| Mechanical Engineering | 16000 | 27600 |
| Electrical Engineering | 11000 | 19200 |
| Chemical Engineering | 20000 | 32500 |
| Material Sci. & Metallurgy | 38000 | 47044 |
| B.Arch | 412 | 615 |

### 2023 Cutoffs – General Category, OS Quota (Last Round):
| Branch | Opening Rank | Closing Rank |
|---|---|---|
| Computer Science & Engg. | 2000 | 9370 |
| Electronics & Comm. Engg. | 8500 | 12800 |
| Electrical Engineering | 12000 | 20500 |
| Mechanical Engineering | 17000 | 29000 |
| Civil Engineering | 25000 | 38000 |
| Chemical Engineering | 22000 | 34000 |
| Material Sci. & Metallurgy | 35000 | 50000 |
| B.Arch | 400 | 700 |

### 2022 Cutoffs – General Category, OS Quota (Last Round):
| Branch | Opening Rank | Closing Rank |
|---|---|---|
| Computer Science & Engg. | 1800 | 8900 |
| Electronics & Comm. Engg. | 7800 | 11800 |
| Electrical Engineering | 11500 | 19800 |
| Mechanical Engineering | 16000 | 28000 |
| Civil Engineering | 23000 | 37000 |
| Chemical Engineering | 20500 | 32000 |
| Material Sci. & Metallurgy | 33000 | 48000 |

### CSE Year-wise Closing Rank Trend (General, OS, Last Round):
- 2021: ~9,500 | 2022: ~8,900 | 2023: ~9,370 | 2024: ~8,243 | 2025: 8,547

### 2025 Category-wise Cutoff (CSE, OS Quota):
| Category | Opening Rank | Closing Rank |
|---|---|---|
| Open / General (GN) | 5,163 | 8,547 |
| EWS | 1,052 | 1,223 |
| OBC-NCL | 2,582 | 3,141 |
| SC | 1,274 | 1,728 |
| ST | 399 | 630 |
| Open – Female Only (GN-FO) | ~7,500 | ~14,200 |

## 8. M.Tech GATE Cutoff (CCMT 2024–25)

| M.Tech Specialisation | R1 GATE Score (Gen.) | Last Round Score (Gen.) |
|---|---|---|
| Information Security | 592 | 552 |
| Artificial Intelligence | 588 | 506 |
| Advanced Computing | 575 | 520 |
| Computer Network Engineering | 568 | 456 |
| Software Engineering | 560 | 470 |
| Power Systems | 510 | 420 |
| Power Electronics | 498 | 400 |
| VLSI Design | 520 | 435 |
| Communication Engineering | 505 | 415 |
| Structural Engineering | 480 | 390 |
| Environmental Engineering | 430 | 360 |
| Renewable Energy | 427 | 350 |
| Machine Design | 435 | 353 |
| Chemical Engineering | 410 | 353 |

## 9. Placements

### Placement Overview:
The Training and Placement Cell (TPC) organises pre-recruitment training, mock interviews, GDs, and campus drives. Placements begin from the 7th semester.

| Metric | 2025 | 2024 | 2023 |
|---|---|---|---|
| Highest Package | ₹56 LPA (Meesho) | ₹60 LPA+ | ₹82 LPA |
| Average Package (Overall) | ~₹16 LPA | ~₹14–15 LPA | ₹15.6 LPA |
| Median Package | ~₹13 LPA | ~₹11 LPA | ₹10 LPA |
| CSE Average Package | ~₹25 LPA | ~₹22 LPA | ~₹20 LPA |
| Mechanical Average | ~₹8–10 LPA | ~₹8 LPA | ~₹7–8 LPA |
| Civil Average | ~₹8–12 LPA | ~₹7 LPA | ~₹7 LPA |
| % Placed (CSE) | ~65%+ | ~70%+ | ~70%+ |
| % Placed (Mech.) | ~80–85% | ~80% | ~75% |
| % Placed (Civil) | ~70% | ~65% | ~65% |

### Top Recruiting Companies:
- IT/Software: Microsoft, Amazon, Google, Adobe, Oracle, Infosys, TCS, Wipro, Meesho, Flipkart, CodeNation
- Finance/BFSI: Goldman Sachs, Deutsche Bank (~₹19.63 LPA), JP Morgan, ICICI Bank, American Express
- Core/Automotive: Suzuki, Honda, TATA Motors, Mahindra, Hyundai, Hero MotoCorp, Maruti Suzuki, Cummins India
- Electronics: Samsung, Qualcomm, Texas Instruments, Siemens, ABB
- Consulting: Deloitte, Accenture, EY, KPMG
- E-Commerce: Zomato (~₹19 LPA), Amazon, Flipkart
- PSUs: NTPC, BHEL, GAIL, Power Grid, ONGC (via GATE)
- Others: Optum, IBM, Reliance, Adani Group, Apple

### Notable Roles Offered:
Software Developer/Engineer, AI/ML Engineer, Data Scientist/Analyst, Product Manager, Design Engineer, Business Analyst/Consultant, Research Engineer, Quantitative Analyst (Finance)

## 10. Faculty

- Total Faculty Strength: ~300+ (professors, associate professors, assistant professors)
- Qualification: Predominantly PhD holders from IITs, IISc, and foreign universities
- Research Output: Regular publications in IEEE, Elsevier, Springer, Taylor & Francis
- Research Funding: DST, SERB, DRDO, ISRO, World Bank (TEQIP)
- Director: Prof. Karunesh Kumar Shukla
- HoD CSE: Dr. Meenu Chawla
- HoD Electrical: Dr. N.P. Patidar
- HoD Mechanical: Dr. N.D. Mittal

For the full faculty list: www.manit.ac.in/departments

## 11. Research and Innovation

- Central Research Laboratory with state-of-the-art equipment
- Digital Library: IEEE Xplore, ScienceDirect, Scopus, Web of Science, JSTOR
- Funding agencies: DST, SERB, DRDO, ISRO, Ministry of Education, MHRD
- Rolta Incubation Centre supports student and faculty startups
- Participates in Unnat Bharat Abhiyan for rural development

## 12. Student Life, Clubs and Events

### Technical Clubs and Societies:
- Technosearch – Annual Technical Festival (started 2003): coding competitions, robotics contests, technical workshops
- Robotics Club – competitive robotics, hackathons
- Coding Club / Programming Society
- IEEE Student Chapter
- SAE (Society of Automotive Engineers) Chapter
- E-Cell (Entrepreneurship Cell) – organises E-Summit
- GIS & Geospatial Society

### Cultural Clubs and Events:
- Maffick – Annual Cultural Festival: dance competitions, fashion shows, music performances, street plays, celebrity concerts
- Music Club, Dance Club, Drama/Theatre Club
- Photography Club, Debate Club, Literary Club
- Roobaroo – music and dance society
- Ae Se Aenak – drama and theatre society
- SPIC MACAY chapter – promotes Indian classical arts

### Social/Community:
- NSS (National Service Scheme) – social service and community outreach
- NCC (National Cadet Corps)
- Rotaract Club
- Go Green Forum – environmental awareness and sustainability
- Alumni Cell

### Anti-Ragging Policy:
MANIT has a zero-tolerance anti-ragging policy. The Anti-Ragging Committee monitors hostel and campus activities. Students can report via the national anti-ragging helpline.

### Student Council:
Elected annually; represents student interests to the administration; coordinates cultural/technical events.

## 13. Notable Alumni

- Ajit Jogi – First Chief Minister of Chhattisgarh
- P.C. Sharma – Cabinet Minister, Govt. of Madhya Pradesh
- Rambabu Kodali – Pro-Vice Chancellor, KIIT
- Naveen Polishetty – Popular Telugu film actor (Agent Sai Srinivasa Athreya)
- Satish Kumar Sharma – CMD, Nuclear Power Corporation of India (NPCIL)
- Meenu Chawla – Professor & HoD, CSE, MANIT (alumni-turned-faculty)

## 14. Rankings and Accreditations

| Ranking | Category | Rank |
|---|---|---|
| NIRF 2024 | Engineering | 72nd |
| NIRF 2023 | Engineering | 80th |
| NIRF 2024 | Architecture | 17th (out of 40) |
| NIRF 2024 | Overall | 151–200 |
| THE 2026 | Interdisciplinary Science | Top 100 Globally |
| The Week 2023 | B.Tech | 33rd (out of 131 Indian colleges) |
| IIRF 2023 | Architecture | 15th (out of 30) |

Accreditations: UGC, AICTE, NBA, ARIIA, NAAC (under review)

## 15. Contact Information

- Full Address: Maulana Azad National Institute of Technology, Link Road No. 3, Near Kali Mata Mandir, Bhopal, Madhya Pradesh – 462003, India
- Official Website: www.manit.ac.in
- JoSAA / Admissions: josaa.nic.in | csab.nic.in
- CCMT (M.Tech): ccmt.ac.in
- Email (PRO): pro@manit.ac.in
- Phone (Main): 0755-4051000
- Director's Office: director@manit.ac.in
- Placement Cell: placement@manit.ac.in
- Social Media: facebook.com/manitbhopal
- Alumni Portal: manit.ac.in/alumni

Note: Cutoff ranks, fees, and placement figures are approximate and subject to change each year. Always verify the latest information at www.manit.ac.in and josaa.nic.in.

=== END OF MANIT DOCUMENTATION ===`;

  if (pdfContext && pdfContext.trim().length > 0) {
    systemPrompt +=
      `\n\nThe user has also uploaded an additional PDF document. Use the following extracted content to supplement your answers:\n\n---\n${pdfContext}\n---`;
  }

  // ── Build Groq (OpenAI-compatible) 'messages' array ──────────────────────
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
        model: "llama-3.1-8b-instant",
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
