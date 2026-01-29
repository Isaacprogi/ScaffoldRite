import cliProgress from "cli-progress";

interface ProgressUpdate {
  type: string;
  path: string;
  count: number;
}

interface ProgressBarControls {
  start: (total: number) => void;
  update: (e: ProgressUpdate) => void;
  stop: () => void;
}
 
export function createProgressBar(): ProgressBarControls {
  const bar = new cliProgress.SingleBar(
    {
      format: "{bar} {value}/{total} ops | {type} {path}",
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  );

  let totalOps = 0;

  return {
    start(total: number) {
      totalOps = total;
      bar.start(total, 0, { type: "", path: "" });
    },

    update(e: ProgressUpdate) {
      // If this is the final update, remove type/path from format
      if (e.count >= totalOps) {
        (bar as any).options.format = "{bar} {value}/{total} operations";
      }

      bar.update(e.count, {
        type: e.type.toUpperCase(),
        path: e.path,
      });
    },

    stop() {
      bar.stop();
    },
  };
}
