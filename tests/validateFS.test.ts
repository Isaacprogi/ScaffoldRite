import fs from "fs";
import path from "path";
import { FolderNode } from "../src/library/ast";
import {validateFS} from '../src/library/validateFS'

describe("validateFS", () => {
  const tempDir = path.join(__dirname, "temp");

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, "index.ts"), "console.log('hi')");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should validate existing structure", () => {
    const root: FolderNode = {
      type: "folder",
      name: "__root__",
      children: [{ type: "file", name: "index.ts" }],
    };

    expect(() => validateFS(root, tempDir)).not.toThrow();
  });

  it("should fail if missing file", () => {
    const root: FolderNode = {
      type: "folder",
      name: "__root__",
      children: [{ type: "file", name: "missing.ts" }],
    };

    expect(() => validateFS(root, tempDir)).toThrow();
  });
});
