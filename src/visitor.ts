import { FolderNode, FileNode } from "./ast.js";

type Visitor = {
  folder?: (node: FolderNode, path: string) => void;
  file?: (node: FileNode, path: string) => void;
};

export function visit(
  node: FolderNode,
  visitor: Visitor,
  currentPath = ""
) {
  // ignore virtual root in path
  const isVirtualRoot = node.name === "__root__";

  const nodePath = isVirtualRoot
    ? currentPath
    : currentPath
      ? `${currentPath}/${node.name}`
      : node.name;

  if (!isVirtualRoot) {
    visitor.folder?.(node, nodePath);
  }

  for (const child of node.children) {
    if (child.type === "folder") {
      visit(child, visitor, nodePath);
    } else {
      visitor.file?.(child, `${nodePath}/${child.name}`);
    }
  }
}
