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
import { buildASTFromFS, DEFAULT_IGNORES, getIgnoreList } from "./fsToAst.js";
import { DEFAULT_TEMPLATE, DEFAULT_IGNORE_TEMPLATE } from './data/index.js'
const pkg = require("../package.json");
import { sortTree } from "./utils/index.js";
import { createProgressBar } from "./progress.js";

const structurePath = "./structure.sr";

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function ensureToolFileInStructure(root: FolderNode, filename: string) {
  const exists = root.children.some(
    (child) => child.type === "file" && child.name === filename
  );

  if (!exists) {
    root.children.unshift({
      type: "file",
      name: filename,
    });
  }
}

function loadConstraints() {
  const content = fs.readFileSync(structurePath, "utf-8");
  const parsed = parseStructure(content);
  return parsed.rawConstraints;
}

function getPassedFlags(): string[] {
  return process.argv.filter((arg) => arg.startsWith("--"));
}

/* ===================== HELPERS ===================== */

function confirmProceed(dir: string): Promise<boolean> {
  if (hasFlag("--yes") || hasFlag("-y")) return Promise.resolve(true);

  if (!fs.existsSync(dir)) return Promise.resolve(true);
  if (fs.readdirSync(dir).length === 0) return Promise.resolve(true);

  console.warn("Output directory is not empty:", dir);

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
  sortTree(root);
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

function countNodes(node: FolderNode) {
  let count = 0;

  for (const child of node.children) {
    count++;
    if (child.type === "folder") {
      count += countNodes(child);
    }
  }

  return count;
}


// function printTree(root: FolderNode, indent = "") {
//   for (const child of root.children) {
//     if (child.type === "folder") {
//       console.log(`${indent} ${child.name}`);
//       printTree(child, indent + "  ");
//     } else {
//       console.log(`${indent} ${child.name}`);
//     }
//   }
// }


function printTreeWithIcons(node: FolderNode, indent = "") {
  for (const child of node.children) {
    if (child.type === "folder") {
      console.log(`${indent}📁 ${child.name}`);
      printTreeWithIcons(child, indent + "  ");
    } else {
      console.log(`${indent}📄 ${child.name}`);
    }
  }
}


function renameFSItem(oldPath: string, newPath: string) {
  if (!fs.existsSync(oldPath)) return false;

  const newDir = path.dirname(newPath);
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

  fs.renameSync(oldPath, newPath);
  return true;
}



function filterTreeByIgnore(
  node: FolderNode,
  ignoreList: string[]
): FolderNode {
  return {
    ...node,
    children: node.children
      .filter((child) => !ignoreList.includes(child.name))
      .map((child) =>
        child.type === "folder"
          ? filterTreeByIgnore(child, ignoreList)
          : child
      ),
  };
}



function flattenTree(
  node: FolderNode,
  base = ""
): Map<string, "file" | "folder"> {
  const map = new Map<string, "file" | "folder">();

  for (const child of node.children) {
    const fullPath = path.posix.join(base, child.name);
    map.set(fullPath, child.type);

    if (child.type === "folder") {
      for (const [k, v] of flattenTree(child, fullPath)) {
        map.set(k, v);
      }
    }
  }

  return map;
}



/* ===================== CLI ===================== */

const ALLOWED_FLAGS: Record<string, string[]> = {
  init: ["--force", "--empty", "--from-fs"],
  update: ["--from-fs", "--yes", "-y"],
  merge: ["--from-fs", "--yes", "-y"],
  validate: ["--allow-extra"],
  generate: ["--yes", "--dry-run", "--verbose", "--show"],
  create: ["--force", "--if-not-exists", "--yes", "--dry-run", "--verbose", "--show"] ,
  delete: ["--yes", "--dry-run", "--verbose","--show"],
  rename: ["--yes", "--dry-run", "--verbose", "--show"],
  list: ["--structure", "--sr", "--fs", "--diff", "--show"],
  version: [],
};


const command = process.argv[2];
const passedFlags = getPassedFlags();
const allowedFlags = ALLOWED_FLAGS[command];
const dryRun = hasFlag("--dry-run");
const bar = createProgressBar();
const verbose = hasFlag("--verbose");
const show = hasFlag("--show");




if (!allowedFlags) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const invalidFlags = passedFlags.filter(
  (flag) => !allowedFlags.includes(flag)
);

if (invalidFlags.length > 0) {
  console.error(
    `Unknown flag(s) for '${command}': ${invalidFlags.join(", ")}\n` +
    `Run 'scaffoldrite ${command} --help' to see available options.`
  );
  process.exit(1);
}

if (!command) {
  console.log(`
Usage:
  scaffoldrite init [--force] [--empty] [--from-fs <dir>]
  scaffoldrite update [--from-fs <dir>]
  scaffoldrite merge [--from-fs <dir>]
  scaffoldrite validate [dir] [--allow-extra] [--allow-extra <path1> <path2> ...]
  scaffoldrite generate [dir] [--yes]
  scaffoldrite list [--sr|--structure | --fs] [dir] 
  scaffoldrite create <path> <file|folder> [dir] [--force] [--if-not-exists]
  scaffoldrite delete <path> [dir] [--yes]
  scaffoldrite rename <path> <newName> [dir] [--yes]
`);
  process.exit(1);
}

function getFlagValuesAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return [];
  const values: string[] = [];
  for (let i = index + 1; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) break;
    values.push(arg);
  }
  return values;
}

