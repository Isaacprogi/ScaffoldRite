import { FolderNode } from "../library/ast";
import fs from "fs";
import path from "path";
import { parseStructure } from "../library/parser";
import readline from "readline";
import { icons, theme } from "../data";
import { RequirementContext,MutuallyExclusiveContext } from "../types";

export const command = process.argv[2];

export const baseDir = process.cwd()

const SCAFFOLDRITE_DIR_TEXT = ".scaffoldrite";
const IGNORE_FILE_TEXT = ".scaffoldignore"
const STRUCTURE_FILE_TEXT = "structure.sr";

export const SCAFFOLDRITE_DIR = path.join(baseDir, SCAFFOLDRITE_DIR_TEXT);

export const STRUCTURE_PATH = path.join(
    SCAFFOLDRITE_DIR,
    STRUCTURE_FILE_TEXT
);

export const IGNORE_PATH = path.join(
    SCAFFOLDRITE_DIR,
    IGNORE_FILE_TEXT
);

export function sortTree(node: FolderNode): void {
  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    if (child.type === "folder") sortTree(child);
  }
}



export const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
];

export function loadIgnoreList(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((x) => x.trim())
    .map((x) => x.split("#")[0].trim())
    .filter(Boolean);
}

export function getIgnoreList(): string[] {
  const exists = fs.existsSync(IGNORE_PATH);

  if (process.env.DEBUG) {
    console.log(exists, IGNORE_PATH);
  }

  return exists
    ? loadIgnoreList(IGNORE_PATH)
    : DEFAULT_IGNORES;
}


export function isIgnored(itemName: string, ignoreList: string[]) {
  return ignoreList.includes(itemName);
}

export function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

export function loadConstraints() {
  const content = fs.readFileSync(STRUCTURE_PATH, "utf-8");
  const parsed = parseStructure(content);
  return parsed.rawConstraints;
}

export function getPassedFlags(): string[] {
  return process.argv.filter((arg) => arg.startsWith("--"));
}

/* ===================== HELPERS ===================== */

