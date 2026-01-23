import fs from "fs";
import path from "path";
import { buildASTFromFS } from "../fsToAst.js";

describe("fsToAst", () => {
  const tempDir = path.join(process.cwd(), "__temp__");

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    fs.writeFileSync(path.join(tempDir, "a.txt"), "hello");
    fs.mkdirSync(path.join(tempDir, "dist"));
    fs.writeFileSync(path.join(tempDir, "dist", "x.txt"), "x");
    fs.mkdirSync(path.join(tempDir, "node_modules"));
    fs.writeFileSync(path.join(tempDir, "node_modules", "pkg.txt"), "pkg");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("ignores default ignored folders", () => {
    const ast = buildASTFromFS(tempDir);
    const names = ast.children.map((c) => c.name);
    expect(names).toContain("a.txt");
    expect(names).not.toContain("dist");
    expect(names).not.toContain("node_modules");
  });

  test("include node_modules when flag used", () => {
    const ast = buildASTFromFS(tempDir, ["dist"]);
    const names = ast.children.map((c) => c.name);
    expect(names).toContain("node_modules");
    expect(names).toContain("a.txt");
    expect(names).not.toContain("dist");
  });
});
