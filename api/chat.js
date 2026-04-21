export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set. Add it in Vercel Environment Variables and redeploy." });
  }

  const { messages, pdfContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages array required." });
  }

  let systemPrompt = `You are the official AI assistant for MANIT Bhopal (Maulana Azad National Institute of Technology). Answer concisely using only the data below. If unknown, direct to manit.ac.in or 0755-4051000.

MANIT BHOPAL QUICK FACTS
Est:1960(MACT)→NIT2002→Nat.Importance2007|Campus:650acres|Students:~5279|Code(JoSAA):203|NIRF:Engg72(2024),Arch17(2024)|Web:manit.ac.in|Ph:0755-4051000|Email:pro@manit.ac.in|Director:Prof.Karunesh Kumar Shukla

DEPARTMENTS(14+6CoE)
BTech(4yr,60seats,₹91500/yr via JEE+JoSAA):CSE,ECE,EE,ME,CE,Chemical(30),Metallurgy(30)
BArch(5yr,30seats),BPlan(4yr,30seats),BTech+MTech Dual(5yr,20seats)
MTech(2yr,GATE+CCMT,₹37500/yr):CSE→AdvComp,Networks,InfoSec,AI,SoftEngg|EE→PowerSys,PowerElec|ECE→VLSI,CommEngg|CE→Structural,Transport,Env|ME→MachineDesign,Mfg|Chemical|Metallurgy|RenewableEnergy|GIS
MBA(2yr,66seats,CAT/MAT/CMAT,₹85000/yr)|MCA(3yr,30seats,NIMCET,₹85000/yr)|MSc Maths/Physics(2yr,JAM,₹25000/yr)|PhD(all depts,GATE/NET,TA₹12400-25000/mo)

FEES
BTech/BArch/BPlan:₹62500tuition+₹29000other=₹91500/yr|MTech/MPlan:₹37500/yr|MBA/MCA:₹85000/yr|MSc:₹25000/yr|Hostel3-seater:₹6776/yr,single:₹10000/yr
Scholarships:<₹1L income→100%fee waiver|₹1-5L→2/3 waiver|SC/ST Govt scholarships|Merit scholarship

ADMISSION – BTech
1)JEE Main(NTA)|2)JoSAA counselling josaa.nic.in|3)6 rounds allotment|4)Doc verification at MANIT
Eligibility:75%in12th(65%SC/ST/PwD),PCM compulsory|Quota:HS=MP domicile,OS=others|Res:OBC27%,SC15%,ST7.5%,EWS10%,PwD5%
Docs:JEE scorecard,10th&12th marksheets,TC,ID proof,category cert

JEE CUTOFFS 2025 (General,Gender-Neutral)
Branch|HS-Open|HS-Close|OS-Open|OS-Close
CSE|5601|10863|5163|8547
ECE|11302|16536|9640|12706
EE|16974|21441|12816|18379
ME|22945|31264|18342|25728
CE|27877|40724|26437|36084
Chemical|24126|35187|23432|31982
Metallurgy|N/A|51350|N/A|45800
BArch|629|3688|414|639
BPlan|2144|4500|1900|4100

CSE OS Closing Trend: 2021~9500|2022~8900|2023~9370|2024~8243|2025:8547
CSE 2025 Category(OS): GN:5163-8547|EWS:1052-1223|OBC:2582-3141|SC:1274-1728|ST:399-630|GN-FO:~7500-14200

GATE CUTOFF MTech CCMT2024-25 (Gen,last round)
InfoSec:552|AI:506|AdvComp:520|Networks:456|SoftEngg:470|PowerSys:420|PowerElec:400|VLSI:435|CommEngg:415|Structural:390|EnvEngg:360|RenEnergy:350|MachDesign:353|Chemical:353

PLACEMENTS
2025:Highest₹56LPA(Meesho),Avg₹16LPA,Median₹13LPA,CSEavg₹25LPA,ME₹8-10LPA,CE₹8-12LPA
2024:Highest₹60LPA+,Avg₹14-15LPA|2023:Highest₹82LPA,Avg₹15.6LPA
Recruiters:IT→Microsoft,Amazon,Google,Adobe,TCS,Infosys,Wipro,Meesho,Flipkart|Finance→GoldmanSachs,DeutscheBank,JPMorgan|Core→Suzuki,Honda,TATA,Mahindra,Maruti|Consult→Deloitte,Accenture,EY|PSU→NTPC,BHEL,GAIL,ONGC(GATE)|Others→Samsung,Qualcomm,IBM,Zomato,Apple

CAMPUS & FACILITIES
Hostels:12(9boys+1NRI+2girls)|BoyH1-6,8-11|GirlsH7,H12(cap~900)|Rooms:3-seater(1styear),2-seater/single(seniors)|Amenities:WiFi,cupboards,studytable,fan|Mess:3meals/day|NightCanteen|Security:24x7
Sports:Cricket,Football,Basketball,Volleyball,Badminton,TT,Gym,Athletics|LotuslakeBoatClub
Library:1,14,694+books,IEEEXplore,ScienceDirect|SBIBranch+ATM|PostOffice|MedicalDispensary|Wi-Fi campus-wide

CLUBS & FESTS
Maffick(CulturalFest):dance,music,fashion,streetplay,concerts
Technosearch(TechFest,since2003):coding,robotics,workshops
E-Summit(ECell):startups,businesscomp
Clubs:Robotics,IEEE,SAE,CodingClub,Photography,Debate,Music,Dance,Drama,NSS,NCC,Rotaract,SPIKMACAY

CENTRES OF EXCELLENCE
CAI(AI/ML)|CEWM(WaterMgmt)|Space-TIC(ISRO collab)|EnergyCentre(RenewableEnergy)|CEPDSM(SmartMfg)|RoltaIncubation(Startups)

RANKINGS & ACCREDITATION
NIRF2024:Engg72,Arch17,Overall151-200|THE2026:Top100Global(InterdisciplinaryScience)|TheWeek2023:33rd|IIRF2023Arch:15th
Accred:UGC,AICTE,NBA,ARIIA

NOTABLE ALUMNI
AjitJogi(1stCMChhattisgarh)|SatishKumarSharma(CMD,NPCIL)|NaveenPolishetty(actor)|PCaSharma(MPCabinetMinister)

CONTACT
Address:LinkRdNo3,NearKaliMataMandir,Bhopal,MP-462003|Web:manit.ac.in|JoSAA:josaa.nic.in|CCMT:ccmt.ac.in|Placements:placement@manit.ac.in|Director:director@manit.ac.in`;

  if (pdfContext && pdfContext.trim().length > 0) {
    systemPrompt += `\n\nADDITIONAL PDF CONTEXT:\n${pdfContext}`;
  }

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: m.content,
    }))
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    if (!response.ok) {
      const message = data?.error?.message || `Groq API returned status ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: "Empty response from Groq." });

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: `Network error: ${err.message}` });
  }
}
