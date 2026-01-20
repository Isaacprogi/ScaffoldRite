import { FolderNode, FileNode, Node } from "./ast";

export type Constraint =
  | { type: "require"; path: string }
  | { type: "forbid"; path: string }
  | { type: "immutable"; path: string }
  | { type: "maxFiles"; path: string; value: number }
  | { type: "maxFilesByExt"; path: string; value: number; ext: string };

export function parseConstraints(input: string): Constraint[] {
  const lines = input
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const constraints: Constraint[] = [];

  for (const line of lines) {
    if (line.startsWith("require ")) {
      const path = line.replace("require ", "").trim();
      constraints.push({ type: "require", path });
      continue;
    }

    if (line.startsWith("forbid ")) {
      const path = line.replace("forbid ", "").trim();
      constraints.push({ type: "forbid", path });
      continue;
    }

    if (line.startsWith("immutable ")) {
      const path = line.replace("immutable ", "").trim();
      constraints.push({ type: "immutable", path });
      continue;
    }

    if (line.startsWith("maxFilesByExt ")) {
      const parts = line.split(" ");
      const ext = parts[1];
      const value = Number(parts[2]);
      const path = parts[3];
      constraints.push({ type: "maxFilesByExt", path, value, ext });
      continue;
    }

    if (line.startsWith("maxFiles ")) {
      const parts = line.split(" ");
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxFiles", path, value });
      continue;
    }

    throw new Error(`Unknown constraint: ${line}`);
  }

  return constraints;
}
