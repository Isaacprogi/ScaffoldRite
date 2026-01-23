import fs from "fs";
import path from "path";
import { FolderNode, FileNode } from "./ast.js";

export const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
];

export function buildASTFromFS(
  dir: string,
  ignoreList: string[] = []
): FolderNode {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }

  const root: FolderNode = {
    type: "folder",
    name: path.basename(dir),
    children: [],
  };

  function scan(folderPath: string, node: FolderNode) {
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
      if (ignoreList.includes(item)) continue;

      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const childFolder: FolderNode = {
          type: "folder",
          name: item,
          children: [],
        };
        node.children.push(childFolder);
        scan(itemPath, childFolder);
      } else {
        const childFile: FileNode = {
          type: "file",
          name: item,
        };
        node.children.push(childFile);
      }
    }
  }

  scan(dir, root);
  return root;
}
