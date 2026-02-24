import { removeHook } from "../core/gitHooks";

export async function unlockCommand(
  baseDir: string,
  flags: { prePush?: boolean }
) {
  removeHook(baseDir, { prePush: flags.prePush });
}