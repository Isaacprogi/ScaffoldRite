import { theme,icons } from "../data";
import { CommandHandler } from "../types";
import { exit } from "../utils";

export async function main(cmd: string,commandHandlers:Record<string, CommandHandler>) {
  const handler = commandHandlers[cmd];

  if (!handler) {
    console.error(theme.error.bold(`${icons.error} Unknown command: ${cmd}`));
    exit(1);
  }

  try {
    await handler();
  } catch (err: any) {
    console.error(
      theme.error.bold(`${icons.error} Error: `) + theme.light(err.message)
    );
    exit(1);
  }
}