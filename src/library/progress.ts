import cliProgress from "cli-progress";
import chalk from "chalk";

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
      format:
        `${chalk.hex('#4cc9f0')("{bar}")} ` +
        `${chalk.hex('#00b4d8').bold("{percentage}%")} ` +
        `${chalk.hex('#4cc9f0')("|")} ` +
        `${chalk.hex('#f8f9fa')("{value}")}${chalk.hex('#adb5bd')("/{total}")} ` +
        `${chalk.hex('#4cc9f0')("|")} ` +
        `${chalk.hex('#ffd166').bold("{type}")} ` +
        `${chalk.hex('#8d99ae').italic("{path}")}`,
      
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true,
      barsize: 40,
    },
    cliProgress.Presets.shades_classic
  );

  let totalOps = 0;
  let startTime = Date.now();

  return {
    start(total: number) {
      totalOps = total;
      startTime = Date.now();
      bar.start(total, 0, { 
        type: "", 
        path: "",
        percentage: 0 
      });
    },

    update(e: ProgressUpdate) {
      const percentage = Math.floor((e.count / totalOps) * 100);
      
      // Dynamically update format based on progress
      if (percentage === 100) {
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        bar.update(e.count, {
          type: "OPERATIONS",
          path: `Finished in ${elapsedSeconds}s`,
          percentage: percentage,
        });
        
        // Use a different format for completion
        bar.setTotal(totalOps);
      } else {
        bar.update(e.count, {
          type: e.type.toUpperCase(),
          path: e.path,
          percentage: percentage,
        });
      }
    },

    stop() {
      bar.stop();
    },
  };
}