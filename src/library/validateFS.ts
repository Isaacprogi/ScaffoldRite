import fs from "fs";
import path from "path";
import { FolderNode } from "./ast";
import { isIgnored } from "../utils/index";
import { theme, icons } from "../data/index";

export function validateFS(
  root: FolderNode,
  dir: string,
  options: {
    ignoreList?: string[];
    allowExtra?: boolean;
    allowExtraPaths?: string[];
    currentPath?: string;
  } = {}
) {
  const {
    ignoreList = [],
    allowExtra = false,
    allowExtraPaths = [],
    currentPath = "",
  } = options;

  if (!fs.existsSync(dir)) {
    throw new Error(
      `${icons.error} ${theme.error('Folder does not exist:')} ${theme.highlight(dir)}\n` +
      `${theme.muted('Expected folder according to')} ${theme.secondary('structure.sr')} ${theme.muted('at:')} ${theme.primary(currentPath || "root")}`
    );
  }

  const actualItems = fs.readdirSync(dir);

  // Check missing items in filesystem
  for (const child of root.children) {
    if (isIgnored(child.name, ignoreList)) continue;

    const expectedPath = path.join(dir, child.name);
    const expectedSrPath = path.join(currentPath, child.name);

    if (!fs.existsSync(expectedPath)) {
      const allowedExplicitly = allowExtraPaths.some((p) => {
        const normalized = path.normalize(p);
        return (
          expectedSrPath === normalized ||
          expectedSrPath.endsWith(normalized)
        );
      });

      if (allowExtra || allowedExplicitly) continue;

      throw new Error(
        `${icons.error} ${theme.error('Missing in filesystem:')} ${theme.highlight(expectedPath)}\n` +
        `${theme.muted('Expected according to')} ${theme.secondary('structure.sr')} ${theme.muted('at:')} ${theme.primary(expectedSrPath)}\n` +
        `${theme.info('Fix:')} Run ${theme.primary('scaffoldrite generate')} to recreate missing files. This does not restore file contents.`
      );
    }

    if (child.type === "folder") {
      if (!fs.statSync(expectedPath).isDirectory()) {
        throw new Error(
          `${icons.error} ${theme.error('Type mismatch:')} Expected ${theme.success('folder')} but found ${theme.warning('file')}\n` +
          `${theme.muted('Path:')} ${theme.highlight(expectedPath)}\n` +
          `${theme.secondary('structure.sr')} expects a folder at: ${theme.primary(expectedSrPath)}`
        );
      }

      validateFS(child, expectedPath, {
        ignoreList,
        allowExtra,
        allowExtraPaths,
        currentPath: expectedSrPath,
      });
    } else {
      if (!fs.statSync(expectedPath).isFile()) {
        throw new Error(
          `${icons.error} ${theme.error('Type mismatch:')} Expected ${theme.success('file')} but found ${theme.warning('folder')}\n` +
          `${theme.muted('Path:')} ${theme.highlight(expectedPath)}\n` +
          `${theme.secondary('structure.sr')} expects a file at: ${theme.primary(expectedSrPath)}`
        );
      }
    }
  }

  // Check extra items in filesystem not in .sr
  for (const item of actualItems) {
    if (isIgnored(item, ignoreList)) continue;

    const existsInSr = root.children.some((c) => c.name === item);
    if (!existsInSr) {
      const extraPath = path.join(dir, item);

      const allowedExplicitly = allowExtraPaths.some((p) => {
        const normalized = path.normalize(p);
        const extraRel = path.relative(dir, extraPath);
        const extraBasename = path.basename(extraPath);

        return (
          extraBasename === normalized ||
          extraRel === normalized ||
          extraRel.endsWith(normalized)
        );
      });

      if (allowExtra || allowedExplicitly) continue;

      throw new Error(
        `${icons.error} ${theme.error('Extra file/folder found in filesystem:')} ${theme.highlight(extraPath)}\n` +
        `${theme.muted('Not defined in')} ${theme.secondary('structure.sr')} ${theme.muted('at:')} ${theme.primary(currentPath || "root")}\n` +
        `${theme.info('Options:')}\n` +
        `  • ${theme.primary('--allow-extra')} to allow all extra files\n` +
        `  • ${theme.primary('--allow-extra ' + path.relative(process.cwd(), extraPath))} to allow this specific file\n` +
        `  • Delete or move the file to resolve`
      );
    }
  }
}