import fs from "fs";
import path from "path";
import { isGitLockInstalled } from "../core/gitHooks";

export async function doctorCommand(baseDir: string) {
  console.log("🩺 Scaffoldrite Doctor\n");

  // Git check
  const hasGit = fs.existsSync(path.join(baseDir, ".git"));
  console.log(hasGit ? "✔ Git repository detected" : "✘ Not a Git repository");

  // Structure file
  const hasStructure = fs.existsSync(path.join(baseDir,'.scaffoldrite', "structure.sr"));
  console.log(hasStructure ? "✔ structure.sr found" : "✘ structure.sr missing");

  // Hooks
  console.log(
    isGitLockInstalled(baseDir, "pre-commit")
      ? "✔ Pre-commit hook installed"
      : "✘ Pre-commit hook not installed"
  );

  console.log(
    isGitLockInstalled(baseDir, "pre-push")
      ? "✔ Pre-push hook installed"
      : "✘ Pre-push hook not installed"
  );

  // Husky
  const hasHusky = fs.existsSync(path.join(baseDir, ".husky"));
  console.log(hasHusky ? "✔ Husky detected" : "✘ Husky not detected");

  // CI detection
  const hasCI = fs.existsSync(path.join(baseDir, ".github", "workflows"));
  console.log(hasCI ? "✔ GitHub Actions detected" : "✘ No CI config detected");
}