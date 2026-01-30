
import fs from "fs";
import path from "path";
import { validateConstraints } from "./validator";
import { parseStructure } from "./parser";
import { generateFS } from "./generator";
import { FolderNode } from "./ast";
import { addNode, deleteNode, renameNode } from "./structure";
import { validateFS } from "./validateFS";
import { buildASTFromFS } from "./fsToAst";
import { DEFAULT_TEMPLATE, DEFAULT_IGNORE_TEMPLATE } from '../data/index'
const pkg = require("../../package.json");
import { getIgnoreList } from "../utils/index";
import { createProgressBar } from "./progress";
// import { Operation } from "../types/index";
import {
    flattenTree, loadConstraints, hasFlag, getPassedFlags, getFlagValuesAfter,
    loadAST, confirmProceed, saveStructure, filterTreeByIgnore, printTree, printTreeWithIcons,
    renameFSItem, ALLOWED_FLAGS, printUsage
} from "../utils/index";
import { HistoryEntry } from "../types/index";
// import { structureToSRString } from "./utils/index";
// import { v4 as uuidv4 } from "uuid";
// import chalk from "chalk";
import { icons, theme } from "../data/index";
import chalk from 'chalk'
import { runRequirements, checkMutuallyExclusiveFlags } from "../utils/index";
import { SCAFFOLDRITE_DIR,STRUCTURE_PATH,IGNORE_PATH } from "../utils/index";
import { baseDir } from "../utils/index";
import { exit } from "../utils/index";
import { CommandHandler } from "../types/index";
import { command } from "../utils/index";



const args = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const arg3 = args[0];
const arg4 = args[1];




const passedFlags = getPassedFlags();
const allowedFlags = ALLOWED_FLAGS[command];
const dryRun = hasFlag("--dry-run");
const bar = createProgressBar();
const verbose = hasFlag("--verbose");
const summary = hasFlag("--summary");

const ignoreTooling = hasFlag("--ignore-tooling");



const requiresInit = ["update", "merge", "validate", "generate", "create", "delete", "rename", "list"];
if (requiresInit.includes(command)) {
    if (!fs.existsSync(SCAFFOLDRITE_DIR) || !fs.existsSync(STRUCTURE_PATH)) {
        console.error(
            theme.error.bold(`${icons.error} Error: Scaffoldrite is not initialized.\n`) +
            theme.primary(`Please run:\n  scaffoldrite init [dir]`)
        );
        printUsage("init");
        exit(1);
    }
}


const isStructure = hasFlag("--structure") || hasFlag("--sr");
const isFS = hasFlag("--fs");
const isDiff = hasFlag("--diff");
const withIcons = hasFlag('--with-icon')


const empty = hasFlag("--empty");
const fromFs = hasFlag("--from-fs");

const force = hasFlag("--force");
const ifNotExists = hasFlag("--if-not-exists");

const allowExtraPaths = getFlagValuesAfter("--allow-extra");
const allowExtra = hasFlag("--allow-extra") && allowExtraPaths.length === 0;

const parsed = parseStructure(DEFAULT_TEMPLATE);

const copyContents = hasFlag("--copy");


if (!command || command === "--help" || command === "-h") {
    printUsage();
    exit(0);
}


if (!allowedFlags) {
    console.error(theme.error.bold(`${icons.error} Unknown command: ${command}`));
    exit(1);
}

const invalidFlags = passedFlags?.filter(
    (flag) => !allowedFlags.includes(flag)
);


if (invalidFlags?.length > 0) {
    console.error(
        theme.error.bold(`${icons.error} Unknown flag(s) for '${command}': `) +
        theme.warning(invalidFlags.join(", "))
    );
    printUsage(command);
    exit(1);
}


checkMutuallyExclusiveFlags({
    command,
    summary,
    verbose,
    empty,
    fromFs,
    ignoreTooling,
    copyContents,
    isFS,
    isStructure,
    isDiff,
    theme,
    icons,
});

runRequirements({
    command,
    arg3,
    arg4,
    fromFs,
    printUsage,
});




