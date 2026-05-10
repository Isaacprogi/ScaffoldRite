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
  ".tsx",
];

// ------------------- PATH NORMALIZATION -------------------
function normalizeFilePath(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^__root__\/?/, "");
}

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

  // collect files from structure.sr AST
  await visit(root, {
    file(node: FileNode, nodePath: string) {
      if (!EXTENSIONS.some((ext) => node.name.endsWith(ext))) {
        return;
      }

      const normalized = normalizeFilePath(nodePath);
      files.push(normalized);
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

  // normalize all file paths
  const normalizedFiles = files.map(normalizeFilePath);
  const fileSet = new Set(normalizedFiles);

  for (const originalFile of normalizedFiles) {
    const fullPath = path.join(baseDir, originalFile);

    // initialize even if file missing
    graph[originalFile] = [];

    // skip missing files
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const code = fs.readFileSync(fullPath, "utf8");
    const imports = extractImports(code);

    const resolvedImports = imports
      .map((i) => resolveImport(baseDir, originalFile, i))
      .filter((p): p is string => p !== null)
      .map(normalizeFilePath)
      .filter((p) => fileSet.has(p));

    graph[originalFile] = [...new Set(resolvedImports)];
  }

  return graph;
}

// ------------------- IMPORT EXTRACTION -------------------
function extractImports(code: string): string[] {
  const regex =
    /\b(?:import|export)\s+(?:[^'"]*\s+from\s+)?['"](.+?)['"]|\brequire\(['"](.+?)['"]\)|\bimport\(['"](.+?)['"]\)/g;

  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    const value = match[1] || match[2] || match[3];

    if (value) {
      imports.push(value);
    }
  }

  return imports;
}

// ------------------- IMPORT RESOLUTION -------------------
function resolveImport(
  baseDir: string,
  file: string,
  importPath: string
): string | null {
  // ignore package imports
  if (!importPath.startsWith(".")) {
    return null;
  }

  const fullPath = path.resolve(
    path.join(baseDir, path.dirname(file)),
    importPath
  );

  // file.ext
  for (const ext of EXTENSIONS) {
    const candidate = fullPath + ext;

    if (fs.existsSync(candidate)) {
      return normalizeFilePath(path.relative(baseDir, candidate));
    }
  }

  // folder/index.ext
  for (const ext of EXTENSIONS) {
    const candidate = path.join(fullPath, "index" + ext);

    if (fs.existsSync(candidate)) {
      return normalizeFilePath(path.relative(baseDir, candidate));
    }
  }

  // exact path
  if (fs.existsSync(fullPath)) {
    return normalizeFilePath(path.relative(baseDir, fullPath));
  }

  return null;
}

// ------------------- FILE SCANNING -------------------
function scanFiles(
  dir: string,
  ignore: string[],
  baseDir: string
): string[] {
  let results: string[] = [];

  for (const file of fs.readdirSync(dir)) {
    if (ignore.includes(file)) {
      continue;
    }

    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(scanFiles(full, ignore, baseDir));
    } else if (EXTENSIONS.includes(path.extname(full))) {
      results.push(normalizeFilePath(path.relative(baseDir, full)));
    }
  }

  return results;
}

// ------------------- PRINT TREE -------------------
export function printDependencyTree(graph: DependencyGraph) {
  function print(
    file: string,
    prefix = "",
    isLast = true,
    stack: Set<string> = new Set()
  ) {
    
    const connector = isLast ? "└── " : "├── ";

    console.log(prefix + connector + file);

    if (stack.has(file)) {
      console.log(prefix + "    (circular)");
      return;
    }

    const deps = graph[file] || [];
    const nextPrefix = prefix + (isLast ? "    " : "│   ");
    const newStack = new Set(stack).add(file);

    deps.forEach((dep, index) => {
      print(dep, nextPrefix, index === deps.length - 1, newStack);
    });
  }

  const roots = findStandaloneFiles(graph);

  roots.forEach((root, index) => {
    print(root, "", index === roots.length - 1);
  });
}

// ------------------- STANDALONE FILES -------------------
export function findStandaloneFiles(
  graph: DependencyGraph
): string[] {
  const imported = new Set<string>();

  Object.values(graph).forEach((deps) => {
    deps.forEach((dep) => imported.add(dep));
  });

  return Object.keys(graph).filter(
    (file) => !imported.has(file)
  );
}

// ------------------- CIRCULAR DETECTION -------------------
export function detectCircular(
  graph: DependencyGraph
): string[][] {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, currentPath: string[] = []) {
    if (stack.has(node)) {
      cycles.push([...currentPath, node]);
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    stack.add(node);

    const deps = graph[node] || [];

    deps.forEach((dep) => {
      dfs(dep, [...currentPath, node]);
    });

    stack.delete(node);
  }

  Object.keys(graph).forEach((file) => {
    dfs(file);
  });

  return cycles;
}

// ------------------- PRINT CIRCULAR -------------------
export function printCircular(graph: DependencyGraph) {
  const cycles = detectCircular(graph);

  if (!cycles.length) {
    console.log("\nNo circular dependencies found\n");
    return;
  }

  console.log("\nCircular Dependencies");

  cycles.forEach((cycle) => {
    console.log("• " + cycle.join(" → "));
  });

  console.log();
}