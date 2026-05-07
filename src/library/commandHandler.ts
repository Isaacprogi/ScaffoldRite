
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
import { ALLOWED_COMMANDS, getIgnoreList, loadASTFromRef, warnIgnoreToolingUsage } from "../lib/utils/index";
import { createProgressBar } from "./progress";
// import { Operation } from "../types/index";
import {
    flattenTree, loadConstraints, hasFlag, getPassedFlags, getFlagValuesAfter,
    loadAST, confirmProceed, saveStructure, filterTreeByIgnore, printTree, printTreeWithIcons,
    renameFSItem, ALLOWED_FLAGS, printUsage
} from "../lib/utils/index";
import { HistoryEntry } from "../types/index";
// import { structureToSRString } from "./utils/index";
// import { v4 as uuidv4 } from "uuid";
// import chalk from "chalk";
import { icons, theme } from "../data/index";
import { runRequirements, checkMutuallyExclusiveFlags } from "../lib/utils/index";
import { SCAFFOLDRITE_DIR, STRUCTURE_PATH, IGNORE_PATH } from "../lib/utils/index";
import { baseDir } from "../lib/utils/index";
import { exit } from "../lib/utils/index";
import { CommandHandler } from "../types/index";
import { command } from "../lib/utils/index";
import { warnCopyWithoutOutput } from "../lib/utils/index";
import { doctorCommand } from "./commands/doctor";
import { buildDependencyGraph, printDependencyTree, findStandaloneFiles, detectCircular, printCircular, buildGraphFromStructure } from "./core/deps";
import { startServer } from "./core/graph-server";
import {
    installStructureLock,
    removeStructureLock,
    enableCI,
    disableCI
} from "./core/lock";
import { installGitLock, removeGitLock } from "./core/gitHooks";
import { preventIfStructureLocked } from "./core/lock";
import { execSync } from "child_process";
import { buildASTFromGit } from "./fsToAst";
import { applyConfigSettings } from "./core/lock";


const args = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const arg3 = args[0];
const arg4 = args[1];


const passedFlags = getPassedFlags();
const allowedFlags = ALLOWED_FLAGS[command];
const dryRun = hasFlag("--dry-run");
const bar = createProgressBar();
const verbose = hasFlag("--verbose");
const summary = hasFlag("--summary");
const prePush = hasFlag("--pre-push")

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
const migrate = hasFlag("--migrate");
const isLocalAst = hasFlag("--local-ast");

const parsed = parseStructure(DEFAULT_TEMPLATE);

const copyContents = hasFlag("--copy");


const showCircular = hasFlag("--circular");
const showStandalone = hasFlag("--standalone");
const showJSON = hasFlag("--json");
const serve = hasFlag("--serve");
const onlyAgainst = hasFlag("--only");

const hasAgainst = hasFlag("--against");
const againstValue = getFlagValuesAfter("--against")[0] || "origin/main";


if (!command || command === "--help" || command === "-h") {
    printUsage();
    exit(0);
}


