import { FolderNode, FileNode } from "./ast";

type Visitor = {
  folder?: (node: FolderNode, path: string) => Promise<void> | void;
  file?: (node: FileNode, path: string) => Promise<void> | void;
};

export async function visit(
  node: FolderNode,
  visitor: Visitor,
  currentPath = ""
) {
  const isVirtualRoot = node.name === "__root__";

  const nodePath = isVirtualRoot
    ? currentPath
    : currentPath
    ? `${currentPath}/${node.name}`
    : node.name;

  if (!isVirtualRoot) {
    await visitor.folder?.(node, nodePath);
  }

  for (const child of node.children) {
    if (child.type === "folder") {
      await visit(child, visitor, nodePath);
    } else {
      await visitor.file?.(child, `${nodePath}/${child.name}`);
    }
  }
}