export const commandHandlers: Record<string, CommandHandler> = {
    version: () => {
        console.log(
            theme.primary.bold('Scaffoldrite') +
            theme.muted(' v') +
            theme.light.bold(pkg.version)
        );
        exit(0);
    },

    // history:async()=> {

    //   if (!fs.existsSync(HISTORY_DIR)) {
    //     console.log(chalk.red("❌ No history found."));
    //     exit(0);
    //   }

    //   const files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json"));

    //   if (files.length === 0) {
    //     console.log(chalk.yellow("⚠️  No history entries found."));
    //     exit(0);
    //   }

    //   console.log(chalk.cyanBright.bold("📜 Scaffoldrite History Entries:\n"));

    //   for (const file of files.sort()) {
    //     const fullPath = path.join(HISTORY_DIR, file);
    //     const entry: HistoryEntry = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

    //     console.log(`${chalk.green("ID:")} ${chalk.whiteBright(entry.id)}`);
    //     console.log(`${chalk.green("Command:")} ${chalk.blueBright(entry.command)}`);
    //     console.log(`${chalk.green("Args:")} ${chalk.magenta(entry.args.join(" "))}`);
    //     console.log(`${chalk.green("Flags:")} ${chalk.yellow(entry.flags.join(", "))}`);
    //     console.log(`${chalk.green("Timestamp:")} ${chalk.gray(new Date(entry.timestamp).toLocaleString())}`);
    //     console.log(chalk.gray("-".repeat(40)));
    //   }

    //   console.log(chalk.cyanBright.bold(`Total entries: ${files.length}`));
    //   return;
    // }

    // },

    init: async () => {
        const shouldOverwrite = force;


        const sDir = path.join(baseDir, ".scaffoldrite");

        // Create folder if missing
        if (!fs.existsSync(sDir)) {
            fs.mkdirSync(sDir, { recursive: true });
        }


        /* ===============================
         * OVERWRITE GUARDS
         * =============================== */
        const existingConfigs = [];

        const structureExists =  fs.existsSync(STRUCTURE_PATH)
        const ignoreExists = fs.existsSync(IGNORE_PATH)

        if (structureExists) existingConfigs.push("structure.sr");
        if (ignoreExists) existingConfigs.push(".scaffoldignore");

        if (!shouldOverwrite && existingConfigs.length > 0) {
            console.error(
                theme.error.bold(`${icons.error} The following files already exist:\n`) +
                existingConfigs.map(f => theme.muted(`  - ${f}`)).join("\n") +
                theme.warning(`\n\nUse --force to overwrite everything.`)
            );
            exit(1);
        }

        /* ===============================
         * FLAG VALIDATION
         * =============================== */


        /* ===============================
         * EMPTY INIT
         * =============================== */
        if (empty) {
            const root: FolderNode = {
                type: "folder",
                name: ".",
                children: [],
            };

            saveStructure(root, parsed.rawConstraints, STRUCTURE_PATH);

            if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
                if (shouldOverwrite && (fs.existsSync(IGNORE_PATH) || fs.existsSync(STRUCTURE_PATH))) {
                    console.warn(theme.warning(`${icons.warning} Overwriting existing due to --force`));
                }

                fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
            }

            console.log(theme.success(`${icons.success} Empty structure.sr created`));
            return;
        }

        /* ===============================
         * INIT FROM FILESYSTEM
         * =============================== */
        if (fromFs) {
            const targetDir = path.resolve(arg3 ?? baseDir);

            const ignoreList = getIgnoreList();
            const ast = buildASTFromFS(targetDir, ignoreList);


            saveStructure(ast, parsed.rawConstraints, STRUCTURE_PATH);

            if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
                if (shouldOverwrite && (fs.existsSync(IGNORE_PATH) || fs.existsSync(STRUCTURE_PATH))) {
                    console.warn(theme.warning(`${icons.warning} Overwriting existing due to --force`));
                }

                fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
            }

            console.log(theme.success(`${icons.success} structure.sr generated from filesystem: `) + theme.light(targetDir));
            return;
        }

        /* ===============================
         * DEFAULT INIT (TEMPLATE)
         * =============================== */

        saveStructure(parsed.root, parsed.rawConstraints, STRUCTURE_PATH);

        if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
            if (shouldOverwrite && (fs.existsSync(IGNORE_PATH) || fs.existsSync(STRUCTURE_PATH))) {
                console.warn(theme.warning(`${icons.warning} Overwriting existing due to --force`));
            }

            fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
        }

        console.log(theme.success(`${icons.success} structure.sr created`));
        return;
    },

    update: async () => {

        //  FAIL if structure.sr does not exist
        if (!fs.existsSync(STRUCTURE_PATH)) {
            console.error(theme.error.bold(`${icons.error} Error: structure.sr not found. Run \`scaffoldrite init\` first.`));
            exit(1);
        }

        const targetDir = path.resolve(arg3 ?? baseDir);

        const ignoreList = getIgnoreList();
        const ast = buildASTFromFS(targetDir, ignoreList);


        const constraints = loadConstraints();

        // confirmation
        if (!(await confirmProceed(targetDir))) {
            console.log(theme.muted(`${icons.info} Update cancelled.`));
            return;
        }

        saveStructure(ast, constraints, STRUCTURE_PATH);

        console.log(theme.success(`${icons.success} structure.sr updated from filesystem: `) + theme.light(targetDir));
        return;
    },
    merge: async () => {

        // FAIL if structure.sr does not exist
        if (!fs.existsSync(STRUCTURE_PATH)) {
            console.error(theme.error.bold(`${icons.error} Error: structure.sr not found. Run \`scaffoldrite init\` first.`));
            exit(1);
        }

        const targetDir = path.resolve(arg3 ?? baseDir);

        const ignoreList = getIgnoreList();
        const fsAst = buildASTFromFS(targetDir, ignoreList);
        const structure = loadAST();

        // Merge logic
        const mergeNodes = (existing: FolderNode, incoming: FolderNode) => {
            for (const child of incoming.children) {
                if (child.type === "folder") {
                    const found = existing.children.find(
                        (c) => c.type === "folder" && c.name === child.name
                    ) as FolderNode | undefined;

                    if (found) mergeNodes(found, child);
                    else existing.children.push(child);
                } else {
                    const exists = existing.children.some(
                        (c) => c.type === "file" && c.name === child.name
                    );
                    if (!exists) existing.children.push(child);
                }
            }
        };

        mergeNodes(structure.root, fsAst);


        // confirmation
        if (!(await confirmProceed(targetDir))) {
            console.log(theme.muted(`${icons.info} Merge cancelled.`));
            return;
        }

        saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

        console.log(theme.success(`${icons.success} structure.sr merged with filesystem: `) + theme.light(targetDir));
        return;
    },
    list: async () => {
        const isDefault = !isFS && !isDiff && !isStructure;

        const targetDir = path.resolve(baseDir);


        /* ================= DEFAULT (NO IGNORE) ================= */
        if (isDefault) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }

            const structure = loadAST();

            console.log(theme.primary.bold(`${icons.file} structure.sr\n`));
            if (withIcons) {
                printTreeWithIcons(structure.root);
            } else {
                printTree(structure.root)
            }
            return;
        }

        const ignoreList = getIgnoreList();

        /* ================= STRUCTURE.SR (WITH IGNORE) ================= */
        if (isStructure) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }

            const structure = loadAST();
            console.log(ignoreList)
            const filtered = filterTreeByIgnore(structure.root, ignoreList);

            console.log(theme.primary.bold(`${icons.file} structure.sr`));
            console.log(theme.muted(`Ignoring: `) + theme.accent(ignoreList.join(", ")) + theme.muted(`\n`));

            if (filtered) {
                printTreeWithIcons(structure.root);
            } else {
                printTree(structure.root)
            }

            return;
        }

        /* ================= FILESYSTEM (WITH IGNORE) ================= */
        if (isFS) {
            const fsAst = buildASTFromFS(targetDir, ignoreList);

            console.log(theme.secondary.bold(`${icons.folder} filesystem (`) + theme.light(targetDir) + theme.secondary.bold(`)`));
            console.log(theme.muted(`Ignoring: `) + theme.accent(ignoreList.join(", ")) + theme.muted(`\n`));

            if (withIcons) {
                printTreeWithIcons(fsAst);
            } else {
                printTree(fsAst)
            }
            return;
        }

        /* ================= DIFF (MEANINGFUL + IGNORE) ================= */
        if (isDiff) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }

            const structure = loadAST();
            const filteredStructure = filterTreeByIgnore(structure.root, ignoreList);
            const fsAst = buildASTFromFS(targetDir, ignoreList);

            const structMap = flattenTree(filteredStructure);
            const fsMap = flattenTree(fsAst);

            console.log(theme.highlight.bold(`${icons.file} structure.sr ${icons.arrow} ${icons.folder} filesystem diff`));
            console.log(theme.muted(`Ignoring: `) + theme.accent(ignoreList.join(", ")) + theme.muted(`\n`));

            for (const p of Array.from(
                new Set([...structMap.keys(), ...fsMap.keys()])
            ).sort()) {
                const inStruct = structMap.has(p);
                const inFS = fsMap.has(p);

                if (inStruct && !inFS) {
                    console.log(theme.error(`❌ Missing in filesystem: `) + theme.light(p));
                } else if (!inStruct && inFS) {
                    console.log(theme.warning(`➕ Extra in filesystem: `) + theme.light(p));
                }
            }

            return;
        }
    },

    validate: () => {
        const structure = loadAST();

        const outputDir = path.resolve(baseDir);
        const ignoreList = getIgnoreList();

        try {
            validateConstraints(structure.root, structure.constraints);
            validateFS(structure.root, outputDir, {
                ignoreList,
                allowExtra,
                allowExtraPaths,
            });
            console.log(theme.success.bold(`${icons.success} All constraints and filesystem structure are valid`));
        } catch (err: any) {
            console.error(theme.error.bold(`${icons.error} Validation failed: `) + theme.light(err.message));
            exit(1);
        }
        return;
    },

    generate: async () => {


        const structure = loadAST();
        validateConstraints(structure.root, structure.constraints);


        const outputDir = path.resolve(arg3 ?? baseDir);
       

        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Generation cancelled.`));
            return;
        }

        const ignoreList = getIgnoreList();


        const logLines: string[] = [];
        let totalOps = 0;

        await generateFS(structure.root, outputDir, {
            dryRun,
            ignoreList,
            copyContents,
            onStart(total) {
                totalOps = total;
                bar.start(total);
            },
            onProgress(e) {
                bar.update({
                    type: e.type.toUpperCase(),
                    path: e.path,
                    count: e.count,
                });

                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        bar.stop();
        const scaffoldOutput = path.join(outputDir, '.scaffoldrite')




        if (!dryRun) {
            if (ignoreTooling) {
                // DELETE the .scaffoldrite directory
                if (fs.existsSync(scaffoldOutput)) {
                    fs.rmSync(scaffoldOutput, {
                        recursive: true,
                        force: true,
                    });
                }

            } else {

                const structureSrc = path.join(process.cwd(), ".scaffoldrite", "structure.sr");
                const ignoreSrc = path.join(process.cwd(), ".scaffoldrite", ".scaffoldignore");

                // Destination folder (inside outputDir)
                const scaffoldDir = path.join(outputDir, ".scaffoldrite");
                if (!fs.existsSync(scaffoldDir)) fs.mkdirSync(scaffoldDir, { recursive: true });

                // Copy
                fs.copyFileSync(structureSrc, path.join(scaffoldDir, "structure.sr"));
                fs.copyFileSync(ignoreSrc, path.join(scaffoldDir, ".scaffoldignore"));

            }
        }




        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Detailed Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        }

        console.log(theme.success.bold(`\n${icons.check} Generation completed successfully!`));
        return;
    },

    create: async () => {
        const structure = loadAST();
        const outputDir = path.resolve(baseDir);
        // const beforeStructureSR = structureToSRString(structure.root, structure.rawConstraints);
        const ignoreList = getIgnoreList();


        // const beforeFSSnapshotSR = structureToSRString(buildASTFromFS(outputDir, ignoreList), []);

        // const operations: Operation[] = [];

        validateConstraints(structure.root, structure.constraints);

        const fullPath = path.join(outputDir, arg3);


        // If force and the path exists, stash it first
        // if (force && fs.existsSync(fullPath)) {
        //   const backupPath = path.join(SCAFFOLDRITE_DIR, 'history', crypto.randomUUID());
        //   fs.cpSync(fullPath, backupPath, { recursive: true });
        //   operations.push({
        //     type: 'delete',
        //     path: arg3,
        //     backupPath
        //   });
        //   fs.rmSync(fullPath, { recursive: true, force: true });
        // }

        // Add node to structure
        addNode(structure.root, arg3, arg4 as "file" | "folder", { force, ifNotExists });

        // Record create operation AFTER handling force
        // operations.push({
        //   type: "create",
        //   path: arg3,
        //   nodeType: arg4 as "file" | "folder",
        // });

        validateConstraints(structure.root, structure.constraints);

        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Creation cancelled.`));
            return;
        }

        saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

        const logLines: string[] = [];

        await generateFS(structure.root, outputDir, {
            dryRun,
            ignoreList,
            onProgress(e) {
                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                console.log(theme.success(`  ${icons.success} ${line}`));
            }
        }

        // const afterStructureSR = structureToSRString(structure.root, structure.rawConstraints);
        // const afterFSSnapshotSR = structureToSRString(buildASTFromFS(outputDir, ignoreList), []);




        // Write history
        // if (!dryRun) {
        //   writeHistory({
        //     id: uuidv4(),
        //     command,
        //     args: process.argv.slice(3),
        //     flags: passedFlags,
        //     timestamp: Date.now(),
        //     operations,
        //     before: {
        //       structure: beforeStructureSR,
        //       fsSnapshot: beforeFSSnapshotSR
        //     },
        //     after: {
        //       structure: afterStructureSR,
        //       fsSnapshot: afterFSSnapshotSR
        //     },
        //   });

        // }

        process.stdout.write("\n");
        console.log(theme.success.bold(`${icons.check} Created successfully.`));
        return;
    },

    delete: async () => {

        const structure = loadAST();
        validateConstraints(structure.root, structure.constraints);

        deleteNode(structure.root, arg3);

        validateConstraints(structure.root, structure.constraints);

        const outputDir = path.resolve(baseDir);

        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Deletion cancelled.`));
            return;
        }

        saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);
        const logLines: string[] = [];
        const ignoreList = getIgnoreList();

        await generateFS(structure.root, outputDir, {
            dryRun,
            ignoreList,
            onProgress(e) {
                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                console.log(theme.error(`  ${icons.cross} ${line}`));
            }
        }


        process.stdout.write("\n");
        console.log(theme.success.bold(`${icons.check} Deleted successfully.`));
        return;
    },
    rename: async () => {

        const structure = loadAST();
        validateConstraints(structure.root, structure.constraints);

        // 1️⃣ determine old path and new path
        const oldPath = arg3;
        const newName = arg4;
        const outputDir = path.resolve(baseDir);

        // Build full paths
        const oldFullPath = path.join(outputDir, oldPath);
        const newFullPath = path.join(outputDir, path.join(path.dirname(oldPath), newName));

        // 2️⃣ Rename on filesystem first (safe)
        const renamed = renameFSItem(oldFullPath, newFullPath);

        if (!renamed) {
            console.warn(theme.warning(`${icons.warning} Warning: Item not found in filesystem, will create new based on structure.sr.`));
        }

        // 3️⃣ Rename in structure.sr
        renameNode(structure.root, oldPath, newName);

        validateConstraints(structure.root, structure.constraints);

        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Rename cancelled.`));
            return;
        }

        saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);

        const logLines: string[] = [];
        const ignoreList = getIgnoreList();

        await generateFS(structure.root, outputDir, {
            dryRun,
            ignoreList,
            onProgress(e) {
                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                }
            }
        }

        process.stdout.write("\n");
        console.log(theme.success.bold(`${icons.check} Renamed successfully.`));
        return;
    }

};