if (!ALLOWED_COMMANDS.includes(command)) {
    console.error(theme.error.bold(`${icons.error} Unknown command: ${command}`));
    printUsage();
    process.exit(1);
}
if (!ALLOWED_FLAGS.hasOwnProperty(command)) {
    console.log(allowedFlags !== undefined ? allowedFlags : "");
    printUsage();
    process.exit(1);
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
        console.log(theme.info(`ℹ️ Run \`scaffoldrite changelog\` to see what’s new in this version.`));
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
        await preventIfStructureLocked("init");
        const shouldOverwrite = force;
        const sDir = path.join(baseDir, ".scaffoldrite");

        // Guard directory creation
        if (!fs.existsSync(sDir)) {
            if (!dryRun) {
                fs.mkdirSync(sDir, { recursive: true });
            } else {
                console.log(theme.info(`${icons.info} [Dry Run] Would create directory: .scaffoldrite`));
            }
        }
        
        const projectConfig = path.join(sDir, "project.json");

        const legacyStructure = path.join(baseDir, "structure.sr");
        const legacyIgnore = path.join(baseDir, ".scaffoldignore");

        const structureExists = fs.existsSync(STRUCTURE_PATH);
        const ignoreExists = fs.existsSync(IGNORE_PATH);
        const projectExists = fs.existsSync(projectConfig);

        const existingConfigs = [];
        if (structureExists) existingConfigs.push("structure.sr");
        if (ignoreExists) existingConfigs.push(".scaffoldignore");
        if (projectExists) existingConfigs.push("project.json");

        if (!shouldOverwrite && existingConfigs.length > 0) {
            console.error(
                theme.error.bold(`${icons.error} The following files already exist:\n`) +
                existingConfigs.map(f => theme.muted(`  - ${f}`)).join("\n") +
                theme.warning(`\n\nUse --force to overwrite everything.`)
            );
            exit(1);
        }

        if (migrate) {
            let migrated = false;
            if (fs.existsSync(legacyStructure)) {
                if (!dryRun) {
                    fs.renameSync(legacyStructure, STRUCTURE_PATH);
                    console.log(theme.success(`${icons.check} Moved structure.sr → .scaffoldrite/structure.sr`));
                } else {
                    console.log(theme.info(`${icons.info} [Dry Run] Would move structure.sr → .scaffoldrite/structure.sr`));
                }
                migrated = true;
            }
            if (fs.existsSync(legacyIgnore)) {
                if (!dryRun) {
                    fs.renameSync(legacyIgnore, IGNORE_PATH);
                    console.log(theme.success(`${icons.check} Moved .scaffoldignore → .scaffoldrite/.scaffoldignore`));
                } else {
                    console.log(theme.info(`${icons.info} [Dry Run] Would move .scaffoldignore → .scaffoldrite/.scaffoldignore`));
                }
                migrated = true;
            }
            if (!migrated) console.log(theme.info(`${icons.info} No legacy config found to migrate.`));
            return;
        }

        if (empty) {
            const root: FolderNode = { type: "folder", name: ".", children: [] };
            if (!dryRun) {
                saveStructure(root, parsed.rawConstraints, STRUCTURE_PATH);
                if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
                    fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
                }
                console.log(theme.success(`${icons.success} Empty structure.sr created`));
            } else {
                console.log(theme.info(`${icons.info} [Dry Run] Would create empty structure.sr and .scaffoldignore`));
            }
        } else if (fromFs) {
            const targetDir = path.resolve(arg3 ?? baseDir);
            const ignoreList = getIgnoreList();
            const ast = buildASTFromFS(targetDir, ignoreList);
            if (!dryRun) {
                saveStructure(ast, parsed.rawConstraints, STRUCTURE_PATH);
                if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
                    fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
                }
                console.log(theme.success(`${icons.success} structure.sr generated from filesystem: `) + theme.light(targetDir));
            } else {
                console.log(theme.info(`${icons.info} [Dry Run] Would generate structure.sr from filesystem: ${targetDir}`));
            }
        } else {
            if (!dryRun) {
                saveStructure(parsed.root, parsed.rawConstraints, STRUCTURE_PATH);
                if (shouldOverwrite || !fs.existsSync(IGNORE_PATH)) {
                    fs.writeFileSync(IGNORE_PATH, DEFAULT_IGNORE_TEMPLATE);
                }
                console.log(theme.success(`${icons.success} structure.sr created`));
            } else {
                console.log(theme.info(`${icons.info} [Dry Run] Would create structure.sr and .scaffoldignore`));
            }
        }

        if (shouldOverwrite || !fs.existsSync(projectConfig)) {
            if (!dryRun) {
                fs.writeFileSync(
                    projectConfig,
                    JSON.stringify({
                        framework: "",
                        language: "",
                        version: "1.0.0",
                        author: "",
                        conventions: {
                            description: "",
                            folderStructure: [],
                            namingRules: [],
                            folderDepthLimits: [],
                            userNotes: []
                        },
                        additionalInfo: {
                            stateManagement: "",
                            styling: "",
                            testing: "",
                            routing: "",
                            apiClient: ""
                        },
                    }, null, 2)
                );
                console.log(theme.info(`${icons.info} Created project config: project.json`));
            } else {
                console.log(theme.info(`${icons.info} [Dry Run] Would create project config: project.json`));
            }
        }

        if (dryRun) {
            console.log(theme.primary.bold(`\n${icons.info} [Dry Run] Init simulation complete. No files were changed.`));
        }

        return;
    },


   update: async () => {
        await preventIfStructureLocked("update");
        if (!fs.existsSync(STRUCTURE_PATH)) {
            console.error(theme.error.bold(`${icons.error} Error: structure.sr not found. Run \`scaffoldrite init\` first.`));
            exit(1);
        }

        const targetDir = path.resolve(arg3 ?? baseDir);

        const ignoreList = getIgnoreList();
        const ast = buildASTFromFS(targetDir, ignoreList);


        const constraints = loadConstraints();

        if (!(await confirmProceed(targetDir))) {
            console.log(theme.muted(`${icons.info} Update cancelled.`));
            return;
        }

        // 🛡️ Guard the file update with dryRun
        if (!dryRun) {
            saveStructure(ast, constraints, STRUCTURE_PATH);
            console.log(theme.success(`${icons.success} structure.sr updated from filesystem: `) + theme.light(targetDir));
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Would update structure.sr based on: `) + theme.light(targetDir));
            console.log(theme.muted(`   (No changes were written to the disk)`));
        }

        return;
    },
    merge: async () => {
        await preventIfStructureLocked("merge");

        if (!fs.existsSync(STRUCTURE_PATH)) {
            console.error(theme.error.bold(`${icons.error} Error: structure.sr not found. Run \`scaffoldrite init\` first.`));
            exit(1);
        }

        const targetDir = path.resolve(arg3 ?? baseDir);

        const ignoreList = getIgnoreList();
        const fsAst = buildASTFromFS(targetDir, ignoreList);
        const structure = loadAST();

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


        if (!(await confirmProceed(targetDir))) {
            console.log(theme.muted(`${icons.info} Merge cancelled.`));
            return;
        }

        // 🛡️ Guard the final save with dryRun
        if (!dryRun) {
            saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);
            console.log(theme.success(`${icons.success} structure.sr merged with filesystem: `) + theme.light(targetDir));
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Would merge filesystem changes from ${theme.light(targetDir)} into structure.sr`));
            console.log(theme.muted(`   (The merge was computed in memory but not saved)`));
        }

        return;
    },
    list: async () => {

        const isDefault = !isFS && !isDiff && !isStructure;

        const targetDir = path.resolve(baseDir);

        let structure;

        if (hasAgainst) {
            structure = loadASTFromRef(againstValue);
            console.log(theme.info(`${icons.info} Retrieving list from ${againstValue}`));
        } else {
            structure = loadAST();
            console.log(theme.info(`${icons.info} Loading default list structure`));
        }

        if (isDefault) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }



            console.log(theme.primary.bold(`${icons.file} structure.sr\n`));
            if (withIcons) {
                printTreeWithIcons(structure.root);
            } else {
                printTree(structure.root)
            }
            return;
        }

        const ignoreList = getIgnoreList();

        if (isStructure) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }
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

        if (isFS) {
            const fsAst = hasAgainst
                ? buildASTFromGit(againstValue, ignoreList)
                : buildASTFromFS(targetDir, ignoreList);

            console.log(theme.secondary.bold(`${icons.folder} filesystem (`) + theme.light(targetDir) + theme.secondary.bold(`)`));
            console.log(theme.muted(`Ignoring: `) + theme.accent(ignoreList.join(", ")) + theme.muted(`\n`));

            if (withIcons) {
                printTreeWithIcons(fsAst);
            } else {
                printTree(fsAst)
            }
            return;
        }

        if (isDiff) {
            if (!fs.existsSync(STRUCTURE_PATH)) {
                console.error(theme.error.bold(`${icons.error} structure.sr not found. Run \`scaffoldrite init\` first.`));
                exit(1);
            }


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

    validate: async () => {
        let structure;

        if (hasAgainst) {
            structure = loadASTFromRef(againstValue);
            console.log(theme.info(`${icons.info} Validating against ${againstValue}`));
        } else {
            structure = loadAST();
        }

        const outputDir = path.resolve(baseDir);
        const ignoreList = getIgnoreList();

        try {
            validateConstraints(structure.root, structure.constraints);
            validateFS(structure.root, outputDir, {
                ignoreList,
                allowExtra,
                allowExtraPaths,
            });
            console.log(
                theme.success.bold(`${icons.success} All constraints and filesystem structure are valid`)
            );
        } catch (err: any) {
            console.error(
                theme.error.bold(`${icons.error} Validation failed: `) +
                theme.light(err.message)
            );
            exit(1);
        }
    },


    find: async () => {
        let structure;

        const searchQuery = arg3;
        if (!searchQuery) {
            console.error(theme.error.bold(`${icons.error} Please provide a file, folder, or path to find.`));
            printUsage("find");
            exit(1);
        }

        const results: string[] = [];
        const ignoreList = getIgnoreList();

        const searchStructure = isStructure || (!isStructure && !isFS);
        const searchFilesystem = isFS || (!isStructure && !isFS);

        !isStructure && !isFS &&
            console.log(
                theme.info(
                    `${icons.info} Searching both structure.sr and filesystem for: ${theme.highlight(searchQuery)} from ${hasAgainst ? againstValue : "current state"
                    }${theme.muted("\nUse --structure or --fs to search a specific source.")}`
                )
            );

        if (searchStructure && fs.existsSync(STRUCTURE_PATH)) {
            if (hasAgainst) {
                structure = loadASTFromRef(againstValue);
                isStructure && console.log(theme.info(`${icons.info} Searching structure.sr from ${againstValue}`));
            } else {
                structure = loadAST();
            }


            function searchAST(node: FolderNode, currentPath = "") {
                for (const child of node.children) {
                    const childPath = path.posix.join(currentPath, child.name);
                    if (child.name.includes(searchQuery) || childPath.includes(searchQuery)) {
                        results.push(`${icons.file} [structure] ${childPath}`);
                    }
                    if (child.type === "folder") {
                        searchAST(child, childPath);
                    }
                }
            }
            searchAST(structure.root);
        }

        if (searchFilesystem) {
            isFS && console.log(theme.info(`${icons.info} Searching filesystem from ${hasAgainst ? againstValue : "current state"}`));
            const fsAst = hasAgainst
                ? buildASTFromGit(againstValue, ignoreList)
                : buildASTFromFS(baseDir, ignoreList);

            function searchFSAST(node: FolderNode, currentPath = "") {
                for (const child of node.children) {
                    const childPath = path.posix.join(currentPath, child.name);
                    if (child.name.includes(searchQuery) || childPath.includes(searchQuery)) {
                        results.push(`${icons.folder} [fs] ${childPath}`);
                    }
                    if (child.type === "folder") {
                        searchFSAST(child, childPath);
                    }
                }
            }
            searchFSAST(fsAst);
        }
        if (results.length === 0) {
            console.log(theme.warning(`${icons.warning} Could not find '${searchQuery}' in the selected scope.`));
            return;
        }

        console.log(theme.primary.bold(`\nFound ${results.length} match(es) for '${searchQuery}':`));
        results.forEach(r => console.log(theme.light(`  ${r}`)));
    },

   generate: async () => {
        await preventIfStructureLocked("generate");

        let structure;
        if (hasAgainst && !isLocalAst) {
            // default behavior
            structure = loadASTFromRef(againstValue);
            console.log(theme.info(`${icons.info} Generating from AST of ${againstValue}`));
        } else {
            // user wants their current structure.sr
            structure = loadAST();
            if (hasAgainst) {
                console.log(theme.info(`${icons.info} Using local AST, referencing files from ${againstValue}`));
            }
        }

        validateConstraints(structure.root, structure.constraints);

        const outputDir = path.resolve(arg3 ?? baseDir);
        // const warnoutDir = path.resolve(arg3 ?? baseDir);

        // warnCopyWithoutOutput(hasFlag('--copy'), warnoutDir);

        const proceed = await warnIgnoreToolingUsage(ignoreTooling, outputDir, baseDir);

        if (!proceed) {
            console.log(theme.info("Operation cancelled."));
            process.exit(0);
        }

        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Generation cancelled.`));
            return;
        }

        const ignoreList = getIgnoreList();
        const logLines: string[] = [];
        let totalOps = 0;

        const failedFiles = await generateFS(structure.root, outputDir, {
            dryRun,
            ignoreList,
            copyContents,
            ref: hasAgainst ? againstValue : undefined,
            force: hasFlag("--force"),
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

        if (failedFiles.length > 0) {
            console.log(`\n${icons.warning} ${theme.warning("Note:")} Some files could not be retrieved from git "${againstValue}":`);
            failedFiles.forEach(file => {
                console.log(`  ${theme.muted("-")} ${theme.highlight(file)} ${theme.muted("(created empty file)")}`);
            });
            console.log(theme.muted("Tip: This usually happens with gitignored files or files not present in that commit.\n"));
        }

        const scaffoldOutput = path.join(outputDir, '.scaffoldrite');

        if (!dryRun) {
            if (ignoreTooling) {
                if (fs.existsSync(scaffoldOutput)) {
                    fs.rmSync(scaffoldOutput, {
                        recursive: true,
                        force: true,
                    });
                }
            } else {
                if (hasAgainst) {
                    const folderInGit = ".scaffoldrite";
                    const destFolder = path.resolve(outputDir);

                    try {
                        execSync(`git archive ${againstValue} ${folderInGit} | tar -x -C ${destFolder}`, {
                            stdio: ["ignore", "ignore", "ignore"],
                        });
                        console.log(theme.success(`${icons.check} Successfully synced metadata from ${againstValue}`));
                    } catch (err) {
                        // If syncing metadata fails, we just ensure the dir exists
                        const scaffoldDir = path.join(outputDir, ".scaffoldrite");
                        if (!fs.existsSync(scaffoldDir)) fs.mkdirSync(scaffoldDir, { recursive: true });
                    }
                } else {
                    const scaffoldDir = path.join(outputDir, ".scaffoldrite");
                    if (!fs.existsSync(scaffoldDir)) fs.mkdirSync(scaffoldDir, { recursive: true });

                    const structureSrc = path.join(process.cwd(), ".scaffoldrite", "structure.sr");
                    const ignoreSrc = path.join(process.cwd(), ".scaffoldrite", ".scaffoldignore");

                    if (fs.existsSync(structureSrc)) fs.copyFileSync(structureSrc, path.join(scaffoldDir, "structure.sr"));
                    if (fs.existsSync(ignoreSrc)) fs.copyFileSync(ignoreSrc, path.join(scaffoldDir, ".scaffoldignore"));
                }
            }
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Skipping metadata sync and .scaffoldrite directory creation.`));
        }

        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Detailed Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        }

        const finalStatus = dryRun 
            ? theme.info.bold(`\n[Dry Run] Generation simulation completed!`) 
            : theme.success.bold(`\n${icons.check} Generation completed successfully!`);
        
        console.log(finalStatus);
        return;
    },

   create: async () => {
  await preventIfStructureLocked("create");

  const structure = loadAST();
  const outputDir = path.resolve(baseDir);

  // const beforeStructureSR = structureToSRString(structure.root, structure.rawConstraints);
  const ignoreList = getIgnoreList();

  // const beforeFSSnapshotSR = structureToSRString(
  //   buildASTFromFS(outputDir, ignoreList),
  //   []
  // );

  // const operations: Operation[] = [];

  validateConstraints(structure.root, structure.constraints);

  const fullPath = path.join(outputDir, arg3);

  // If force and the path exists, stash it first
  // if (force && fs.existsSync(fullPath)) {
  //   const backupPath = path.join(
  //     SCAFFOLDRITE_DIR,
  //     "history",
  //     crypto.randomUUID()
  //   );

  //   fs.cpSync(fullPath, backupPath, { recursive: true });

  //   operations.push({
  //     type: "delete",
  //     path: arg3,
  //     backupPath,
  //   });

  //   fs.rmSync(fullPath, { recursive: true, force: true });
  // }

  // Add node to structure
  addNode(structure.root, arg3, arg4 as "file" | "folder", {
    force,
    ifNotExists,
  });

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

  // Save structure update (Guard with dryRun)
  if (!dryRun) {
    saveStructure(
      structure.root,
      structure.rawConstraints,
      STRUCTURE_PATH
    );
  } else {
    console.log(
      theme.info(
        `${icons.info} [Dry Run] Skipping update to structure.sr`
      )
    );
  }

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

    for (const line of logLines.filter((l) => !l.startsWith("SKIP"))) {
      console.log(theme.success(`  ${icons.success} ${line}`));
    }
  }

  // const afterStructureSR = structureToSRString(
  //   structure.root,
  //   structure.rawConstraints
  // );

  // const afterFSSnapshotSR = structureToSRString(
  //   buildASTFromFS(outputDir, ignoreList),
  //   []
  // );

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
  //       fsSnapshot: beforeFSSnapshotSR,
  //     },
  //     after: {
  //       structure: afterStructureSR,
  //       fsSnapshot: afterFSSnapshotSR,
  //     },
  //   });
  // }

  process.stdout.write("\n");

  const status = dryRun
    ? theme.info("[Dry Run] Creation simulated.")
    : theme.success.bold(`${icons.check} Created successfully.`);

  console.log(status);

  return;
},

   delete: async () => {
        await preventIfStructureLocked("delete");
        const structure = loadAST();
        validateConstraints(structure.root, structure.constraints);

        const targetPath = arg3;
        if (!targetPath) {
            console.error(theme.error.bold(`${icons.error} Error: Please provide a path to delete.`));
            exit(1);
        }

        // 1️⃣ Update in-memory AST
        deleteNode(structure.root, targetPath);

        validateConstraints(structure.root, structure.constraints);

        const outputDir = path.resolve(baseDir);

        // 2️⃣ Confirmation
        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Deletion cancelled.`));
            return;
        }

        // 3️⃣ Save structure update (Guard with dryRun)
        if (!dryRun) {
            saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Skipping update to structure.sr`));
        }

        const logLines: string[] = [];
        const ignoreList = getIgnoreList();

        // 4️⃣ Sync Filesystem
        await generateFS(structure.root, outputDir, {
            dryRun, // This utility already handles the physical deletion logic
            ignoreList,
            onProgress(e) {
                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        // 5️⃣ Output UI
        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                console.log(theme.error(`  ${icons.cross} ${line}`));
            }
        }

        process.stdout.write("\n");
        const status = dryRun ? theme.info("[Dry Run] Deletion simulated.") : theme.success.bold(`${icons.check} Deleted successfully.`);
        console.log(status);
        return;
    },
    rename: async () => {
        await preventIfStructureLocked("rename");
        
        const structure = loadAST();
        const oldPath = arg3;
        const newName = arg4;
        const outputDir = path.resolve(baseDir);

        if (!oldPath || !newName) {
            console.error(theme.error.bold(`${icons.error} Error: Missing arguments. Usage: rename <path> <newName>`));
            exit(1);
        }

        // 1️⃣ Validate constraints before doing anything
        validateConstraints(structure.root, structure.constraints);

        // 2️⃣ Prepare paths
        const oldFullPath = path.join(outputDir, oldPath);
        const newFullPath = path.join(outputDir, path.join(path.dirname(oldPath), newName));

        // 3️⃣ Update the in-memory AST
        renameNode(structure.root, oldPath, newName);

        // Re-validate to ensure the new name doesn't break constraints (e.g., naming conventions)
        validateConstraints(structure.root, structure.constraints);

        // 4️⃣ User Confirmation
        if (!(await confirmProceed(outputDir))) {
            console.log(theme.muted(`${icons.info} Rename cancelled.`));
            return;
        }

        // 5️⃣ Handle structure.sr update (with Dry Run guard)
        if (!dryRun) {
            saveStructure(structure.root, structure.rawConstraints, STRUCTURE_PATH);
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Would update ${STRUCTURE_PATH}`));
        }

        // 6️⃣ Handle physical filesystem rename (with Dry Run guard)
        if (!dryRun) {
            const renamed = renameFSItem(oldFullPath, newFullPath);
            if (!renamed) {
                console.warn(theme.warning(`${icons.warning} Warning: Item not found in filesystem, will create new based on structure.sr.`));
            }
        } else {
            console.log(theme.info(`${icons.info} [Dry Run] Would rename ${oldPath} → ${newName}`));
        }

        // 7️⃣ Sync everything else
        const logLines: string[] = [];
        const ignoreList = getIgnoreList();

        await generateFS(structure.root, outputDir, {
            dryRun, // generateFS handles its own logic internally
            ignoreList,
            onProgress(e) {
                logLines.push(`${e.type.toUpperCase()} ${e.path}`);
            },
        });

        // 8️⃣ Output formatting
        if (verbose) {
            console.log(theme.primary.bold(`\n📋 Operations:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                } else if (line.startsWith("SKIP")) {
                    console.log(theme.muted(`  ${icons.info} ${line}`));
                } else {
                    console.log(theme.info(`  ${icons.info} ${line}`));
                }
            }
        } else if (summary) {
            console.log(theme.primary.bold(`\n📊 Summary:`));
            console.log(theme.muted(`─`.repeat(40)));
            for (const line of logLines.filter(l => !l.startsWith("SKIP"))) {
                if (line.startsWith("CREATE")) {
                    console.log(theme.success(`  ${icons.success} ${line}`));
                } else if (line.startsWith("DELETE")) {
                    console.log(theme.error(`  ${icons.cross} ${line}`));
                }
            }
        }

        process.stdout.write("\n");
        const status = dryRun ? theme.info("[Dry Run] Rename simulated.") : theme.success.bold(`${icons.check} Renamed successfully.`);
        console.log(status);
        return;
    },

    lock: async () => {

        if (hasFlag("--git")) {
            installGitLock(baseDir, { prePush });
            return;
        }

        if (hasFlag("--structure")) {
            installStructureLock();
            return;
        }

        if (hasFlag("--ci")) {
            enableCI({ ref: againstValue, onlyAgainst, hasAgainst });
            return;
        }
        if (hasFlag("--config")) {
            console.log(theme.warning(`${icons.warning} Warning: This may remove Scaffoldrite-related config settings. Use with caution.`));
            await applyConfigSettings(baseDir, { ref: againstValue, onlyAgainst, hasAgainst });
            return;
        }

        console.log(theme.error(`${icons.info} Please specify a lock type:`));
        console.log(theme.muted(`  scaffoldrite unlock --git`));
        console.log(theme.muted(`  scaffoldrite unlock --structure`));
        console.log(theme.muted(`  scaffoldrite unlock --ci`));
    },

    unlock: async () => {

        if (hasFlag("--git")) {
            removeGitLock(baseDir, { prePush });
            return;
        }

        if (hasFlag("--structure")) {
            removeStructureLock();
            return;
        }

        if (hasFlag("--ci")) {
            disableCI();
            return;
        }

        console.log(theme.error(`${icons.info} Please specify a lock type:`));
        console.log(theme.muted(`  scaffoldrite unlock --git`));
        console.log(theme.muted(`  scaffoldrite unlock --structure`));
        console.log(theme.muted(`  scaffoldrite unlock --ci`));
    },
    doctor: async () => {
        doctorCommand(baseDir);
    },

    deps: async () => {
        const targetDir = path.resolve(baseDir);
        const ignoreList = getIgnoreList();
        


        const structure = loadAST();
        let graph;
        if (isFS) {
            graph = buildDependencyGraph(targetDir, ignoreList);
        } else {
            graph = await buildGraphFromStructure(__dirname, structure.root);
            console.log(graph)

        }

        const circular = detectCircular(graph);
        const standalone = findStandaloneFiles(graph);

        if (showCircular) {
            if (circular.length > 0) {
                console.log(theme.error.bold(`\nCircular Dependencies`));
                printCircular(graph);
            }
            return
        }
        if (showStandalone) {
            if (standalone.length > 0) {
                console.log(theme.warning.bold(`\nStandalone Files`));
                standalone.forEach(f => console.log(theme.light(`- ${f}`)));
            }
            return
        }
        console.log(theme.primary.bold(`\nFile Dependency Tree\n`));
        printDependencyTree(graph);


        if (standalone.length > 0) {
            console.log(theme.warning.bold(`\nStandalone Files`));
            standalone.forEach(f => console.log(theme.light(`- ${f}`)));
        }

        if (circular.length > 0) {
            console.log(theme.error.bold(`\nCircular Dependencies`));
            printCircular(graph);
        }
        // In commandHandlers.deps
    if (serve) {
    startServer(graph, circular, standalone);
}
    },

    changelog: async () => {
        console.log(theme.primary.bold(`\n📝 Scaffoldrite v${pkg.version} Changelog\n`));
        console.log(theme.muted(`─`.repeat(50)));

        console.log(theme.success(`✨ New Features:`));
        console.log(theme.light(`- Added 'deps' command with circular/standalone detection`));
        console.log(theme.light(`- Improved 'generate' with ignore-tooling handling`));
        console.log(theme.light(`- Added 'lock' and 'unlock' for CI/git/structure`));

        console.log(theme.warning(`⚠️ Improvements:`));
        console.log(theme.light(`- Better validation messages`));
        console.log(theme.light(`- Enhanced progress bar for generation`));

        console.log(theme.info(`ℹ️ Bug Fixes:`));
        console.log(theme.light(`- Fixed rename edge cases`));
        console.log(theme.light(`- Fixed copy-from-git for empty dirs`));
        process.exit(0);
    }
};
