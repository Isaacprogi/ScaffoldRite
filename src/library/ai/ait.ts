import { execSync } from "child_process";
import { theme, icons } from "../../data";
import path from "path";
import fs from "fs";
import { generateStructureWithGroq } from "./generateStructureWithGroq";


function createAsk() {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string) =>
    new Promise<string>((res) => rl.question(q, res));

  return { ask, close: () => rl.close() };
}


export const ai = async () => {
  try {
    // ─────────────────────────────────────────────
    // 1️⃣ INITIAL QUESTIONS
    // ─────────────────────────────────────────────
    let { ask, close } = createAsk();

    const projectName = await ask("Project name: ");
    const framework = await ask("Framework (react, vue, vanilla): ");
    const language = await ask("Language (js, ts): ");

    close(); // ❗ CLOSE BEFORE execSync

    // ─────────────────────────────────────────────
    // 2️⃣ CREATE VITE PROJECT
    // ─────────────────────────────────────────────
    let template = framework.toLowerCase();
    if (framework === "react" && language === "ts") template = "react-ts";
    if (framework === "vue" && language === "ts") template = "vue-ts";
    if (framework === "vanilla" && language === "ts") template = "vanilla-ts";

    execSync(
      `npx create-vite@latest "${projectName}" --template ${template} --no-rolldown --no-immediate`,
      { stdio: "inherit", shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh" }
    );

    const projectPath = path.resolve(process.cwd(), projectName);

    // ─────────────────────────────────────────────
    // 3️⃣ INIT SCAFFOLDRITE
    // ─────────────────────────────────────────────
    execSync("sr init --from-fs .", {
      cwd: projectPath,
      stdio: "inherit",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });

    // ─────────────────────────────────────────────
    // 4️⃣ RE-CREATE readline (CRITICAL)
    // ─────────────────────────────────────────────
    ({ ask, close } = createAsk());

    const wantAI = await ask(
      "\n🤖 Do you want AI assistance in scaffolding the structure of your app? (yes/no): "
    );

    if (wantAI.toLowerCase() === "yes") {
      while (true) {
        const description = await ask(
          "\n📝 Describe your project or what you want to add/change:\n"
        );

        const structurePath = path.join(projectPath, ".scaffoldrite", "structure.sr");
        const existingStructure = fs.readFileSync(structurePath, "utf-8");

        const updatedStructure = await generateStructureWithGroq({
          existingStructure,
          description,
        });

        fs.writeFileSync(structurePath, updatedStructure);

        close(); // ❗ CLOSE before execSync again

        execSync("sr generate .", { cwd: projectPath, stdio: "inherit" });
        execSync("sr init --sr --with-icon", { cwd: projectPath, stdio: "inherit" });

        ({ ask, close } = createAsk());

        const satisfied = await ask(
          "\n✅ Are you satisfied with the structure? (yes/no): "
        );

        if (satisfied.toLowerCase() === "yes") break;
      }
    }

    close();

    console.log(theme.success(`\n🎉 Project ${projectName} is ready!\n`));
    console.log(theme.muted(`  cd ${projectName}`));
    console.log(theme.muted("  npm install"));
    console.log(theme.muted("  npm run dev"));

  } catch (err) {
    console.error(theme.error(`❌ Failed: ${(err as Error).message}`));
  }
};
