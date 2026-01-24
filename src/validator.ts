import { Node, FolderNode, FileNode } from "./ast";
import { Constraint } from "./constraints";

function normalizePath(path?: string) {
  if (!path || path.trim() === "") return "__root__";
  return path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function findNodeByPath(root: FolderNode, path?: string): Node | null {
  const normalizedPath = normalizePath(path);

  const parts = normalizedPath.split("/").filter(Boolean);

  let current: Node = root;

  if (parts[0] === root.name) {
    parts.shift();
  }

  for (const part of parts) {
    if (current.type !== "folder") return null;

    const next: Node | undefined = current.children.find(
      (c) => c.name === part
    );
    if (!next) return null;

    current = next;
  }

  return current;
}

function countFiles(folder: FolderNode) {
  return folder.children.filter((c) => c.type === "file").length;
}

function countFolders(folder: FolderNode) {
  return folder.children.filter((c) => c.type === "folder").length;
}


function countFilesRecursive(folder: FolderNode, ext?: string) {
  let count = 0;
  for (const child of folder.children) {
    if (child.type === "file") {
      if (!ext || child.name.endsWith(ext)) count++;
    }
    if (child.type === "folder") count += countFilesRecursive(child, ext);
  }
  return count;
}

function countFoldersRecursive(folder: FolderNode) {
  let count = 0;
  for (const child of folder.children) {
    if (child.type === "folder") count++;
    if (child.type === "folder") count += countFoldersRecursive(child);
  }
  return count;
}

function maxDepth(folder: FolderNode, current = 0): number {
  let depth = current;
  for (const child of folder.children) {
    if (child.type === "folder") {
      depth = Math.max(depth, maxDepth(child, current + 1));
    }
  }
  return depth;
}



function getFoldersByScope(root: FolderNode, path: string, scope: "*" | "**") {
  const folder = findNodeByPath(root, path);
  if (!folder || folder.type !== "folder") return [];

  const folders: FolderNode[] = [];

  if (scope === "*") {
    // only direct child folders
    for (const child of folder.children) {
      if (child.type === "folder") folders.push(child);
    }
  }

  if (scope === "**") {
    // recursively collect all folders
    function traverse(f: FolderNode) {
      for (const child of f.children) {
        if (child.type === "folder") {
          folders.push(child);
          traverse(child);
        }
      }
    }
    traverse(folder);
  }

  return folders;
}

export function validateConstraints(root: FolderNode, constraints: Constraint[]) {
  for (const c of constraints) {

    if (
      (c.type !== "eachFolderMustContain" &&
       c.type !== "eachFolderMustContainFile" &&
       c.type !== "eachFolderMustContainFolder" &&
       c.type !== "eachFolderMustHaveExt") &&
      (!c.path || c.path.trim() === "")
    ) {
      throw new Error(`Constraint failed: path missing for ${c.type}`);
    }

    if (c.type === "require") {
      const node = findNodeByPath(root, c.path);
      if (!node)
        throw new Error(`Constraint failed: required path not found: ${c.path}`);
    }

    if (c.type === "forbid") {
      const node = findNodeByPath(root, c.path);
      if (node)
        throw new Error(`Constraint failed: forbidden path exists: ${c.path}`);
    }

    if (c.type === "maxFiles") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFiles(folder);
      if (fileCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} files`
        );
    }

    if (c.type === "maxFilesRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFilesRecursive(folder);
      if (fileCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} files recursively`
        );
    }

    if (c.type === "maxFilesByExt") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = folder.children
        .filter((x) => x.type === "file")
        .filter((f: FileNode) => f.name.endsWith(c.ext)).length;

      if (fileCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} files of ${c.ext}`
        );
    }

    if (c.type === "maxFilesByExtRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const extCount = countFilesRecursive(folder, c.ext);
      if (extCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} files of ${c.ext} recursively`
        );
    }

    if (c.type === "maxFolders") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFolders(folder);
      if (folderCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} folders`
        );
    }

    if (c.type === "maxFoldersRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFoldersRecursive(folder);
      if (folderCount > c.value)
        throw new Error(
          `Constraint failed: ${c.path} has more than ${c.value} folders recursively`
        );
    }

    if (c.type === "minFiles") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFiles(folder);
      if (fileCount < c.value)
        throw new Error(
          `Constraint failed: ${c.path} has less than ${c.value} files`
        );
    }

    if (c.type === "minFolders") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFolders(folder);
      if (folderCount < c.value)
        throw new Error(
          `Constraint failed: ${c.path} has less than ${c.value} folders`
        );
    }

    if (c.type === "mustContain") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const exists = folder.children.some((x) => x.name === c.value);
      if (!exists)
        throw new Error(
          `Constraint failed: ${c.path} must contain ${c.value}`
        );
    }

    if (c.type === "fileNameRegex") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const regex = new RegExp(c.regex);
      for (const child of folder.children) {
        if (child.type === "file" && !regex.test(child.name)) {
          throw new Error(
            `Constraint failed: ${child.name} in ${c.path} does not match regex`
          );
        }
      }
    }

    if (c.type === "maxDepth") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const depth = maxDepth(folder);
      if (depth > c.value)
        throw new Error(
          `Constraint failed: ${c.path} exceeds max depth of ${c.value}`
        );
    }

    if (c.type === "mustHaveFile") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const exists = folder.children.some(
        (x) => x.type === "file" && x.name === c.value
      );
      if (!exists)
        throw new Error(
          `Constraint failed: ${c.path} must have file ${c.value}`
        );
    }

    if (c.type === "eachFolderMustContain") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some((x) => x.name === c.value);
        if (!exists) {
          throw new Error(
            `Constraint failed: ${folder.name} must contain ${c.value}`
          );
        }
      }
    }

    if (c.type === "eachFolderMustContainFile") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some(
          (x) => x.type === "file" && x.name === c.value
        );
        if (!exists) {
          throw new Error(
            `Constraint failed: ${folder.name} must contain file ${c.value}`
          );
        }
      }
    }

    if (c.type === "eachFolderMustContainFolder") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some(
          (x) => x.type === "folder" && x.name === c.value
        );
        if (!exists) {
          throw new Error(
            `Constraint failed: ${folder.name} must contain folder ${c.value}`
          );
        }
      }
    }

    if (c.type === "eachFolderMustHaveExt") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some(
          (x) => x.type === "file" && x.name.endsWith(c.ext)
        );
        if (!exists) {
          throw new Error(
            `Constraint failed: ${folder.name} must contain a file with extension ${c.ext}`
          );
        }
      }
    }
  }
}
