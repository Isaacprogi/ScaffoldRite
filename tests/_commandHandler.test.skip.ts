import fs from "fs";
import path from "path";
import { commandHandlers } from "../src/library/commandHandler";
import * as utils from "../src/utils/index";
import { buildASTFromFS } from "../src/library/fsToAst";
import { validateConstraints } from "../src/library/validator";
import { generateFS } from "../src/library/generator";
import { saveStructure } from "../src/utils/index";
import { validateFS } from "../src/library/validateFS";


jest.mock("fs");
jest.mock("../src/utils/index");
jest.mock("../src/fsToAst.ts");
jest.mock("../src/validator.ts");
jest.mock("../src/generator.ts");
jest.mock("../src/validateFS.ts");


describe("commandHandlers", () => {
  const originalCwd = process.cwd;
  const mockCwd = "/mock/project";

  beforeEach(() => {
    jest.resetAllMocks();
    process.cwd = jest.fn(() => mockCwd);
    (utils.getIgnoreList as jest.Mock).mockReturnValue([]);
    (utils.loadAST as jest.Mock).mockReturnValue({
      root: { type: "folder", name: ".", children: [] },
      constraints: [],
      rawConstraints: [],
    });
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  describe("version", () => {
    it("prints the version and exits", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      expect(() => commandHandlers.version()).toThrow("process.exit called");
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Scaffoldrite"));

      logSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe("init", () => {
    it("creates .scaffoldrite folder and writes structure and ignore files for empty init", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await commandHandlers.init();

      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(mockCwd, ".scaffoldrite"), { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockCwd, ".scaffoldrite", ".scaffoldignore"),
        expect.any(String)
      );

      logSpy.mockRestore();
    });
  });

  describe("validate", () => {
    it("calls validateConstraints and validateFS without errors", () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      (utils.getIgnoreList as jest.Mock).mockReturnValue([]);
      (validateConstraints as jest.Mock).mockReturnValue(undefined);
      (validateFS as jest.Mock).mockReturnValue(undefined);

      commandHandlers.validate();

      expect(validateConstraints).toHaveBeenCalled();
      expect(validateFS).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it("exits on validation error", () => {
      (validateConstraints as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid");
      });
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      expect(() => commandHandlers.validate()).toThrow("process.exit called");
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Validation failed"));

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
