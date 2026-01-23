#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { validateConstraints } from "./validator.js";
import { parseStructure } from "./parser.js";
import { generateFS } from "./generator.js";
import { FolderNode } from "./ast.js";
import { addNode, deleteNode, renameNode } from "./structure.js";
import { validateFS } from "./validateFS.js";
import { buildASTFromFS,DEFAULT_IGNORES } from "./fsToAst.js";
import {DEFAULT_TEMPLATE} from './data/index.js'


/* ===================== CONSTANTS ===================== */

const structurePath = "./structure.sr";

/* ===================== FLAG HELPERS ===================== */

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function getFlagValue(flagPrefix: string): string[] {
  return process.argv
    .filter((arg) => arg.startsWith(flagPrefix))
    .map((arg) => arg.split("=")[1])
    .filter(Boolean);
}

function parseCSVFlag(flagName:string) {
  return getFlagValue(flagName)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

/* ===================== HELPERS ===================== */

function confirmProceed(dir: string): Promise<boolean> {
  // Skip prompt if user asked for it
  if (hasFlag("--yes") || hasFlag("-y")) return Promise.resolve(true);

  if (!fs.existsSync(dir)) return Promise.resolve(true);
  if (fs.readdirSync(dir).length === 0) return Promise.resolve(true);

  console.warn("⚠️ Output directory is not empty:", dir);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Proceed and apply changes? (y/N): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/* ===================== STRUCTURE IO ===================== */

function saveStructure(
  root: FolderNode,
  rawConstraints: string[],
  filePath: string
) {
  const lines: string[] = [];

  function writeFolder(folder: FolderNode, indent = "") {
    lines.push(`${indent}folder ${folder.name} {`);
    for (const child of folder.children) {
      if (child.type === "folder") writeFolder(child, indent + "  ");
      else lines.push(`${indent}  file ${child.name}`);
    }
    lines.push(`${indent}}`);
  }

  for (const child of root.children) {
    if (child.type === "folder") writeFolder(child);
    else lines.push(`file ${child.name}`);
  }

  if (rawConstraints.length > 0) {
    lines.push("");
    lines.push("constraints {");
    for (const c of rawConstraints) {
      lines.push(`  ${c}`);
    }
    lines.push("}");
  }

  fs.writeFileSync(filePath, lines.join("\n"));
}

function loadAST() {
  const content = fs.readFileSync(structurePath, "utf-8");
  return parseStructure(content);
}

function printTree(root: FolderNode, indent = "") {
  for (const child of root.children) {
    if (child.type === "folder") {
      console.log(`${indent}📁 ${child.name}`);
      printTree(child, indent + "  ");
    } else {
      console.log(`${indent}📄 ${child.name}`);
    }
  }
}


/* ===================== CLI ===================== */

const command = process.argv[2];

  if (!command) {
  console.log(`
Usage:
  scaffoldrite init [--force] [--yes]
  scaffoldrite validate [dir]
  scaffoldrite generate [dir]
  scaffoldrite list
  scaffoldrite create <path> <file|folder> [dir]
  scaffoldrite delete <path> [dir]
  scaffoldrite rename <path> <newName> [dir]
`);
  process.exit(1);
}





const force = hasFlag("--force");
const ifNotExists = hasFlag("--if-not-exists");
const allowExtra = hasFlag("--allow-extra");
const allowExtraPaths = getFlagValue("--allow-extra=");

const args = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const arg3 = args[0];
const arg4 = args[1];
const arg5 = args[2];

(async () => {

/* ===== INIT ===== */
 if (command === "init") {
    const empty = hasFlag("--empty");
    const fromFs = hasFlag("--from-fs");

    if (fs.existsSync(structurePath) && !force) {
    if (hasFlag("--yes") || hasFlag("-y")) {
      // allow overwrite without prompt
    } else {
      console.error("❌ structure.sr already exists. Use --force to overwrite.");
      process.exit(1);
    }
  }

    // 1️⃣ Empty init
    if (empty) {
      fs.writeFileSync(structurePath, "constraints {\n}\n");
      console.log("✅ Empty structure.sr created");
      return;
    }

    // 2️⃣ Init from filesystem
    if (fromFs) {
  const targetDir = path.resolve(args[0] ?? process.cwd());

  const ignoreList = [...DEFAULT_IGNORES];
  const ignoreExtra = parseCSVFlag("--ignore");
  const includeExtra = parseCSVFlag("--include");

  ignoreList.push(...ignoreExtra);
  for (const item of includeExtra) {
    const idx = ignoreList.indexOf(item);
    if (idx !== -1) ignoreList.splice(idx, 1);
  }

  const ast = buildASTFromFS(targetDir, ignoreList);
  saveStructure(ast, [], structurePath);

  console.log(`✅ structure.sr generated from filesystem: ${targetDir}`);
  console.log("ℹ️ No validation was performed");
  return;
}


    // 3️⃣ Default template
    fs.writeFileSync(structurePath, DEFAULT_TEMPLATE);
    console.log("✅ structure.sr created");
    return;
  }


  /* ===== LIST ===== */
  if (command === "list") {
    const structure = loadAST();
    console.log("Current structure:");
    printTree(structure.root);
    return;
  }

  /* ===== VALIDATE ===== */
  if (command === "validate") {
    const structure = loadAST();
    try {
      validateConstraints(structure.root, structure.constraints);

      // NEW: validate actual filesystem too
      const outputDir = path.resolve(arg3 ?? process.cwd());
      validateFS(
        structure.root,
        outputDir,
        allowExtra,
        allowExtraPaths
      );

      console.log("✅ All constraints and filesystem structure are valid");
    } catch (err: any) {
      console.error("❌ Validation failed:", err.message);
    }
    return;
  }

  /* ===== GENERATE ===== */
  if (command === "generate") {
    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(arg3 ?? process.cwd());

    if (!(await confirmProceed(outputDir))) {
      console.log("❌ Generation cancelled.");
      return;
    }

    generateFS(structure.root, outputDir);
    console.log("Generated filesystem at:", outputDir);
    return;
  }

  /* ===== CREATE ===== */
  if (command === "create") {
    if (!arg3 || !arg4) {
      console.error(
        "Usage: scaffoldrite create <path> <file|folder> [outputDir] [--force] [--if-not-exists] [--yes]"
      );
      process.exit(1);
    }

    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    addNode(structure.root, arg3, arg4 as "file" | "folder", {
      force,
      ifNotExists,
    });

    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(arg5 ?? process.cwd());

    if (!(await confirmProceed(outputDir))) {
      console.log("❌ Creation cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);
    generateFS(structure.root, outputDir);
    console.log("Created successfully.");
    return;
  }

  /* ===== DELETE ===== */
  if (command === "delete") {
    if (!arg3) {
      console.error("Usage: scaffoldrite delete <path> [outputDir] [--yes]");
      process.exit(1);
    }

    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    deleteNode(structure.root, arg3);

    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(arg4 ?? process.cwd());

    if (!(await confirmProceed(outputDir))) {
      console.log("❌ Deletion cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);
    generateFS(structure.root, outputDir);
    console.log("Deleted successfully.");
    return;
  }

  /* ===== RENAME ===== */
  if (command === "rename") {
    if (!arg3 || !arg4) {
      console.error(
        "Usage: scaffoldrite rename <path> <newName> [outputDir] [--yes]"
      );
      process.exit(1);
    }

    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    renameNode(structure.root, arg3, arg4);

    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(arg5 ?? process.cwd());

    if (!(await confirmProceed(outputDir))) {
      console.log("❌ Rename cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);
    generateFS(structure.root, outputDir);
    console.log("Renamed successfully.");
    return;
  }

  console.error(`Unknown command: ${command}`);
})();
