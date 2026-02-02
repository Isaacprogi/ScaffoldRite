import fetch from "node-fetch";

export async function generateStructure(params: {
  existingStructure: string;
  description: string;
}): Promise<string> {
  try {
    const response = await fetch("http://localhost:3000/generate-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend error: ${text}`);
    }

    const data: any = await response.json();

    if (typeof data?.result !== "string") {
      throw new Error("Invalid backend response: result missing");
    }

    return data.result;
  } catch (err) {
    throw new Error(`Failed to generate structure: ${(err as Error).message}`);
  }
}
