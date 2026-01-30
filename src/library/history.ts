import { HistoryEntry } from "../types";
import { SCAFFOLDRITE_DIR } from "../utils";
import path from "node:path";
import fs from "fs";

const HISTORY_DIR = path.join(SCAFFOLDRITE_DIR, "history");

export function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}


export function writeHistory(entry: HistoryEntry) {
  ensureHistoryDir();
  const filename = `${entry.id}-${entry.command}.json`;
  fs.writeFileSync(
    path.join(HISTORY_DIR, filename),
    JSON.stringify(entry, null, 2)
  );
}
