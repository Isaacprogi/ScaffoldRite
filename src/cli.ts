#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { main } from "./library/main";
import { commandHandlers } from "./library/commandHandler";
import { command } from "./utils";
import { theme, icons } from "./data";
import { hasFlag } from "./utils";
import { exit } from "./utils";
import "dotenv/config";


const cwd = process.cwd();

function warnLegacyConfig() {
  const legacyStructure = path.join(cwd, "structure.sr");
  const legacyIgnore = path.join(cwd, ".scaffoldignore");
  const newConfigDir = path.join(cwd, ".scaffoldrite");

  const hasLegacy =
    fs.existsSync(legacyStructure) || fs.existsSync(legacyIgnore);

  const hasNewConfig = fs.existsSync(newConfigDir);

  if (hasLegacy && hasNewConfig && !hasFlag('--migrate')) {
    console.log(
      theme.warning(
        `${icons.warning} Detected legacy Scaffoldrite config in project root.\n` +
        `${icons.info} Scaffoldrite v2 now uses ${theme.primary(".scaffoldrite/")}.\n\n` +
        `${icons.arrow} ${theme.accent("sr init")} to regenerate config\n` +
        `${icons.arrow} ${theme.accent("sr init --migrate")} to migrate existing files`
      )
    );
    exit(1)
  }
}

warnLegacyConfig();

main(command, commandHandlers);
