import fs from "fs/promises";
import path from "path";
import { visit } from "./visitor.js";
import { FolderNode } from "./ast.js";

export type ProgressEvent = {
  type: "folder" | "file" | "copy" | "delete" | "skip";
  path: string;
  count: number;
};

// Helper function to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateFS(
  ast: FolderNode,
  outputDir: string,
  options?: {
    dryRun?: boolean;
    copyContents?: boolean;
    ignoreList?: string[];
    onProgress?: (e: ProgressEvent) => void;
    onStart?: (total: number) => void;
  },
) {
  const root = path.resolve(outputDir);
  const sourceRoot = process.cwd(); // Get source directory for copying

  const ignoreList = options?.ignoreList ?? [];
  const copyContents = options?.copyContents ?? false;

  // ✅ store type info
  const expected = new Map<string, { type: "folder" | "file"; sourcePath?: string }>();
  const actual = new Set<string>();
  const ops: ProgressEvent[] = [];

  /* Helper: check if path is ignored */
  const isIgnored = (p: string) => {
    const name = path.basename(p);
    return ignoreList.includes(name);
  };

  /* 1️⃣ EXPECTED */
  expected.set(root, { type: "folder" });

  // Track source paths for files when copyContents is enabled
  const fileSourcePaths = new Map<string, string>();
  
  await visit(ast, {
    folder: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnored(fullPath)) {
        expected.set(fullPath, { type: "folder" });
      }
    },
    file: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnored(fullPath)) {
        // Store source path for potential copying
        const sourcePath = path.join(sourceRoot, nodePath);
        expected.set(fullPath, { 
          type: "file",
          sourcePath: sourcePath 
        });
        fileSourcePaths.set(fullPath, sourcePath);
      }
    },
  });

  /* 2️⃣ ACTUAL */
  async function scan(dir: string) {
    if (isIgnored(dir)) return;

    actual.add(dir);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (isIgnored(full)) continue;

      actual.add(full);
      if (e.isDirectory()) await scan(full);
    }
  }

  try {
    await scan(root);
  } catch { }

  /* 3️⃣ PLAN ops (NO FS MUTATION) */
  for (const [p, info] of expected.entries()) {
    if (actual.has(p)) {
      ops.push({ type: "skip", path: p, count: 0 });
    } else {
      // Determine operation type
      let operationType: "folder" | "file" | "copy" = info.type;
      
      // Check if we should copy contents for this file
      if (info.type === "file" && copyContents && info.sourcePath) {
        const sourceExists = await fileExists(info.sourcePath);
        if (sourceExists) {
          operationType = "copy";
        }
      }
      
      ops.push({
        type: operationType,
        path: p,
        count: 0,
      });
    }
  }

  const extras = [...actual]
    .filter((p) => !expected.has(p))
    .filter((p) => !p.startsWith(path.join(root, ".scaffoldrite/history")))
    .sort((a, b) => b.length - a.length);

  for (const p of extras) {
    ops.push({ type: "delete", path: p, count: 0 });
  }

  /* 4️⃣ START */
  options?.onStart?.(ops.length);

  /* 5️⃣ APPLY */
  let count = 0;
  for (const op of ops) {
    count++;

    if (!options?.dryRun) {
      if (op.type === "folder") {
        await fs.mkdir(op.path, { recursive: true });
      } else if (op.type === "file") {
        await fs.mkdir(path.dirname(op.path), { recursive: true });
        await fs.writeFile(op.path, "");
      } else if (op.type === "copy") {
        // Get source path from expected map
        const info = expected.get(op.path);
        if (info?.sourcePath) {
          try {
            await fs.mkdir(path.dirname(op.path), { recursive: true });
            await fs.copyFile(info.sourcePath, op.path);
          } catch (error) {
            // If copy fails, fall back to empty file
            console.warn(`Warning: Could not copy ${info.sourcePath} to ${op.path}, creating empty file instead`);
            await fs.writeFile(op.path, "");
          }
        } else {
          // Fallback to empty file if no source path
          await fs.mkdir(path.dirname(op.path), { recursive: true });
          await fs.writeFile(op.path, "");
        }
      } else if (op.type === "delete") {
        // KEEP THE ORIGINAL DELETE LOGIC
        if (op.path.startsWith(path.join(root, ".scaffoldrite/history"))) continue;
        await fs.rm(op.path, { recursive: true, force: true });
      }
    }

    options?.onProgress?.({
      ...op,
      count,
    });
  }
}