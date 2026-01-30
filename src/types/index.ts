export type HistoryEntry = {
  id: string;
  command: string;
  args: string[];
  flags: string[];
  timestamp: number;

  operations: Operation[];

  before: {
    structure: string;     // structure.sr
    fsSnapshot?: string;   // filesystem snapshot serialized as structure.sr
  };

  after?: {
    structure: string;
    fsSnapshot?: string;
  };
};


export type Operation =
  | {
      type: "create";
      path: string;
      nodeType: "file" | "folder";
    }
  | {
      type: "delete";
      path: string;
      backupPath?: string; // where deleted content was stored
    }
  | {
      type: "rename";
      from: string;
      to: string;
    };


  // Add to types/index.js or similar
export interface GenerateOptions {
  dryRun: boolean;
  ignoreList: string[];
  onProgress?: (event: ProgressEvent) => void;
  onStart?: (total: number) => void;
  copyContents?: boolean; // Add this
}