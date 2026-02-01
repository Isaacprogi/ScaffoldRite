import fetch from "node-fetch";

type GroqResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};



export async function generateStructureWithGroq(params: {
  existingStructure: string;
  description: string;
}): Promise<string> {
  const { existingStructure, description } = params;

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

 if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing.");
  console.error("➡️  Add it to your .env file:");
  console.error("   GROQ_API_KEY=your_key_here");
  process.exit(1);
}

  const systemPrompt = `
You are a frontend project structure generator for Scaffoldrite.

STRICT RULES:
- Output ONLY valid structure.sr syntax
- DO NOT include markdown
- DO NOT explain anything
- DO NOT add comments
- DO NOT wrap output in code blocks
- Preserve all existing files and folders
- Only ADD or EXTEND structure where necessary
- NEVER delete existing entries
- Frontend-only structure
- Ignore backend, database, server, API implementation details
- Backend mentions should be interpreted as frontend needs
- Valid entities: folder, file
- Maintain correct indentation
`;

  const userPrompt = `
EXISTING STRUCTURE:
${existingStructure}

PROJECT DESCRIPTION:
${description}

TASK:
Update the existing structure to satisfy the description.
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${text}`);
  }

  const data = (await response.json()) as GroqResponse;

  const output = data.choices?.[0]?.message?.content;

  if (!output || typeof output !== "string") {
    throw new Error("Groq returned empty structure");
  }

  // 🔒 Final safety check
  if (!output.includes("folder") && !output.includes("file")) {
    throw new Error("Invalid structure.sr output from Groq");
  }

  return output.trim();
}
