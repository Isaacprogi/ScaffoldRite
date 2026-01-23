#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { validateConstraints } from "./validator";
import { parseStructure } from "./parser";
import { generateFS } from "./generator.js";
import { FolderNode } from "./ast.js";
import { addNode, deleteNode, renameNode } from "./structure.js";

/* ===================== HELPERS ===================== */

function warnIfNotEmpty(dir: string) {
  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
    console.warn("⚠️ Output directory is not empty:", dir);
  }
}

/**
 * Saves folders + constraints back to structure.sr
 */
function saveStructure(
  root: FolderNode,
  rawConstraints: string[],
  filePath: string
) {
  const lines: string[] = [];

  function writeFolder(folder: FolderNode, indent = "") {
    lines.push(`${indent}folder ${folder.name} {`);

    for (const child of folder.children) {
      if (child.type === "folder") {
        writeFolder(child, indent + "  ");
      } else {
        lines.push(`${indent}  file ${child.name}`);
      }
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

function loadAST(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
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

/* ===================== CLI SETUP ===================== */

const command = process.argv[2];

if (!command) {
  console.log("Usage: scaffoldrite <command> <args>");
  process.exit(1);
}

const structurePath = process.argv[3] ?? "./structure.sr";

/* ===================== LIST ===================== */

if (command === "list") {
  const structure = loadAST(structurePath);
  console.log("Current structure:");
  printTree(structure.root);
  process.exit(0);
}

/* ===================== VALIDATE ===================== */

if (command === "validate") {
  const structure = loadAST(structurePath);
  try {
    validateConstraints(structure.root, structure.constraints);
    console.log("✅ All constraints are satisfied");
  } catch (err: any) {
    console.log("❌ Validation failed:", err.message);
  }
  process.exit(0);
}

/* ===================== GENERATE ===================== */

if (command === "generate") {
  const structure = loadAST(structurePath);

  validateConstraints(structure.root, structure.constraints);

  const outputDir = path.resolve(process.argv[4] ?? process.cwd());
  warnIfNotEmpty(outputDir);

  generateFS(structure.root, outputDir);
  console.log("Generated filesystem at:", outputDir);
}

/* ===================== CREATE ===================== */

if (command === "create") {
  const pathStr = process.argv[3];
  const type = process.argv[4] as "folder" | "file";

  const structure = loadAST(structurePath);

  validateConstraints(structure.root, structure.constraints);

  addNode(structure.root, pathStr, type);

  validateConstraints(structure.root, structure.constraints);

  saveStructure(structure.root, structure.rawConstraints, structurePath);

  const outputDir = path.resolve(process.argv[5] ?? process.cwd());
  warnIfNotEmpty(outputDir);

  generateFS(structure.root, outputDir);
  console.log("Created successfully.");
}

/* ===================== DELETE ===================== */

if (command === "delete") {
  const pathStr = process.argv[3];

  const structure = loadAST(structurePath);

  validateConstraints(structure.root, structure.constraints);

  deleteNode(structure.root, pathStr);

  validateConstraints(structure.root, structure.constraints);

  saveStructure(structure.root, structure.rawConstraints, structurePath);

  const outputDir = path.resolve(process.argv[5] ?? process.cwd());
  warnIfNotEmpty(outputDir);

  generateFS(structure.root, outputDir);
  console.log("Deleted successfully.");
}

/* ===================== RENAME ===================== */

if (command === "rename") {
  const pathStr = process.argv[3];
  const newName = process.argv[4];

  const structure = loadAST(structurePath);

  validateConstraints(structure.root, structure.constraints);

  renameNode(structure.root, pathStr, newName);

  validateConstraints(structure.root, structure.constraints);

  saveStructure(structure.root, structure.rawConstraints, structurePath);

  const outputDir = path.resolve(process.argv[5] ?? process.cwd());
  warnIfNotEmpty(outputDir);

  generateFS(structure.root, outputDir);
  console.log("Renamed successfully.");
}