const force = hasFlag("--force");
const ifNotExists = hasFlag("--if-not-exists");

const allowExtraPaths = getFlagValuesAfter("--allow-extra");
const allowExtra = hasFlag("--allow-extra") && allowExtraPaths.length === 0;

const args = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const arg3 = args[0];
const arg4 = args[1];
const arg5 = args[2];

(async () => {

  if (command === "version") {
    console.log(pkg.version);
    process.exit(0);
  }

  /* ===== INIT ===== */
  if (command === "init") {
    const empty = hasFlag("--empty");
    const fromFs = hasFlag("--from-fs");

    const ignorePath = "./.scaffoldignore";

    // Prevent overwriting structure.sr unless --force
    if (fs.existsSync(structurePath) && !force) {
      console.error(
        "structure.sr already exists.\n" +
        "Use --force to overwrite everything."
      );
      process.exit(1);
    }

    // Never overwrite scaffoldignore
    if (fs.existsSync(ignorePath)) {
      console.log(".scaffoldignore already exists. It will not be overwritten.");
    }

    /* ===== EMPTY INIT ===== */
    if (empty) {
      const root: FolderNode = {
        type: "folder",
        name: ".",
        children: [],
      };

      ensureToolFileInStructure(root, ".scaffoldignore");
      ensureToolFileInStructure(root, "structure.sr");

      saveStructure(root, [], structurePath);

      if (!fs.existsSync(ignorePath)) {
        fs.writeFileSync(ignorePath, DEFAULT_IGNORE_TEMPLATE);
      }

      console.log("Empty structure.sr created");
      return;
    }

    /* ===== INIT FROM FILESYSTEM ===== */
    if (fromFs) {
      const targetDir = path.resolve(args[0] ?? process.cwd());

      const ignoreList = getIgnoreList();
      const ast = buildASTFromFS(targetDir, ignoreList);

      ensureToolFileInStructure(ast, ".scaffoldignore");
      ensureToolFileInStructure(ast, "structure.sr");

      saveStructure(ast, [], structurePath);

      if (!fs.existsSync(ignorePath)) {
        fs.writeFileSync(ignorePath, DEFAULT_IGNORE_TEMPLATE);
      }

      console.log(`structure.sr generated from filesystem: ${targetDir}`);
      return;
    }

    /* ===== DEFAULT INIT ===== */
    const parsed = parseStructure(DEFAULT_TEMPLATE);

    ensureToolFileInStructure(parsed.root, ".scaffoldignore");
    ensureToolFileInStructure(parsed.root, "structure.sr");

    saveStructure(parsed.root, parsed.rawConstraints, structurePath);

    if (!fs.existsSync(ignorePath)) {
      fs.writeFileSync(ignorePath, DEFAULT_IGNORE_TEMPLATE);
    }

    console.log("structure.sr created");
    return;
  }
  

  /* ===== UPDATE ===== */
  if (command === "update") {
    const fromFs = hasFlag("--from-fs");

    if (!fromFs) {
      console.error("Usage: scaffoldrite update --from-fs <dir>");
      process.exit(1);
    }

    //  FAIL if structure.sr does not exist
    if (!fs.existsSync(structurePath)) {
      console.error("Error: structure.sr not found. Run `scaffoldrite init` first.");
      process.exit(1);
    }

    const targetDir = path.resolve(args[0] ?? process.cwd());

    const ignoreList = getIgnoreList();
    const ast = buildASTFromFS(targetDir, ignoreList);

    ensureToolFileInStructure(ast, ".scaffoldignore");
    ensureToolFileInStructure(ast, "structure.sr");

    const constraints = loadConstraints();

    // confirmation
    if (!(await confirmProceed(targetDir))) {
      console.log("Update cancelled.");
      return;
    }

    saveStructure(ast, constraints, structurePath);

    console.log(`structure.sr updated from filesystem: ${targetDir}`);
    return;
  }


  /* ===== MERGE ===== */
  if (command === "merge") {
    const fromFs = hasFlag("--from-fs");

    if (!fromFs) {
      console.error("Usage: scaffoldrite merge --from-fs <dir>");
      process.exit(1);
    }

    // FAIL if structure.sr does not exist
    if (!fs.existsSync(structurePath)) {
      console.error("Error: structure.sr not found. Run `scaffoldrite init` first.");
      process.exit(1);
    }

    const targetDir = path.resolve(args[0] ?? process.cwd());

    const ignoreList = getIgnoreList();
    const fsAst = buildASTFromFS(targetDir, ignoreList);
    const structure = loadAST();

    // Merge logic
    const mergeNodes = (existing: FolderNode, incoming: FolderNode) => {
      for (const child of incoming.children) {
        if (child.type === "folder") {
          const found = existing.children.find(
            (c) => c.type === "folder" && c.name === child.name
          ) as FolderNode | undefined;

          if (found) mergeNodes(found, child);
          else existing.children.push(child);
        } else {
          const exists = existing.children.some(
            (c) => c.type === "file" && c.name === child.name
          );
          if (!exists) existing.children.push(child);
        }
      }
    };

    mergeNodes(structure.root, fsAst);

    ensureToolFileInStructure(structure.root, ".scaffoldignore");
    ensureToolFileInStructure(structure.root, "structure.sr");

    // confirmation
    if (!(await confirmProceed(targetDir))) {
      console.log("Merge cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);

    console.log(`structure.sr merged with filesystem: ${targetDir}`);
    return;
  }

  /* ===== LIST ===== */
  if (command === "list") {
    const isDefault =
      !hasFlag("--fs") && !hasFlag("--diff") && !hasFlag("--structure") && !hasFlag("--sr");

    const isStructure = hasFlag("--structure") || hasFlag("--sr");
    const isFS = hasFlag("--fs");
    const isDiff = hasFlag("--diff");

    const targetDir = path.resolve(args[0] ?? process.cwd());

    /* ================= DEFAULT (NO IGNORE) ================= */
    if (isDefault) {
      if (!fs.existsSync(structurePath)) {
        console.error("structure.sr not found. Run `scaffoldrite init` first.");
        process.exit(1);
      }

      const structure = loadAST();

      console.log("📄 structure.sr\n");
      printTreeWithIcons(structure.root);
      return;
    }

    const ignoreList = getIgnoreList();

    /* ================= STRUCTURE.SR (WITH IGNORE) ================= */
    if (isStructure) {
      if (!fs.existsSync(structurePath)) {
        console.error("structure.sr not found. Run `scaffoldrite init` first.");
        process.exit(1);
      }

      const structure = loadAST();
      const filtered = filterTreeByIgnore(structure.root, ignoreList);

      console.log("📄 structure.sr");
      console.log(`Ignoring: ${ignoreList.join(", ")}\n`);

      printTreeWithIcons(filtered);
      return;
    }

    /* ================= FILESYSTEM (WITH IGNORE) ================= */
    if (isFS) {
      const fsAst = buildASTFromFS(targetDir, ignoreList);

      console.log(`🗂 filesystem (${targetDir})`);
      console.log(`Ignoring: ${ignoreList.join(", ")}\n`);

      printTreeWithIcons(fsAst);
      return;
    }

    /* ================= DIFF (MEANINGFUL + IGNORE) ================= */
    if (isDiff) {
      if (!fs.existsSync(structurePath)) {
        console.error("structure.sr not found. Run `scaffoldrite init` first.");
        process.exit(1);
      }

      const structure = loadAST();
      const filteredStructure = filterTreeByIgnore(structure.root, ignoreList);
      const fsAst = buildASTFromFS(targetDir, ignoreList);

      const structMap = flattenTree(filteredStructure);
      const fsMap = flattenTree(fsAst);

      console.log("📄 structure.sr ↔ 🗂 filesystem diff");
      console.log(`Ignoring: ${ignoreList.join(", ")}\n`);

      for (const p of Array.from(
        new Set([...structMap.keys(), ...fsMap.keys()])
      ).sort()) {
        const inStruct = structMap.has(p);
        const inFS = fsMap.has(p);

        if (inStruct && !inFS) {
          console.log(`❌ Missing in filesystem: ${p}`);
        } else if (!inStruct && inFS) {
          console.log(`➕ Extra in filesystem: ${p}`);
        }
      }

      return;
    }
  }


  /* ===== VALIDATE ===== */
  if (command === "validate") {
    const structure = loadAST();

    const outputDirArg = args.find((a) => {
      if (a.startsWith("--")) return false;
      if (allowExtraPaths.includes(a)) return false;
      return true;
    });

    const outputDir = path.resolve(outputDirArg ?? process.cwd());
  
    
    try {
      validateConstraints(structure.root, structure.constraints);
      validateFS(structure.root, outputDir, allowExtra, allowExtraPaths);
      console.log("All constraints and filesystem structure are valid");
    } catch (err: any) {
      console.error("Validation failed:", err.message);
      process.exit(1);
    }
    return;
  }

if (command === "generate") {
  const structure = loadAST();
  validateConstraints(structure.root, structure.constraints);

  const outputDir = path.resolve(arg3 ?? process.cwd());

  if (!(await confirmProceed(outputDir))) {
    console.log("Generation cancelled.");
    return;
  }
  
   const ignoreList = getIgnoreList();
  const logLines: string[] = [];
  let totalOps = 0;

  await generateFS(structure.root, outputDir, {
    dryRun,
    ignoreList,
    onStart(total) {
      totalOps = total;
      bar.start(total);
    },
    onProgress(e) {
      bar.update({
        type: e.type.toUpperCase(),
        path: e.path,
        count: e.count,
      });

      if (show && e.type !== 'skip') {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      }
    },
  });

  bar.stop();

  if (show) {
    for (const line of logLines) {
      console.log(line);
    }
  }

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
      console.log("Creation cancelled.");
      return;
    }

    if (force) {
      const fullPath = path.join(outputDir, arg3);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);
    
    const logLines: string[] = [];
     const ignoreList = getIgnoreList();

  await generateFS(structure.root, outputDir, {
    dryRun,
    ignoreList,
    onProgress(e) {
      if (show && e.type !== "skip") {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      }
    },
  });

  if (show) {
    for (const line of logLines) {
      console.log(line);
    }
  }



    process.stdout.write("\n");
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
      console.log("Deletion cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, structurePath);
      const logLines: string[] = [];
       const ignoreList = getIgnoreList();

  await generateFS(structure.root, outputDir, {
    dryRun,
    ignoreList,
    onProgress(e) {
      if (show && e.type !== "skip") {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      }
    },
  });

  if (show) {
    for (const line of logLines) {
      console.log(line);
    }
  }


    process.stdout.write("\n");
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

  // 1️⃣ determine old path and new path
  const oldPath = arg3;
  const newName = arg4;
  const outputDir = path.resolve(arg5 ?? process.cwd());

  // Build full paths
  const oldFullPath = path.join(outputDir, oldPath);
  const newFullPath = path.join(outputDir, path.join(path.dirname(oldPath), newName));

  // 2️⃣ Rename on filesystem first (safe)
  const renamed = renameFSItem(oldFullPath, newFullPath);

  if (!renamed) {
    console.warn("Warning: Item not found in filesystem, will create new based on structure.sr.");
  }

  // 3️⃣ Rename in structure.sr
  renameNode(structure.root, oldPath, newName);

  validateConstraints(structure.root, structure.constraints);

  if (!(await confirmProceed(outputDir))) {
    console.log("Rename cancelled.");
    return;
  }

  saveStructure(structure.root, structure.rawConstraints, structurePath);

  const logLines: string[] = [];
  const ignoreList = getIgnoreList();

  await generateFS(structure.root, outputDir, {
    dryRun,
    ignoreList,
    onProgress(e) {
      if (show && e.type !== "skip") {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      }
    },
  });

  if (show) {
    for (const line of logLines) {
      console.log(line);
    }
  }

  process.stdout.write("\n");
  console.log("Renamed successfully.");
  return;
}


  console.error(`Unknown command: ${command}`);
})().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
