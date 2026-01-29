#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { validateConstraints } from "./validator.js";
import { parseStructure } from "./parser.js";
import { generateFS } from "./generator.js";
import { FolderNode } from "./ast.js";
import { addNode, deleteNode, renameNode } from "./structure.js";
import { validateFS } from "./validateFS.js";
import { buildASTFromFS } from "./fsToAst.js";
import { DEFAULT_TEMPLATE, DEFAULT_IGNORE_TEMPLATE } from './data/index.js'
const pkg = require("../package.json");
import { getIgnoreList } from "./utils/index.js";
import { createProgressBar } from "./progress.js";
import { STRUCTURE_FILE,IGNORE_FILE } from "./utils/index.js";
import { flattenTree, loadConstraints,hasFlag,getPassedFlags,getFlagValuesAfter,
  loadAST,confirmProceed,saveStructure,filterTreeByIgnore,printTree,printTreeWithIcons,
  renameFSItem,ALLOWED_FLAGS,printUsage
} from "./utils/index.js";


const baseDir = process.cwd()
const args = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const arg3 = args[0];
const arg4 = args[1];


const SCAFFOLDRITE_DIR = path.join(baseDir, ".scaffoldrite");

export const STRUCTURE_PATH = path.join(
  SCAFFOLDRITE_DIR,
  STRUCTURE_FILE
);

const IGNORE_PATH = path.join(
  SCAFFOLDRITE_DIR,
  IGNORE_FILE
);


/* ===================== CLI ===================== */


const command = process.argv[2];
const passedFlags = getPassedFlags();
const allowedFlags = ALLOWED_FLAGS[command];
const dryRun = hasFlag("--dry-run");
const bar = createProgressBar();
const verbose = hasFlag("--verbose");
const summary = hasFlag("--summary");

const includeSR = hasFlag("--include-sr");
const includeIgnore = hasFlag("--include-ignore");
const includeTooling = hasFlag("--include-tooling");


// ===================== INIT CHECK =====================
const requiresInit = ["update", "merge", "validate", "generate", "create", "delete", "rename", "list"];
if (requiresInit.includes(command)) {
  if (!fs.existsSync(SCAFFOLDRITE_DIR) || !fs.existsSync(STRUCTURE_PATH)) {
    console.error(
      `Error: Scaffoldrite is not initialized.\n` +
      `Please run:\n  scaffoldrite init [dir]`
    );
    printUsage("init");
    process.exit(1);
  }
}


const shouldIncludeSR = includeSR && !includeTooling;
const shouldIncludeIgnore = includeIgnore && !includeTooling;


const isStructure = hasFlag("--structure") || hasFlag("--sr");
const isFS = hasFlag("--fs");
const isDiff = hasFlag("--diff");
const withIcons = hasFlag('--with-icon')


const empty = hasFlag("--empty");
const fromFs = hasFlag("--from-fs");

const force = hasFlag("--force");
const ifNotExists = hasFlag("--if-not-exists");

const allowExtraPaths = getFlagValuesAfter("--allow-extra");
const allowExtra = hasFlag("--allow-extra") && allowExtraPaths.length === 0;

const parsed = parseStructure(DEFAULT_TEMPLATE);


// Show usage if no command or help requested
if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}


if (!allowedFlags) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const invalidFlags = passedFlags.filter(
  (flag) => !allowedFlags.includes(flag)
);


if (invalidFlags.length > 0) {
  console.error(
    `Unknown flag(s) for '${command}': ${invalidFlags.join(", ")}`
  );
  printUsage(command);
  process.exit(1);
}



