import fs from "fs";
import path from "path";
import { SCAFFOLDRITE_DIR ,exit} from "../../utils";
import { theme,icons } from "../../data";

const SETTINGS_FILE = path.join(SCAFFOLDRITE_DIR, "settings.json");

/* ==============================
   SETTINGS READ/WRITE
============================== */
function readSettings(): Record<string, any> {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeSettings(data: Record<string, any>) {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

/* ==============================
   STRUCTURE LOCK
============================== */
export function installStructureLock() {
  const settings = readSettings();
  settings.structureLocked = true;
  writeSettings(settings);
  console.log("🔒 Structure editing locked.");
}

export function removeStructureLock() {
  const settings = readSettings();
  settings.structureLocked = false;
  writeSettings(settings);
  console.log("🔓 Structure editing unlocked.");
}

export function isStructureLocked(): boolean {
  const settings = readSettings();
  return !!settings.structureLocked;
}

/* ==============================
   CI ENABLED
============================== */
function createCIWorkflow() {
  const workflowsDir = path.join(path.dirname(SETTINGS_FILE), "..", ".github", "workflows");
  if (!fs.existsSync(workflowsDir)) fs.mkdirSync(workflowsDir, { recursive: true });

  const workflowFile = path.join(workflowsDir, "scaffoldrite.yml");

  if (fs.existsSync(workflowFile)) {
    console.log("✓ CI workflow already exists.");
    return;
  }

  const workflowContent = `name: Scaffoldrite Validation

on:
  push:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm install

      - name: Validate project structure
        run: npx scaffoldrite validate
`;

  fs.writeFileSync(workflowFile, workflowContent);
  console.log("✓ Created .github/workflows/scaffoldrite.yml");
}

export function enableCI() {
  const settings = readSettings();
  settings.ciEnabled = true;
  writeSettings(settings);
  console.log("🔒 CI validation enabled.");
  createCIWorkflow();
}

export function disableCI() {
  const settings = readSettings();
  settings.ciEnabled = false;
  writeSettings(settings);
  console.log("🔓 CI validation disabled.");
}

export function isCIEnabled(): boolean {
  const settings = readSettings();
  return !!settings.ciEnabled;
}

/* ==============================
   GIT HOOKS
============================== */
export function enablePreCommitHook() {
  const settings = readSettings();
  settings.preCommitEnabled = true;
  writeSettings(settings);
  console.log("🔒 Pre-commit hook enabled.");
  // TODO: call hook installer if needed
}

export function disablePreCommitHook() {
  const settings = readSettings();
  settings.preCommitEnabled = false;
  writeSettings(settings);
  console.log("🔓 Pre-commit hook disabled.");
}

export function isPreCommitHookEnabled(): boolean {
  const settings = readSettings();
  return !!settings.preCommitEnabled;
}

export function enablePrePushHook() {
  const settings = readSettings();
  settings.prePushEnabled = true;
  writeSettings(settings);
  console.log("🔒 Pre-push hook enabled.");
  // TODO: call hook installer if needed
}

export function disablePrePushHook() {
  const settings = readSettings();
  settings.prePushEnabled = false;
  writeSettings(settings);
  console.log("🔓 Pre-push hook disabled.");
}

export function isPrePushHookEnabled(): boolean {
  const settings = readSettings();
  return !!settings.prePushEnabled;
}

export async function preventIfStructureLocked(commandName: string) {
  if (isStructureLocked()) {
    console.error(
      theme.error.bold(`${icons.error} Error: structure.sr is locked.`) +
      theme.warning(` Command '${commandName}' cannot modify the structure while locked.`)
    );
    exit(1);
  }
}