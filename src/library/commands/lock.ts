import { installHook } from "../core/gitHooks";

export async function lockCommand(
  baseDir: string,
  flags: { prePush?: boolean }
) {
  installHook(baseDir, { prePush: flags.prePush });
}