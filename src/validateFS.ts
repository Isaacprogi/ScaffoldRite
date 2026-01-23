import fs from "fs";
import path from "path";
import { FolderNode } from "./ast";

export function validateFS(
  root: FolderNode,
  dir: string,
  allowExtra = false,
  allowExtraPaths: string[] = []
) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Folder does not exist: ${dir}`);
  }

  const actualItems = fs.readdirSync(dir);

  // Check missing items in filesystem
  for (const child of root.children) {
    const expectedPath = path.join(dir, child.name);
    if (!fs.existsSync(expectedPath)) {
      throw new Error(`Missing in filesystem: ${expectedPath}`);
    }

    if (child.type === "folder") {
      if (!fs.statSync(expectedPath).isDirectory()) {
        throw new Error(`Expected folder but found file: ${expectedPath}`);
      }

      const subAllowExtra = allowExtraPaths.some((p) =>
        expectedPath.endsWith(p)
      );

      validateFS(child, expectedPath, allowExtra || subAllowExtra, allowExtraPaths);
    } else {
      if (!fs.statSync(expectedPath).isFile()) {
        throw new Error(`Expected file but found folder: ${expectedPath}`);
      }
    }
  }

  if (!allowExtra) {
    // Check extra items in filesystem not in .sr
    for (const item of actualItems) {
      const existsInSr = root.children.some((c) => c.name === item);
      if (!existsInSr) {
        throw new Error(
          `Extra file/folder found in filesystem: ${path.join(dir, item)}`
        );
      }
    }
  }
}