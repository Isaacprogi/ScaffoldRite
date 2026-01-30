import { FolderNode } from "../src/library/ast";
import { addNode } from "../src/library/structure";

describe("structure.addNode", () => {
    it("should create a nested folder structure", () => {
        const root: FolderNode = { type: "folder", name: "__root__", children: [] };

       addNode(root, "src/backend", "folder");

        const src = root.children[0] as FolderNode;
        const backend = src.children[0] as FolderNode;

        expect(src.name).toBe("src");
        expect(backend.name).toBe("backend");
    });

    it("should throw error if exists and not force", () => {
        const root: FolderNode = {
            type: "folder",
            name: "__root__",
            children: [{ type: "folder", name: "src", children: [] }],
        };

        expect(() => addNode(root, "src", "folder")).toThrow();
    });

    it("should not throw if --if-not-exists flag used", () => {
        const root: FolderNode = {
            type: "folder",
            name: "__root__",
            children: [{ type: "folder", name: "src", children: [] }],
        };

        expect(() =>
            addNode(root, "src", "folder", { ifNotExists: true })
        ).not.toThrow();
    });
});
