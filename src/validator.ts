import { Node, FolderNode, FileNode } from "./ast";
import { Constraint } from "./constraints";

function findNodeByPath(root: FolderNode, path: string): Node | null {
  const parts = path.split("/").filter(Boolean);

  let current: Node = root;

  // 👇 skip virtual root name
  if (parts[0] === root.name) {
    parts.shift();
  }

  for (const part of parts) {
    if (current.type !== "folder") return null;

    const next:Node | undefined = current.children.find(c => c.name === part);
    if (!next) return null;

    current = next;
  }

  return current;
}


export function validateConstraints(root: FolderNode, constraints: Constraint[]) {
  for (const c of constraints) {
    if (c.type === "require") {
      const node = findNodeByPath(root, c.path);
      if (!node) throw new Error(`Constraint failed: required path not found: ${c.path}`);
    }

    if (c.type === "forbid") {
      const node = findNodeByPath(root, c.path);
      if (node) throw new Error(`Constraint failed: forbidden path exists: ${c.path}`);
    }

    if (c.type === "maxFiles") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = folder.children.filter(x => x.type === "file").length;
      if (fileCount > c.value) throw new Error(`Constraint failed: ${c.path} has more than ${c.value} files`);
    }

    if (c.type === "maxFilesByExt") {
      const folder = findNodeByPath(root, c.path);
      if (!folder || folder.type !== "folder") continue;

      const fileCount = folder.children
        .filter(x => x.type === "file")
        .filter((f: FileNode) => f.name.endsWith(c.ext)).length;

      if (fileCount > c.value) throw new Error(`Constraint failed: ${c.path} has more than ${c.value} files of ${c.ext}`);
    }
  }
}
