#!/usr/bin/env ts-node
import { execSync } from "child_process";
import { theme } from "../../data";
import path from "path";
import fs from "fs";
import "dotenv/config";

import {
  runWorkflow,
  createAdapter,
  AdapterConfig,
} from "@scaffoldrite/core";
import readline from "readline";

// ─────────────────────────────────────────────
// 1️⃣ LLM Adapter Setup
// ─────────────────────────────────────────────
const llmAdapter = createAdapter("groq", {
  apiKey: process.env.GROQ_API_KEY || "",
  model: "llama-3.1-8b-instant",
  maxTokens: 1200,
  temperature: 0.2,
} as AdapterConfig);

// ─────────────────────────────────────────────
// 2️⃣ sanitize AI output
// ─────────────────────────────────────────────
function sanitizeStructureSR(input: string) {
  return input
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return (
        t === "" ||
        t === "{" ||
        t === "}" ||
        /^(folder|file|constraints)/.test(t)
      );
    })
    .join("\n")
    .trim();
}

// ─────────────────────────────────────────────
// 3️⃣ create readline
// ─────────────────────────────────────────────
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
}

// ─────────────────────────────────────────────
// 4️⃣ collect multi-line input
// ─────────────────────────────────────────────
async function collectInput(rl: readline.Interface): Promise<string> {
  console.log(`
📝 Describe what you want.

ENTER → new line  
CTRL + D → submit  
CTRL + C → exit
`);

  const lines: string[] = [];

  return new Promise((resolve) => {
    const onLine = (line: string) => {
      lines.push(line);
    };

    rl.on("line", onLine);

    // CTRL+D → readline closes → we capture and resolve
    rl.once("close", () => {
      rl.removeListener("line", onLine);
      console.log("\n🚀 Submitting...\n");
      resolve(lines.join(" "));
    });
  });
}

// ─────────────────────────────────────────────
// 5️⃣ Main AI CLI
// ─────────────────────────────────────────────
export const ai = async (): Promise<void> => {
  try {
    const projectPath = path.resolve(process.cwd());

    execSync("sr init --from-fs . --force", {
      cwd: projectPath,
      stdio: "inherit",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });

    // exit nicely
    process.on("SIGINT", () => {
      console.log("\n👋 Exiting AI assistant...");
      process.exit(0);
    });

    // 🔥 infinite assistant loop
    while (true) {
      const rl = createRL(); // recreate every round (EOF safe)

      const description = await collectInput(rl);

      if (!description.trim()) {
        console.log("⚠️ Please enter a request.\n");
        continue;
      }

      const structurePath = path.join(
        projectPath,
        ".scaffoldrite",
        "structure.sr"
      );
      const existingStructure = fs.readFileSync(structurePath, "utf-8");

      const result = await runWorkflow({
        existingStructure,
        userRequest: description,
        llmAdapter,
        onProgress: (step, message) =>
          console.log(`Step ${step}: ${message}`),
      });

      // ─────────────────────────
      // Handle results
      // ─────────────────────────
      if (result.type === "clarify") {
        console.log("\n🤖 AI requires clarification:\n");
        console.log(result.message);
        console.log("Options:", result.options.join(", "));
        continue;
      }

      if (result.type === "answer") {
        console.log("\n🤖 AI Answer:\n");
        console.log(result.message);
        continue;
      }

      if (result.type === "improve") {
        const suggestions = result.suggestions.map((s: any) => {
          if (typeof s === "string") return s;
          if (s.description && s.path) return `${s.description} (${s.path})`;
          if (s.description) return s.description;
          return JSON.stringify(s);
        });

        console.log("\n💡 AI Suggestions for improvement:");
        suggestions.forEach((s, i) => console.log(`${i + 1}. ${s}`));
        continue;
      }

      if (["create", "delete", "move", "rename"].includes(result.type)) {
        const clean = sanitizeStructureSR(JSON.stringify(result, null, 2));
        fs.writeFileSync(structurePath, clean);

        execSync("sr merge --from-fs .", { cwd: projectPath, stdio: "inherit" });
        execSync("sr generate .", { cwd: projectPath, stdio: "inherit" });
        execSync("sr list --sr --with-icon", { cwd: projectPath, stdio: "inherit" });
      }
    }
  } catch (err) {
    console.error(theme.error(`❌ Failed: ${(err as Error).message}`));
  }
};
