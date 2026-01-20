import { FolderNode, Node } from "./ast.js";

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

export function addNode(root: FolderNode, pathStr: string, type: "folder" | "file") {
  const parts = pathStr.split("/").filter(Boolean);
  const name = parts.pop();
  if (!name) throw new Error("Invalid path");

  let current: FolderNode = root;

  for (const part of parts) {
    let child = current.children.find(c => c.name === part && c.type === "folder") as FolderNode;
    if (!child) {
      child = { type: "folder", name: part, children: [] };
      current.children.push(child);
    }
    current = child;
  }

  const exists = current.children.some(c => c.name === name);
  if (exists) throw new Error("Already exists");

  const newNode: Node = type === "folder"
    ? { type: "folder", name, children: [] }
    : { type: "file", name };

  current.children.push(newNode);
}

export function deleteNode(root: FolderNode, pathStr: string) {
  const parts = pathStr.split("/").filter(Boolean);
  const name = parts.pop();
  if (!name) throw new Error("Invalid path");

  let current: FolderNode = root;

  for (const part of parts) {
    const child = current.children.find(c => c.name === part && c.type === "folder") as FolderNode;
    if (!child) throw new Error("Path not found");
    current = child;
  }

  const index = current.children.findIndex(c => c.name === name);
  if (index === -1) throw new Error("Node not found");

  current.children.splice(index, 1);
}

export function renameNode(root: FolderNode, pathStr: string, newName: string) {
  const node = findNode(root, pathStr);
  if (!node) throw new Error("Node not found");
  node.name = newName;
}
