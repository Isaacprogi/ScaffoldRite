import fs from "fs";
import path from "path";
import { validateConstraints } from "./validator";
import { parseStructure } from "./parser";
import { generateFS } from "./generator.js";
import { FolderNode } from "./ast.js";
import { addNode, deleteNode, renameNode } from "./structure.js";

/**
 * Saves folders + constraints back to structure.txt
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

  // write folders/files
  for (const child of root.children) {
    if (child.type === "folder") writeFolder(child);
    else lines.push(`file ${child.name}`);
  }

  // write constraints back (CRITICAL FIX)
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

const command = process.argv[2];

if (!command) {
  console.log("Usage: node dist/cli.js <command> <args>");
  process.exit(1);
}

const structurePath = "./structure.txt";
const outputDir = "./output";

/* ===================== GENERATE ===================== */

if (command === "list") {
  const structure = loadAST(structurePath);
  console.log("Current structure:");
  printTree(structure.root);
  process.exit(0);
}

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

if (command === "generate") {
  const structure = loadAST(structurePath);

  validateConstraints(structure.root, structure.constraints);

  generateFS(structure.root, outputDir);
  console.log("Generated filesystem.");
}

/* ===================== CREATE ===================== */

if (command === "create") {
  const pathStr = process.argv[3];
  const type = process.argv[4] as "folder" | "file";

  const structure = loadAST(structurePath);

  // validate existing structure
  validateConstraints(structure.root, structure.constraints);

  // mutate
  addNode(structure.root, pathStr, type);

  // validate again (IMPORTANT)
  validateConstraints(structure.root, structure.constraints);

  saveStructure(
    structure.root,
    structure.rawConstraints,
    structurePath
  );

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

  saveStructure(
    structure.root,
    structure.rawConstraints,
    structurePath
  );

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

  saveStructure(
    structure.root,
    structure.rawConstraints,
    structurePath
  );

  generateFS(structure.root, outputDir);
  console.log("Renamed successfully.");
}
