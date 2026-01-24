import fs from "fs";
import path from "path";
import { visit } from "./visitor.js";
import { FolderNode } from "./ast.js";

export function generateFS(ast: FolderNode, outputDir: string) {
  const root = path.resolve(outputDir);
  const expected = new Set<string>();

  function ensureFolder(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  function ensureFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
    }
  }

  ensureFolder(root);
  expected.add(root);

  visit(ast, {
    folder: (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      expected.add(fullPath);
      ensureFolder(fullPath);
    },
    file: (_, nodePath) => {
      const fullPath = path.join(root, nodePath);
      expected.add(fullPath);
      ensureFile(fullPath);
    },
  });

  // 2️⃣ Remove extras (never root)
  function clean(dir: string) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);

      if (!expected.has(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        continue;
      }

      if (fs.statSync(fullPath).isDirectory()) {
        clean(fullPath);
      }
    }
  }

  clean(root);
}
