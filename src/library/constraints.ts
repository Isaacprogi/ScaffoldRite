import { theme,icons } from "../data";

export type Constraint =
  | { type: "require"; path: string }
  | { type: "forbid"; path: string }
  | { type: "maxFiles"; path: string; value: number }
  | { type: "maxFilesByExt"; path: string; value: number; ext: string }
  | { type: "maxFilesRecursive"; path: string; value: number }
  | { type: "maxFilesByExtRecursive"; path: string; value: number; ext: string }
  | { type: "maxFolders"; path: string; value: number }
  | { type: "maxFoldersRecursive"; path: string; value: number }
  | { type: "minFiles"; path: string; value: number }
  | { type: "minFolders"; path: string; value: number }
  | { type: "mustContain"; path: string; value: string }
  | { type: "fileNameRegex"; path: string; regex: string }
  | { type: "maxDepth"; path: string; value: number }
  | { type: "mustHaveFile"; path: string; value: string }

  // NEW RULES
  | { type: "eachFolderMustContain"; path: string; value: string; scope: "*" | "**" }
  | { type: "eachFolderMustContainFile"; path: string; value: string; scope: "*" | "**" }
  | { type: "eachFolderMustContainFolder"; path: string; value: string; scope: "*" | "**" }
  | { type: "eachFolderMustHaveExt"; path: string; ext: string; scope: "*" | "**" }


function splitArgs(line: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' || ch === "'") {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === " " && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) args.push(current);
  return args;
}

export function parseConstraints(input: string): Constraint[] {
  const lines = input.split("\n");
  const constraints: Constraint[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

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

    if (line.startsWith("maxFilesByExtRecursive ")) {
      const parts = splitArgs(line);
      const ext = parts[1];
      const value = Number(parts[2]);
      const path = parts[3];
      constraints.push({ type: "maxFilesByExtRecursive", path, value, ext });
      continue;
    }

    if (line.startsWith("maxFilesRecursive ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxFilesRecursive", path, value });
      continue;
    }

    if (line.startsWith("maxFilesByExt ")) {
      const parts = splitArgs(line);
      const ext = parts[1];
      const value = Number(parts[2]);
      const path = parts[3];
      constraints.push({ type: "maxFilesByExt", path, value, ext });
      continue;
    }

    if (line.startsWith("maxFiles ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxFiles", path, value });
      continue;
    }

    if (line.startsWith("maxFoldersRecursive ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxFoldersRecursive", path, value });
      continue;
    }

    if (line.startsWith("maxFolders ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxFolders", path, value });
      continue;
    }

    if (line.startsWith("minFiles ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "minFiles", path, value });
      continue;
    }

    if (line.startsWith("minFolders ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "minFolders", path, value });
      continue;
    }

    // NEW RULES PARSING (WITH SCOPE)
    if (line.startsWith("eachFolderMustContain ")) {
      const parts = splitArgs(line);

      const scope = parts[1] as "*" | "**";
      if (scope !== "*" && scope !== "**") {
        throw new Error(`Invalid scope for eachFolderMustContain: ${scope}`);
      }

      const hasPath = parts.length === 4;
      const path = hasPath ? parts[2] : "";
      const value = hasPath ? parts[3] : parts[2];

      constraints.push({ type: "eachFolderMustContain", path, value, scope });
      continue;
    }

    if (line.startsWith("eachFolderMustContainFile ")) {
      const parts = splitArgs(line);

      const scope = parts[1] as "*" | "**";
      if (scope !== "*" && scope !== "**") {
        throw new Error(`Invalid scope for eachFolderMustContainFile: ${scope}`);
      }

      const hasPath = parts.length === 4;
      const path = hasPath ? parts[2] : "";
      const value = hasPath ? parts[3] : parts[2];

      constraints.push({ type: "eachFolderMustContainFile", path, value, scope });
      continue;
    }

    if (line.startsWith("eachFolderMustContainFolder ")) {
      const parts = splitArgs(line);

      const scope = parts[1] as "*" | "**";
      if (scope !== "*" && scope !== "**") {
        throw new Error(`Invalid scope for eachFolderMustContainFolder: ${scope}`);
      }

      const hasPath = parts.length === 4;
      const path = hasPath ? parts[2] : "";
      const value = hasPath ? parts[3] : parts[2];

      constraints.push({ type: "eachFolderMustContainFolder", path, value, scope });
      continue;
    }

    if (line.startsWith("eachFolderMustHaveExt ")) {
      const parts = splitArgs(line);

      const scope = parts[1] as "*" | "**";
      if (scope !== "*" && scope !== "**") {
        throw new Error(`Invalid scope for eachFolderMustHaveExt: ${scope}`);
      }

      const hasPath = parts.length === 4;
      const path = hasPath ? parts[2] : "";
      const ext = hasPath ? parts[3] : parts[2];

      constraints.push({ type: "eachFolderMustHaveExt", path, ext, scope });
      continue;
    }

    // EXISTING RULES
    if (line.startsWith("mustContain ")) {
      const parts = splitArgs(line);
      const path = parts[1];
      const value = parts[2];
      constraints.push({ type: "mustContain", path, value });
      continue;
    }

    if (line.startsWith("fileNameRegex ")) {
      const parts = splitArgs(line);
      const path = parts[1];
      const regex = parts[2];
      constraints.push({ type: "fileNameRegex", path, regex });
      continue;
    }

    if (line.startsWith("maxDepth ")) {
      const parts = splitArgs(line);
      const value = Number(parts[1]);
      const path = parts[2];
      constraints.push({ type: "maxDepth", path, value });
      continue;
    }

    if (line.startsWith("mustHaveFile ")) {
      const parts = splitArgs(line);
      const path = parts[1];
      const value = parts[2];
      constraints.push({ type: "mustHaveFile", path, value });
      continue;
    }

    throw new Error(
  `${icons.error} ${theme.error('Unknown constraint:')} ${theme.muted(line)}`
);
  }

  return constraints;
}
