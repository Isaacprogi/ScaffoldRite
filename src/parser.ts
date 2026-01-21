import { FolderNode, FileNode } from "./ast.js";
import { parseConstraints, Constraint } from "./constraints";

export type Structure = {
  root: FolderNode;
  constraints: Constraint[];
  rawConstraints: string[];
};

const INVALID_NAME_REGEX = /[^a-zA-Z0-9._-]/;

function validateName(name: string, line: number) {
  if (name === "__root__") {
    throw new Error(`[Line ${line}] Reserved name "__root__" is not allowed`);
  }
  if (INVALID_NAME_REGEX.test(name)) {
    throw new Error(`[Line ${line}] Invalid characters in name: "${name}"`);
  }
}

export function parseStructure(input: string): Structure {
  const lines = input.split("\n");

  const root: FolderNode = { type: "folder", name: "__root__", children: [] };
  const stack: FolderNode[] = [root];

  let constraints: string[] = [];
  let inConstraints = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = lines[i];
    const line = raw.trim();

    if (line.length === 0) continue;

    // Start constraints block
    if (line === "constraints {") {
      inConstraints = true;
      braceDepth = 1;
      continue;
    }

    // If we are inside constraints block
    if (inConstraints) {
      if (line.includes("{")) braceDepth++;
      if (line.includes("}")) braceDepth--;

      // If braceDepth becomes 0, constraints ended
      if (braceDepth === 0) {
        inConstraints = false;
        continue;
      }

      constraints.push(line);
      continue;
    }

    // Folder logic
    if (line.startsWith("folder ")) {
      const match = line.match(/^folder\s+(.+)\s+\{$/);
      if (!match) {
        throw new Error(`[Line ${lineNumber}] Invalid folder syntax: "${line}"`);
      }

      const name = match[1];
      validateName(name, lineNumber);

      const parent = stack[stack.length - 1];

      if (parent.children.some(c => c.type === "folder" && c.name === name)) {
        throw new Error(`[Line ${lineNumber}] Duplicate folder name "${name}" in the same scope`);
      }

      const folder: FolderNode = { type: "folder", name, children: [] };
      parent.children.push(folder);
      stack.push(folder);
      continue;
    }

    // File logic
    if (line.startsWith("file ")) {
      const match = line.match(/^file\s+(.+)$/);
      if (!match) {
        throw new Error(`[Line ${lineNumber}] Invalid file syntax: "${line}"`);
      }

      const name = match[1];
      validateName(name, lineNumber);

      const parent = stack[stack.length - 1];

      if (parent.children.some(c => c.type === "file" && c.name === name)) {
        throw new Error(`[Line ${lineNumber}] Duplicate file name "${name}" in the same scope`);
      }

      const file: FileNode = { type: "file", name };
      parent.children.push(file);
      continue;
    }

    // Close folder
    if (line === "}") {
      if (stack.length === 1) {
        throw new Error(`[Line ${lineNumber}] Unexpected "}"`);
      }
      stack.pop();
      continue;
    }

    throw new Error(`[Line ${lineNumber}] Unknown statement: "${line}"`);
  }

  if (stack.length !== 1) {
    throw new Error(`Unclosed folder block`);
  }

  return {
    root,
    constraints: parseConstraints(constraints.join("\n")),
    rawConstraints: constraints
  };
}
