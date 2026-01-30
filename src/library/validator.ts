import { Node, FolderNode, FileNode } from "./ast";
import { Constraint } from "./constraints";
import { theme, icons } from "../data/index.js"; // Import your theme

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
    for (const child of folder.children) {
      if (child.type === "folder") folders.push(child);
    }
  }

  if (scope === "**") {
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

function formatConstraintError(message: string, hint?: string) {
  return `${icons.error} ${theme.error('Constraint failed:')}\n` +
         `  ${theme.warning('✗')} ${theme.muted(message)}` +
         (hint ? `\n  ${theme.info('Hint:')} ${theme.light(hint)}` : "");
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
      throw new Error(formatConstraintError(
        `Path missing for constraint type ${theme.highlight(c.type)}`,
        `Add a valid path like: ${theme.primary('constraints { ' + c.type + ' src/index.ts }')}`
      ));
    }

    if (c.type === "require") {
      const node = findNodeByPath(root, c.path);
      if (!node) {
        throw new Error(formatConstraintError(
          `Required path not found: ${theme.highlight(c.path)}`,
          `Add this path to your ${theme.secondary('structure.sr')} or remove this constraint`
        ));
      }
    }

    if (c.type === "forbid") {
      const node = findNodeByPath(root, c.path);
      if (node) {
        throw new Error(formatConstraintError(
          `Forbidden path exists: ${theme.highlight(c.path)}`,
          `Remove this path from your ${theme.secondary('structure.sr')} or delete this constraint`
        ));
      }
    }

    if (c.type === "maxFiles") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFiles(folder);
      if (fileCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(fileCount)} files ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra files or increase ${theme.primary('maxFiles')}`
        ));
    }

    if (c.type === "maxFilesRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFilesRecursive(folder);
      if (fileCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(fileCount)} files recursively ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra files or increase ${theme.primary('maxFilesRecursive')}`
        ));
    }

    if (c.type === "maxFilesByExt") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = folder.children
        .filter((x) => x.type === "file")
        .filter((f: FileNode) => f.name.endsWith(c.ext)).length;

      if (fileCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(fileCount)} files with extension ${theme.secondary('"' + c.ext + '"')} ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra ${theme.secondary(c.ext)} files or increase ${theme.primary('maxFilesByExt')}`
        ));
    }

    if (c.type === "maxFilesByExtRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const extCount = countFilesRecursive(folder, c.ext);
      if (extCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(extCount)} files with extension ${theme.secondary('"' + c.ext + '"')} recursively ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra ${theme.secondary(c.ext)} files or increase ${theme.primary('maxFilesByExtRecursive')}`
        ));
    }

    if (c.type === "maxFolders") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFolders(folder);
      if (folderCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(folderCount)} folders ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra folders or increase ${theme.primary('maxFolders')}`
        ));
    }

    if (c.type === "maxFoldersRecursive") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFoldersRecursive(folder);
      if (folderCount > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(folderCount)} folders recursively ${theme.muted('(max allowed ' + c.value + ')')}`,
          `Remove extra folders or increase ${theme.primary('maxFoldersRecursive')}`
        ));
    }

    if (c.type === "minFiles") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = countFiles(folder);
      if (fileCount < c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(fileCount)} files ${theme.muted('(min required ' + c.value + ')')}`,
          `Add more files to this folder`
        ));
    }

    if (c.type === "minFolders") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const folderCount = countFolders(folder);
      if (folderCount < c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} has ${theme.warning(folderCount)} folders ${theme.muted('(min required ' + c.value + ')')}`,
          `Add more folders to this path`
        ));
    }

    if (c.type === "mustContain") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const exists = folder.children.some((x) => x.name === c.value);
      if (!exists)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} must contain ${theme.secondary('"' + c.value + '"')}`,
          `Add ${theme.secondary(c.value)} inside ${theme.primary(c.path)}`
        ));
    }

    if (c.type === "fileNameRegex") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const regex = new RegExp(c.regex);
      for (const child of folder.children) {
        if (child.type === "file" && !regex.test(child.name)) {
          throw new Error(formatConstraintError(
            `${theme.highlight(child.name)} in ${theme.primary(c.path)} does not match regex ${theme.secondary('"' + c.regex + '"')}`,
            `Rename the file or update the regex constraint`
          ));
        }
      }
    }

    if (c.type === "maxDepth") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const depth = maxDepth(folder);
      if (depth > c.value)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} exceeds max depth of ${theme.secondary(c.value)} ${theme.muted('(current depth ' + depth + ')')}`,
          `Remove nested folders or increase ${theme.primary('maxDepth')}`
        ));
    }

    if (c.type === "mustHaveFile") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const exists = folder.children.some(
        (x) => x.type === "file" && x.name === c.value
      );
      if (!exists)
        throw new Error(formatConstraintError(
          `${theme.highlight(c.path)} must have file ${theme.secondary('"' + c.value + '"')}`,
          `Add ${theme.secondary(c.value)} inside ${theme.primary(c.path)}`
        ));
    }

    if (c.type === "eachFolderMustContain") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some((x) => x.name === c.value);
        if (!exists) {
          throw new Error(formatConstraintError(
            `${theme.highlight(folder.name)} must contain ${theme.secondary('"' + c.value + '"')}`,
            `Add ${theme.secondary(c.value)} to ${theme.primary(folder.name)}`
          ));
        }
      }
    }

    if (c.type === "eachFolderMustContainFile") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some((x) => x.type === "file" && x.name === c.value);
        if (!exists) {
          throw new Error(formatConstraintError(
            `${theme.highlight(folder.name)} must contain file ${theme.secondary('"' + c.value + '"')}`,
            `Add ${theme.secondary(c.value)} inside ${theme.primary(folder.name)}`
          ));
        }
      }
    }

    if (c.type === "eachFolderMustContainFolder") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some((x) => x.type === "folder" && x.name === c.value);
        if (!exists) {
          throw new Error(formatConstraintError(
            `${theme.highlight(folder.name)} must contain folder ${theme.secondary('"' + c.value + '"')}`,
            `Add folder ${theme.secondary(c.value)} inside ${theme.primary(folder.name)}`
          ));
        }
      }
    }

    if (c.type === "eachFolderMustHaveExt") {
      const folders = getFoldersByScope(root, c.path, c.scope);

      for (const folder of folders) {
        const exists = folder.children.some((x) => x.type === "file" && x.name.endsWith(c.ext));
        if (!exists) {
          throw new Error(formatConstraintError(
            `${theme.highlight(folder.name)} must contain a file with extension ${theme.secondary('"' + c.ext + '"')}`,
            `Add a ${theme.secondary(c.ext)} file inside ${theme.primary(folder.name)}`
          ));
        }
      }
    }
  }
}