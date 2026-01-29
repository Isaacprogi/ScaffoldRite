const ignoreFilePath = "./.scaffoldignore";
import { FolderNode } from "../ast";
import fs from "fs";
import path from "path";
import { parseStructure } from "../parser";
import readline from "readline";
import { STRUCTURE_PATH } from "../cli";


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

const SCAFFOLDRITE_DIR = ".scaffoldrite";
export const IGNORE_FILE = ".scaffoldignore";
export const STRUCTURE_FILE = "structure.sr";


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

export function getIgnoreList(baseDir: string): string[] {
  const ignoreFilePath = path.join(
    baseDir,
    SCAFFOLDRITE_DIR,
    IGNORE_FILE
  );
  console.log(ignoreFilePath, 'jajajajja')

  return fs.existsSync(ignoreFilePath)
    ? loadIgnoreList(ignoreFilePath)
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


export function printTree(root: FolderNode, indent = "") {
  for (const child of root.children) {
    if (child.type === "folder") {
      console.log(`${indent} ${child.name}`);
      printTree(child, indent + "  ");
    } else {
      console.log(`${indent} ${child.name}`);
    }
  }
}


export function printTreeWithIcons(node: FolderNode, indent = "") {
  for (const child of node.children) {
    if (child.type === "folder") {
      console.log(`${indent}📁 ${child.name}`);
      printTreeWithIcons(child, indent + "  ");
    } else {
      console.log(`${indent}📄 ${child.name}`);
    }
  }
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
  ],
  create: ["--force", "--if-not-exists", "--yes", "--dry-run", "--verbose", "--summary"],
  delete: ["--yes", "--dry-run", "--verbose", "--summary"],
  rename: ["--yes", "--dry-run", "--verbose", "--summary"],
  list: ["--structure", "--sr", "--fs", "--diff", "--with-icon"],
  version: [],
};

export function printUsage(cmd?: string) {
  if (cmd && ALLOWED_FLAGS[cmd]) {
    const flags = ALLOWED_FLAGS[cmd].length
      ? `[${ALLOWED_FLAGS[cmd].join("] [")}]`
      : "";

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

    console.log(`Usage for '${cmd}':\n  scaffoldrite ${cmd}${args} ${flags}`);
  } else if (cmd) {
    console.log(`Unknown command '${cmd}'. Showing general usage:\n`);
    printUsage();
  } else {
    console.log(`
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
`);
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
