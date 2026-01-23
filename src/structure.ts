import { FolderNode, Node } from "./ast.js";

type AddOptions = {
  force?: boolean;
  ifNotExists?: boolean;
};

export function findNode(root: FolderNode, pathStr: string): Node | null {
  const parts = pathStr.split("/").filter(Boolean);
  let current: FolderNode = root;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const child = current.children.find(c => c.name === part);

    if (!child) return null;

    if (i === parts.length - 1) return child;
    if (child.type !== "folder") return null;

    current = child;
  }

  return null;
}

export function addNode(
  root: FolderNode,
  pathStr: string,
  type: "folder" | "file",
  options: AddOptions = {}
) {
  const parts = pathStr.split("/").filter(Boolean);
  const name = parts.pop();

  if (!name) {
    throw new Error(
      "Invalid path: path is empty. Example: src/components/Button.ts"
    );
  }

  let current: FolderNode = root;

  for (const part of parts) {
    let child = current.children.find(
      c => c.name === part && c.type === "folder"
    ) as FolderNode;

    if (!child) {
      child = { type: "folder", name: part, children: [] };
      current.children.push(child);
    }

    current = child;
  }

  const exists = current.children.some(c => c.name === name);

  if (exists) {
    if (options.ifNotExists) return; // do nothing
    if (!options.force) {
      throw new Error(
        `Cannot create ${type}: '${pathStr}' already exists in the structure.`
      );
    }

    // force = true -> replace existing node
    const idx = current.children.findIndex(c => c.name === name);
    current.children.splice(idx, 1);
  }

  const newNode: Node =
    type === "folder"
      ? { type: "folder", name, children: [] }
      : { type: "file", name };

  current.children.push(newNode);
  return current
}

export function deleteNode(root: FolderNode, pathStr: string) {
  const parts = pathStr.split("/").filter(Boolean);
  const name = parts.pop();

  if (!name) {
    throw new Error(
      "Invalid path: path is empty. Example: src/components/Button.ts"
    );
  }

  let current: FolderNode = root;

  for (const part of parts) {
    const child = current.children.find(
      c => c.name === part && c.type === "folder"
    ) as FolderNode;

    if (!child) {
      throw new Error(
        `Path not found: '${parts.join("/")}' does not exist in the structure.`
      );
    }

    current = child;
  }

  const index = current.children.findIndex(c => c.name === name);
  if (index === -1) {
    throw new Error(
      `Node not found: '${pathStr}' does not exist in the structure.`
    );
  }

  current.children.splice(index, 1);
}

export function renameNode(root: FolderNode, pathStr: string, newName: string) {
  const node = findNode(root, pathStr);

  if (!node) {
    throw new Error(`Node not found: '${pathStr}' does not exist.`);
  }

  if (!newName || newName.trim().length === 0) {
    throw new Error("Invalid new name: name cannot be empty.");
  }

  node.name = newName;
}
