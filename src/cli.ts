#!/usr/bin/env node

import { main } from "./library/main";
import { commandHandlers } from "./library/commandHandler";
import { command } from "./utils";

main(command,commandHandlers);
