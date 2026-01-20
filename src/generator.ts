import fs from "fs";
import path from "path";
import { visit } from "./visitor.js";
import { FolderNode } from "./ast.js";

export function generateFS(ast: FolderNode, outputDir: string) {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  function createFolder(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  function createFile(filePath: string) {
    fs.writeFileSync(filePath, "");
  }

  visit(ast, {
    folder: (_, nodePath) => createFolder(path.join(outputDir, nodePath)),
    file: (_, nodePath) => createFile(path.join(outputDir, nodePath)),
  });
}