(async () => {

  if (command === "version") {
    console.log(pkg.version);
    process.exit(0);
  }

  /* ===== INIT ===== */
  if (command === "init") {
    const shouldOverwrite = force;

    const tDir = arg3
  ? path.resolve(baseDir, arg3)
  : baseDir;

    const sDir = path.join(tDir, ".scaffoldrite");

    // Create folder if missing
    if (!fs.existsSync(sDir)) {
      fs.mkdirSync(sDir, { recursive: true });
    }


    /* ===============================
     * OVERWRITE GUARDS
     * =============================== */
    if (!shouldOverwrite) {
      if (fs.existsSync(STRUCTURE_PATH)) {
        console.error(
          "structure.sr already exists.\n" +
          "Use --force to overwrite everything."
        );
        process.exit(1);
      }

      if (fs.existsSync(IGNORE_PATH)) {
        console.error(
          ".scaffoldignore already exists.\n" +
          "Use --force to overwrite everything."
        );
        process.exit(1);
      }
    }

    /* ===============================
     * FLAG VALIDATION
     * =============================== */
    if (empty && fromFs) {
      console.error(
        "Mutually exclusive flags: --empty and --from-fs cannot be used together.\n" +
        "Use:\n" +
        "  --empty    Initialize an empty structure\n" +
        "  --from-fs  Initialize structure from the filesystem"
      );
      process.exit(1);
    }

    /* ===============================
     * EMPTY INIT
     * =============================== */
    if (empty) {
      const root: FolderNode = {
        type: "folder",
        name: ".",
        children: [],
      };

      saveStructure(root, parsed.rawConstraints, STRUCTURE_PATH);

      if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
        if (shouldOverwrite && fs.existsSync(IGNORE_PATH)) {
          console.warn("Overwriting existing .scaffoldignore due to --force");
        }
        fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
      }

      console.log("Empty structure.sr created");
      return;
    }

    /* ===============================
     * INIT FROM FILESYSTEM
     * =============================== */
    if (fromFs) {
      const targetDir = path.resolve(arg3 ?? baseDir);

      const ignoreList = getIgnoreList(targetDir);
      const ast = buildASTFromFS(targetDir, ignoreList);


      saveStructure(ast, parsed.rawConstraints, STRUCTURE_PATH);

      if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
        if (shouldOverwrite && fs.existsSync(IGNORE_PATH)) {
          console.warn("Overwriting existing .scaffoldignore due to --force");
        }
        fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
      }

      console.log(`structure.sr generated from filesystem: ${targetDir}`);
      return;
    }

    /* ===============================
     * DEFAULT INIT (TEMPLATE)
     * =============================== */

    saveStructure(parsed.root, parsed.rawConstraints, STRUCTURE_PATH);

    if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
      if (shouldOverwrite && fs.existsSync(IGNORE_PATH)) {
        console.warn("Overwriting existing .scaffoldignore due to --force");
      }
      fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
    }

    console.log("structure.sr created");
    return;
  }


  /* ===== UPDATE ===== */
  if (command === "update") {
    const fromFs = hasFlag("--from-fs");

    if (!fromFs) {
      printUsage("update");
      process.exit(1);
    }

    //  FAIL if structure.sr does not exist
    if (!fs.existsSync(STRUCTURE_PATH)) {
      console.error("Error: structure.sr not found. Run `scaffoldrite init` first.");
      process.exit(1);
    }

    const targetDir = path.resolve(arg3 ?? baseDir);

    const ignoreList = getIgnoreList(targetDir);
    const ast = buildASTFromFS(targetDir, ignoreList);


    const constraints = loadConstraints();

    // confirmation
    if (!(await confirmProceed(targetDir))) {
      console.log("Update cancelled.");
      return;
    }

    saveStructure(ast, constraints, STRUCTURE_PATH);

    console.log(`structure.sr updated from filesystem: ${targetDir}`);
    return;
  }


  /* ===== MERGE ===== */
  if (command === "merge") {
     
    const fromFs = hasFlag("--from-fs");

    if (!fromFs || !arg3) {
      printUsage("merge");
      process.exit(1);
    }


    // FAIL if structure.sr does not exist
    if (!fs.existsSync(STRUCTURE_PATH)) {
      console.error("Error: structure.sr not found. Run `scaffoldrite init` first.");
      process.exit(1);
    }
   
    const targetDir = path.resolve(arg3 ?? baseDir);
    
    const ignoreList = getIgnoreList(targetDir);
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


    // confirmation
    if (!(await confirmProceed(targetDir))) {
      console.log("Merge cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

    console.log(`structure.sr merged with filesystem: ${targetDir}`);
    return;
  }

  /* ===== LIST ===== */
  if (command === "list") {
    const isDefault = !isFS && !isDiff && !isStructure;

    const targetDir = path.resolve(baseDir);
   

    /* ================= DEFAULT (NO IGNORE) ================= */
    if (isDefault) {
      if (!fs.existsSync(STRUCTURE_PATH)) {
        console.error("structure.sr not found. Run `scaffoldrite init` first.");
        process.exit(1);
      }

      const structure = loadAST();

      console.log("📄 structure.sr\n");
      if (withIcons) {
        printTreeWithIcons(structure.root);
      } else {
        printTree(structure.root)
      }
      return;
    }

    const ignoreList = getIgnoreList(targetDir);

    /* ================= STRUCTURE.SR (WITH IGNORE) ================= */
    if (isStructure) {
      if (!fs.existsSync(STRUCTURE_PATH)) {
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

      if (withIcons) {
        printTreeWithIcons(fsAst);
      } else {
        printTree(fsAst)
      }
      return;
    }

    /* ================= DIFF (MEANINGFUL + IGNORE) ================= */
    if (isDiff) {
      if (!fs.existsSync(STRUCTURE_PATH)) {
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

    const outputDir = path.resolve(baseDir);
    const ignoreList = getIgnoreList(outputDir);

    try {
      validateConstraints(structure.root, structure.constraints);
      validateFS(structure.root, outputDir, {
        ignoreList,
        allowExtra,
        allowExtraPaths,
      });
      console.log("All constraints and filesystem structure are valid");
    } catch (err: any) {
      console.error("Validation failed:", err.message);
      process.exit(1);
    }
    return;
  }

  if (command === "generate") {
    if (summary && verbose) {
      console.error(
        "Mutually exclusive flags: --summary and --verbose cannot be used together.\n" +
        "Use either:\n" +
        "  --summary    Show only a summary of operations\n" +
        "  --verbose    Show all operations including skipped items"
      );
      process.exit(1);
    }
    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);


    const outputDir = path.resolve(arg3 ?? baseDir);
    const bDir = path.resolve(baseDir)

    if (!(await confirmProceed(outputDir))) {
      console.log("Generation cancelled.");
      return;
    }

    const ignoreList = getIgnoreList(bDir);
    ignoreList.push(".scaffoldrite");


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

        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      },
    });

    bar.stop();
    const structureOutput = path.join(outputDir, '.scaffoldrite', "structure.sr");
    const ignoreOutput = path.join(outputDir, '.scaffoldrite', ".scaffoldignore");



    if (!dryRun) {
      if (includeTooling) {
        // Tooling copies structure + ignore + any tooling stuff
        if (fs.existsSync(STRUCTURE_PATH)) {
          fs.copyFileSync(STRUCTURE_PATH, structureOutput);
        }
        if (fs.existsSync(IGNORE_PATH)) {
          fs.copyFileSync(IGNORE_PATH, ignoreOutput);
        }
      } else {
        // Only copy if flags are set
        if (shouldIncludeSR && fs.existsSync(STRUCTURE_PATH)) {
          fs.copyFileSync(STRUCTURE_PATH, structureOutput);
        }
        if (shouldIncludeIgnore && fs.existsSync(IGNORE_PATH)) {
          fs.copyFileSync(IGNORE_PATH, ignoreOutput);
        }
      }
    }


    if (verbose) {
      for (const line of logLines) {
        console.log(line);
      }
    } else if (summary) {
      for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
        console.log(line);
      }
    }

    return;
  }


  /* ===== CREATE ===== */
  if (command === "create") {
    if (summary && verbose) {
      console.error(
        "Mutually exclusive flags: --summary and --verbose cannot be used together.\n" +
        "Use either:\n" +
        "  --summary    Show only a summary of operations\n" +
        "  --verbose    Show all operations including skipped items"
      );
      process.exit(1);
    }
    if (!arg3 || !arg4) {
      printUsage("create");
      process.exit(1);
    }


    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    addNode(structure.root, arg3, arg4 as "file" | "folder", {
      force,
      ifNotExists,
    });

    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(baseDir);

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

    saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

    const logLines: string[] = [];
    const ignoreList = getIgnoreList(outputDir);

    await generateFS(structure.root, outputDir, {
      dryRun,
      ignoreList,
      onProgress(e) {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      },
    });

    if (verbose) {
      for (const line of logLines) {
        console.log(line);
      }
    } else if (summary) {
      for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
        console.log(line);
      }
    }



    process.stdout.write("\n");
    console.log("Created successfully.");
    return;
  }

  /* ===== DELETE ===== */
  if (command === "delete") {
    if (summary && verbose) {
      console.error(
        "Mutually exclusive flags: --summary and --verbose cannot be used together.\n" +
        "Use either:\n" +
        "  --summary    Show only a summary of operations\n" +
        "  --verbose    Show all operations including skipped items"
      );
      process.exit(1);
    }

    if (!arg3) {
      printUsage("delete");
      process.exit(1);
    }

    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    deleteNode(structure.root, arg3);

    validateConstraints(structure.root, structure.constraints);

    const outputDir = path.resolve(baseDir);

    if (!(await confirmProceed(outputDir))) {
      console.log("Deletion cancelled.");
      return;
    }

    saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);
    const logLines: string[] = [];
    const ignoreList = getIgnoreList(outputDir);

    await generateFS(structure.root, outputDir, {
      dryRun,
      ignoreList,
      onProgress(e) {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      },
    });

    if (verbose) {
      for (const line of logLines) {
        console.log(line);
      }
    } else if (summary) {
      for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
        console.log(line);
      }
    }


    process.stdout.write("\n");
    console.log("Deleted successfully.");
    return;
  }

  /* ===== RENAME ===== */
  if (command === "rename") {
    if (summary && verbose) {
      console.error(
        "Mutually exclusive flags: --summary and --verbose cannot be used together.\n" +
        "Use either:\n" +
        "  --summary    Show only a summary of operations\n" +
        "  --verbose    Show all operations including skipped items"
      );
      process.exit(1);
    }

    if (!arg3 || !arg4) {
      printUsage("rename");
      process.exit(1);
    }

    const structure = loadAST();
    validateConstraints(structure.root, structure.constraints);

    // 1️⃣ determine old path and new path
    const oldPath = arg3;
    const newName = arg4;
    const outputDir = path.resolve(baseDir);

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

    saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

    const logLines: string[] = [];
    const ignoreList = getIgnoreList(outputDir);

    await generateFS(structure.root, outputDir, {
      dryRun,
      ignoreList,
      onProgress(e) {
        logLines.push(`${e.type.toUpperCase()} ${e.path}`);
      },
    });

    if (verbose) {
      for (const line of logLines) {
        console.log(line);
      }
    } else if (summary) {
      for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
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