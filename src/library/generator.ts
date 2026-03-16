import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { visit } from "./visitor";
import { FolderNode } from "./ast";

export type ProgressEvent = {
  type: "folder" | "file" | "copy" | "delete" | "skip";
  path: string;
  count: number;
};

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
    force?: boolean;
    onStart?: (total: number) => void;
    ref?: string;
  },
): Promise<string[]> {
  const root = path.resolve(outputDir);
  const sourceRoot = process.cwd();
  const ref = options?.ref;
  const ignoreList = options?.ignoreList ?? [];
  const copyContents = options?.copyContents ?? false;
  const force = options?.force ?? false;
  const failures: string[] = [];

  const isScaffoldriteInternal = (p: string) => {
    const rel = path.relative(root, p);
    return rel === ".scaffoldrite" || rel.startsWith(".scaffoldrite" + path.sep);
  };

  const isIgnored = (p: string) => {
    const name = path.basename(p);
    return ignoreList.includes(name);
  };

  const isIgnoredOrInternal = (p: string) => isIgnored(p) || isScaffoldriteInternal(p);

  const expected = new Map<string, { type: "folder" | "file"; sourcePath?: string }>();
  const actual = new Set<string>();
  const ops: ProgressEvent[] = [];

  expected.set(root, { type: "folder" });

  await visit(ast, {
    folder: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnoredOrInternal(fullPath)) expected.set(fullPath, { type: "folder" });
    },
    file: async (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      if (!isIgnoredOrInternal(fullPath)) {
        const sourcePath = path.join(sourceRoot, nodePath);
        expected.set(fullPath, { type: "file", sourcePath });
      }
    },
  });

  async function scan(dir: string) {
    if (isIgnoredOrInternal(dir)) return;
    actual.add(dir);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (isIgnoredOrInternal(full)) continue;
        actual.add(full);
        if (e.isDirectory()) await scan(full);
      }
    } catch {}
  }

  try { await scan(root); } catch {}

  for (const [p, info] of expected.entries()) {
    if (actual.has(p) && !force) {
      ops.push({ type: "skip", path: p, count: 0 });
    } else {
      let operationType: "folder" | "file" | "copy" = info.type;
      if (info.type === "file" && copyContents) {
        if (ref) {
          operationType = "copy";
        } else if (info.sourcePath && (await fileExists(info.sourcePath))) {
          operationType = "copy";
        }
      }
      ops.push({ type: operationType, path: p, count: 0 });
    }
  }

  const extras = [...actual]
    .filter((p) => !expected.has(p))
    .filter((p) => !p.startsWith(path.join(root, ".scaffoldrite/history")))
    .sort((a, b) => b.length - a.length);

  for (const p of extras) {
    ops.push({ type: "delete", path: p, count: 0 });
  }

  options?.onStart?.(ops.length);

  let count = 0;
  for (const op of ops) {
    count++;

    if (!options?.dryRun) {
      if (op.type === "folder") {
        await fs.mkdir(op.path, { recursive: true });
      } else if (op.type === "file") {
        await fs.mkdir(path.dirname(op.path), { recursive: true });
        await fs.writeFile(op.path, ""); // force overwrites automatically
      } else if (op.type === "copy") {
        await fs.mkdir(path.dirname(op.path), { recursive: true });

        try {
          if (ref) {
            const relativePath = path.relative(root, op.path).split(path.sep).join("/");
            const content = execSync(`git show ${ref}:${relativePath}`, {
              maxBuffer: 10 * 1024 * 1024,
              stdio: ["pipe", "pipe", "ignore"],
            });
            await fs.writeFile(op.path, content);
          } else if (expected.get(op.path)?.sourcePath) {
            await fs.copyFile(expected.get(op.path)!.sourcePath!, op.path);
          }
        } catch {
          failures.push(path.relative(root, op.path));
          await fs.writeFile(op.path, "");
        }
      } else if (op.type === "delete") {
        if (!op.path.startsWith(path.join(root, ".scaffoldrite/history"))) {
          await fs.rm(op.path, { recursive: true, force: true });
        }
      }
    }

    options?.onProgress?.({ ...op, count });
  }

  return failures;
}