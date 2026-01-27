import fs from "fs/promises";
import path from "path";
import { visit } from "./visitor.js";
import { FolderNode } from "./ast.js";

export type ProgressEvent = {
  type: "folder" | "file" | "delete" | "skip";
  path: string;
  count: number;
};

export async function generateFS(
  ast: FolderNode,
  outputDir: string,
  options?: {
    dryRun?: boolean;
    ignoreList?: string[];
    onProgress?: (e: ProgressEvent) => void;
    onStart?: (total: number) => void;
  }
) {
  const root = path.resolve(outputDir);

  const ignoreList = options?.ignoreList ?? [];

  // ✅ store type info
  const expected = new Map<string, "folder" | "file">();
  const actual = new Set<string>();
  const ops: ProgressEvent[] = [];

  /* Helper: check if path is ignored */
  const isIgnored = (p: string) => {
    const name = path.basename(p);
    return ignoreList.includes(name);
  };

  /* 1️⃣ EXPECTED */
  expected.set(root, "folder");

  await visit(ast, {
    folder: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnored(fullPath)) expected.set(fullPath, "folder");
    },
    file: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnored(fullPath)) expected.set(fullPath, "file");
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
  } catch {}

  /* 3️⃣ PLAN ops (NO FS MUTATION) */
  for (const [p, type] of expected.entries()) {
    if (actual.has(p)) {
      ops.push({ type: "skip", path: p, count: 0 });
    } else {
      ops.push({
        type,
        path: p,
        count: 0,
      });
    }
  }

  const extras = [...actual]
    .filter((p) => !expected.has(p))
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
      } else if (op.type === "delete") {
        await fs.rm(op.path, { recursive: true, force: true });
      }
    }

    options?.onProgress?.({
      ...op,
      count,
    });
  }
}
