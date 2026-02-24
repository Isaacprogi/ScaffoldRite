import fs from "fs";
import path from "path";

const START_MARKER = "# >>> scaffoldrite-structure-lock >>>";
const END_MARKER = "# <<< scaffoldrite-structure-lock <<<";

function ensureGitRepo(baseDir: string) {
  if (!fs.existsSync(path.join(baseDir, ".git"))) {
    throw new Error("Not inside a Git repository.");
  }
}

function getHookPath(baseDir: string, hookName: string): string {
  const huskyPath = path.join(baseDir, ".husky", hookName);
  const gitPath = path.join(baseDir, ".git", "hooks", hookName);

  return fs.existsSync(huskyPath) ? huskyPath : gitPath;
}

function buildHookSnippet(): string {
  return `
${START_MARKER}
# Scaffoldrite structure validation
scaffoldrite validate
if [ $? -ne 0 ]; then
  echo "❌ Scaffoldrite structure validation failed."
  exit 1
fi
${END_MARKER}
`;
}

export function installHook(
  baseDir: string,
  options?: { prePush?: boolean }
) {
  ensureGitRepo(baseDir);

  const hookName = options?.prePush ? "pre-push" : "pre-commit";
  const hookPath = getHookPath(baseDir, hookName);
  const snippet = buildHookSnippet();

  let existingContent = "";

  if (fs.existsSync(hookPath)) {
    existingContent = fs.readFileSync(hookPath, "utf-8");

    if (existingContent.includes(START_MARKER)) {
      console.log(`Scaffoldrite already installed in ${hookName}.`);
      return;
    }
  } else {
    existingContent = "#!/bin/sh\n";
  }

  const newContent = existingContent.trimEnd() + "\n" + snippet;

  fs.writeFileSync(hookPath, newContent, { mode: 0o755 });

  console.log(`✅ Scaffoldrite installed in ${hookName}.`);
}

export function removeHook(
  baseDir: string,
  options?: { prePush?: boolean }
) {
  ensureGitRepo(baseDir);

  const hookName = options?.prePush ? "pre-push" : "pre-commit";
  const hookPath = getHookPath(baseDir, hookName);

  if (!fs.existsSync(hookPath)) {
    console.log(`No ${hookName} hook found.`);
    return;
  }

  const content = fs.readFileSync(hookPath, "utf-8");

  if (!content.includes(START_MARKER)) {
    console.log("Scaffoldrite hook not found.");
    return;
  }

  const cleaned = content
    .replace(new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}\\n?`, "g"), "")
    .trim();

  if (cleaned === "" || cleaned === "#!/bin/sh") {
    fs.unlinkSync(hookPath);
    console.log(`🗑 ${hookName} removed completely.`);
  } else {
    fs.writeFileSync(hookPath, cleaned, { mode: 0o755 });
    console.log(`🧹 Scaffoldrite removed from ${hookName}.`);
  }
}

export function isHookInstalled(
  baseDir: string,
  hookName: "pre-commit" | "pre-push"
): boolean {
  const hookPath = getHookPath(baseDir, hookName);
  if (!fs.existsSync(hookPath)) return false;

  const content = fs.readFileSync(hookPath, "utf-8");
  return content.includes(START_MARKER);
}