import fs from "fs";
import path from "path";
import { FolderNode, FileNode } from "../ast";
import { visit } from "../visitor";

export type DependencyGraph = Record<string, string[]>;

const EXTENSIONS = [
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".mts",
  ".cts",
  ".jsx",
  ".tsx"
];

// ------------------- FS MODE -------------------
export function buildDependencyGraph(
  baseDir: string,
  ignore: string[] = []
): DependencyGraph {
  const files = scanFiles(baseDir, ignore, baseDir);
  return buildGraphFromFiles(baseDir, files);
}

// ------------------- SR MODE -------------------
export async function buildGraphFromStructure(
  baseDir: string,
  root: FolderNode
): Promise<DependencyGraph> {
  const files: string[] = [];

  // Collect all files from the structure AST
  await visit(root, {
    file(node: FileNode, nodePath: string) {
      if (EXTENSIONS.some((ext) => node.name.endsWith(ext))) {
        files.push(nodePath);
      }
    },
  });

  return buildGraphFromFiles(baseDir, files);
}

// ------------------- CORE GRAPH BUILDER -------------------
function buildGraphFromFiles(
  baseDir: string,
  files: string[]
): DependencyGraph {
  const graph: DependencyGraph = {};
  const fileSet = new Set(files);

  for (const file of files) {
    const fullPath = path.join(baseDir, file);

    // Skip if file doesn't exist on disk
    if (!fs.existsSync(fullPath)) continue;

    const code = fs.readFileSync(fullPath, "utf8");
    const imports = extractImports(code);

    const resolvedImports = imports
      .map((i) => resolveImport(baseDir, file, i))
      .filter((p): p is string => p !== null)
      .filter((p) => fileSet.has(p));

    graph[file] = [...new Set(resolvedImports)];
  }

  return graph;
}

// ------------------- UTILS -------------------
function extractImports(code: string): string[] {
  const regex =
    /\b(?:import|export)\s+(?:[^'"]*\s+from\s+)?['"](.+?)['"]|\brequire\(['"](.+?)['"]\)|\bimport\(['"](.+?)['"]\)/g;

  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const val = match[1] || match[2] || match[3];
    if (val) imports.push(val);
  }

  return imports;
}

function resolveImport(
  baseDir: string,
  file: string,
  importPath: string
): string | null {
  if (!importPath.startsWith(".")) return null;

  const fullPath = path.resolve(path.join(baseDir, path.dirname(file)), importPath);

  for (const ext of EXTENSIONS) {
    const candidate = fullPath + ext;
    if (fs.existsSync(candidate)) return path.relative(baseDir, candidate);
  }

  for (const ext of EXTENSIONS) {
    const candidate = path.join(fullPath, "index" + ext);
    if (fs.existsSync(candidate)) return path.relative(baseDir, candidate);
  }

  if (fs.existsSync(fullPath)) return path.relative(baseDir, fullPath);

  return null;
}

function scanFiles(
  dir: string,
  ignore: string[],
  baseDir: string
): string[] {
  let results: string[] = [];

  for (const file of fs.readdirSync(dir)) {
    if (ignore.includes(file)) continue;

    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(scanFiles(full, ignore, baseDir));
    } else if (EXTENSIONS.includes(path.extname(full))) {
      results.push(path.relative(baseDir, full));
    }
  }

  return results;
}

// ------------------- PRINT / CIRCULAR -------------------
export function printDependencyTree(graph: DependencyGraph) {
  function print(file: string, prefix = "", isLast = true, stack: Set<string> = new Set()) {
    const connector = isLast ? "└── " : "├── ";
    console.log(prefix + connector + file);

    if (stack.has(file)) {
      console.log(prefix + "    (circular)");
      return;
    }

    const deps = graph[file] || [];
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    const newStack = new Set(stack).add(file);

    deps.forEach((dep, index) => print(dep, nextPrefix, index === deps.length - 1, newStack));
  }

  const roots = findStandaloneFiles(graph);
  roots.forEach((root, index) => print(root, "", index === roots.length - 1));
}

export function findStandaloneFiles(graph: DependencyGraph): string[] {
  const allFiles = new Set(Object.keys(graph));
  const imported = new Set<string>();
  Object.values(graph).forEach((deps) => deps.forEach((d) => imported.add(d)));
  return [...allFiles].filter((f) => !imported.has(f));
}

export function detectCircular(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[] = []) {
    if (stack.has(node)) {
      cycles.push([...path, node]);
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    const deps = graph[node] || [];
    deps.forEach((d) => dfs(d, [...path, node]));
    stack.delete(node);
  }

  Object.keys(graph).forEach((f) => dfs(f));
  return cycles;
}

export function printCircular(graph: DependencyGraph) {
  const cycles = detectCircular(graph);

  if (!cycles.length) {
    console.log("\nNo circular dependencies found\n");
    return;
  }

  cycles.forEach((cycle) => console.log("• " + cycle.join(" → ")));
  console.log();
}