export function confirmProceed(dir: string): Promise<boolean> {
  if (hasFlag("--yes") || hasFlag("-y")) return Promise.resolve(true);

  if (!fs.existsSync(dir)) return Promise.resolve(true);
  if (fs.readdirSync(dir).length === 0) return Promise.resolve(true);

  console.warn(theme.warning("Output directory is not empty:"), theme.light(dir));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(theme.accent("Proceed and apply changes? (y/N): "), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/* ===================== STRUCTURE IO ===================== */

export function saveStructure(
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

export function loadAST() {
  const content = fs.readFileSync(STRUCTURE_PATH, "utf-8");
  return parseStructure(content);
}

export function printTree(
  node: FolderNode,
  prefix = "",
  isLast = true
) {
  const connector = isLast ? "└── " : "├── ";
  const nextPrefix = prefix + (isLast ? "    " : "│   ");

  node.children.forEach((child, index) => {
    const last = index === node.children.length - 1;

    if (child.type === "folder") {
      console.log(
        `${prefix}${connector}${theme.secondary(child.name)}`
      );
      printTree(child, nextPrefix, last);
    } else {
      console.log(
        `${prefix}${connector}${theme.light(child.name)}`
      );
    }
  });
}

export function printTreeWithIcons(
  node: FolderNode,
  prefix = "",
  isLast = true
) {
  const connector = isLast ? "└── " : "├── ";
  const nextPrefix = prefix + (isLast ? "    " : "│   ");

  node.children.forEach((child, index) => {
    const last = index === node.children.length - 1;

    if (child.type === "folder") {
      console.log(
        `${prefix}${connector}${icons.folder} ${theme.secondary(child.name)}`
      );
      printTreeWithIcons(child, nextPrefix, last);
    } else {
      console.log(
        `${prefix}${connector}${icons.file} ${theme.light(child.name)}`
      );
    }
  });
}


export function renameFSItem(oldPath: string, newPath: string) {
  if (!fs.existsSync(oldPath)) return false;

  const newDir = path.dirname(newPath);
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

  fs.renameSync(oldPath, newPath);
  return true;
}

export function filterTreeByIgnore(
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

export function flattenTree(
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

export function getFlagValuesAfter(flag: string) {
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

export const ALLOWED_FLAGS: Record<string, string[]> = {
  init: ["--force", "--empty", "--from-fs"],
  update: ["--from-fs", "--yes", "-y"],
  merge: ["--from-fs", "--yes", "-y"],
  validate: ["--allow-extra"],
  generate: [
    "--yes",
    "--dry-run",
    "--verbose",
    "--summary",
    "--ignore-tooling",
     "--copy"
  ],
  create: ["--force", "--if-not-exists", "--yes", "--dry-run", "--verbose", "--summary"],
  delete: ["--yes", "--dry-run", "--verbose", "--summary"],
  rename: ["--yes", "--dry-run", "--verbose", "--summary"],
  list: ["--structure", "--sr", "--fs", "--diff", "--with-icon"],
  version: [],
};

export function printUsage(cmd?: string) {
  if (cmd && ALLOWED_FLAGS[cmd]) {
    const argsMap: Record<string, string> = {
      init: "[--empty | --from-fs [dir]] [--force] [--yes | -y]",
      update: "[--from-fs [dir]] [--yes | -y]",
      merge: "[--from-fs [dir]] [--yes | -y]",
      validate: "[--allow-extra] [--allow-extra <path1> <path2> ...]",
      generate: "[dir] [--yes | -y] [--dry-run] [--verbose | --summary] [--ignore-tooling]",
      list: "[[--structure | --sr] | --fs | --diff] [--with-icon]",
      create: "<path> <file|folder> [--force | --if-not-exists] [--yes | -y] [--dry-run] [--verbose | --summary]",
      delete: "<path> [--yes | -y] [--dry-run] [--verbose | --summary]",
      rename: "<path> <newName> [--yes | -y] [--dry-run] [--verbose | --summary]",
      version: "",
    };

    const args = argsMap[cmd] ? ` ${argsMap[cmd]}` : "";

    console.log(
      theme.primary.bold(`Usage for '${cmd}':`) + 
      theme.light(`\n  scaffoldrite ${cmd}${args}`)
    );
  } else if (cmd) {
    console.log(
      theme.error.bold(`Unknown command '${cmd}'. Showing general usage:\n`)
    );
    printUsage();
  } else {
    console.log(theme.primary.bold(`
Usage:
  scaffoldrite init [--empty | --from-fs [dir]] [--force] [--yes | -y]
  scaffoldrite update [--from-fs [dir]] [--yes | -y]
  scaffoldrite merge [--from-fs [dir]] [--yes | -y]
  scaffoldrite validate [--allow-extra] [--allow-extra <path1> <path2> ...]
  scaffoldrite generate [dir] [--yes | -y] [--dry-run] [--verbose | --summary]  [--ignore-tooling]
  scaffoldrite list [[--structure | --sr] | --fs | --diff] [--with-icon]
  scaffoldrite create <path> <file|folder> [--force | --if-not-exists] [--yes | -y] [--dry-run] [--verbose | --summary]
  scaffoldrite delete <path> [--yes | -y] [--dry-run] [--verbose | --summary]
  scaffoldrite rename <path> <newName> [--yes | -y] [--dry-run] [--verbose | --summary]
  scaffoldrite version
  scaffoldrite --help | -h   Show this message
`));
  }
}

export function structureToSRString(root: FolderNode, rawConstraints: string[]): string {
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

  return lines.join("\n");
}



export function runRequirements(ctx: RequirementContext) {
  const { command, arg3, arg4, fromFs, printUsage } = ctx;

  const fail = (cmd: string): never => {
    printUsage(cmd);
    process.exit(1);
  };

  const requirements: Record<string, () => void> = {
    update() {
      if (!fromFs || !arg3) fail("update");
    },

    merge() {
      if (!fromFs || !arg3) fail("merge");
    },

    create() {
      if (!arg3 || !arg4) fail("create");
    },

    delete() {
      if (!arg3) fail("delete");
    },

    rename() {
      if (!arg3 || !arg4) fail("rename");
    },
  };

  requirements[command]?.();
}



export function checkMutuallyExclusiveFlags(ctx: MutuallyExclusiveContext) {
  const { 
    command, summary, verbose, empty, fromFs, 
    ignoreTooling, copyContents, isFS, isStructure, isDiff,
    theme, icons
  } = ctx;

  const fail = (message: string) => {
    console.error(message);
    process.exit(1);
  };

  // 1️⃣ Summary vs Verbose
  if (["generate", "create", "delete", "rename"].includes(command)) {
    if (summary && verbose) {
      fail(
        theme.error.bold(`${icons.error} Mutually exclusive flags: --summary and --verbose cannot be used together.\n`) +
        theme.primary(`Use either:\n`) +
        theme.accent(`  --summary    `) + theme.light(`Show only a summary of operations\n`) +
        theme.accent(`  --verbose    `) + theme.light(`Show all operations including skipped items`)
      );
    }
  }

  // 2️⃣ Init flags
  if (command === "init") {
    if (empty && fromFs) {
      fail(
        theme.error.bold(`${icons.error} Mutually exclusive flags: --empty and --from-fs cannot be used together.\n`) +
        theme.primary(`Use:\n`) +
        theme.accent(`  --empty    `) + theme.light(`Initialize an empty structure\n`) +
        theme.accent(`  --from-fs  `) + theme.light(`Initialize structure from the filesystem`)
      );
    }
  }

  // 3️⃣ Generate flags
  if (command === "generate") {
    if (ignoreTooling && copyContents) {
      fail(
        theme.error.bold(`${icons.error} Mutually exclusive flags: --ignore-tooling and --copy cannot be used together.\n`) +
        theme.primary(`Use either:\n`) +
        theme.accent(`  --ignore-tooling    `) + theme.light(`Don't copy .scaffoldrite config to output\n`) +
        theme.accent(`  --copy              `) + theme.light(`Copy file contents from source to output`)
      );
    }
  }

  // 4️⃣ List modes
  const listModes = [isFS, isStructure, isDiff].filter(Boolean);
  if (command === "list" && listModes.length > 1) {
    fail(
      theme.error.bold(`${icons.error} Mutually exclusive flags for 'list':\n`) +
      theme.accent(`  --fs\n`) +
      theme.accent(`  --structure | --sr\n`) +
      theme.accent(`  --diff\n`) +
      theme.muted(`\nUse only one at a time.`)
    );
  }
}


export function exit(code: number = 0) {
  process.exit(code);
}