import fs from "fs";
import path from "path";
import { FolderNode } from "./ast";
import { isIgnored } from "./utils";

export function validateFS(
  root: FolderNode,
  dir: string,
  options: {
    ignoreList?: string[];
    allowExtra?: boolean;
    allowExtraPaths?: string[];
    currentPath?: string;
  } = {}
) {
  const {
    ignoreList = [],
    allowExtra = false,
    allowExtraPaths = [],
    currentPath = "",
  } = options;

  if (!fs.existsSync(dir)) {
    throw new Error(
      `Folder does not exist: ${dir}\n` +
      `Expected folder according to structure.sr at: ${currentPath || "root"}`
    );
  }

  const actualItems = fs.readdirSync(dir);

  // Check missing items in filesystem
  for (const child of root.children) {
    if (isIgnored(child.name, ignoreList)) continue;

    const expectedPath = path.join(dir, child.name);
    const expectedSrPath = path.join(currentPath, child.name);

    if (!fs.existsSync(expectedPath)) {
      const allowedExplicitly = allowExtraPaths.some((p) => {
        const normalized = path.normalize(p);
        return (
          expectedSrPath === normalized ||
          expectedSrPath.endsWith(normalized)
        );
      });

      if (allowExtra || allowedExplicitly) continue;

      throw new Error(
        `Missing in filesystem: ${expectedPath}\n` +
        `Expected according to structure.sr at: ${expectedSrPath}`
      );
    }

    if (child.type === "folder") {
      if (!fs.statSync(expectedPath).isDirectory()) {
        throw new Error(
          `Expected folder but found file: ${expectedPath}\n` +
          `structure.sr expects a folder at: ${expectedSrPath}`
        );
      }

      validateFS(child, expectedPath, {
        ignoreList,
        allowExtra,
        allowExtraPaths,
        currentPath: expectedSrPath,
      });
    } else {
      if (!fs.statSync(expectedPath).isFile()) {
        throw new Error(
          `Expected file but found folder: ${expectedPath}\n` +
          `structure.sr expects a file at: ${expectedSrPath}`
        );
      }
    }
  }

  // Check extra items in filesystem not in .sr
  for (const item of actualItems) {
    if (isIgnored(item, ignoreList)) continue;

    const existsInSr = root.children.some((c) => c.name === item);
    if (!existsInSr) {
      const extraPath = path.join(dir, item);

      const allowedExplicitly = allowExtraPaths.some((p) => {
        const normalized = path.normalize(p);
        const extraRel = path.relative(dir, extraPath);
        const extraBasename = path.basename(extraPath);

        return (
          extraBasename === normalized ||
          extraRel === normalized ||
          extraRel.endsWith(normalized)
        );
      });

      if (allowExtra || allowedExplicitly) continue;

      throw new Error(
        `Extra file/folder found in filesystem: ${extraPath}\n` +
        `Not defined in structure.sr at: ${currentPath || "root"}`
      );
    }
  }
}
