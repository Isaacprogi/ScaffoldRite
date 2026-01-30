export type HistoryEntry = {
  id: string;
  command: string;
  args: string[];
  flags: string[];
  timestamp: number;

  operations: Operation[];

  before: {
    structure: string;  
    fsSnapshot?: string;
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
      backupPath?: string; 
    }
  | {
      type: "rename";
      from: string;
      to: string;
    };


export type RequirementContext = {
  command: string;
  arg3?: string;
  arg4?: string;
  fromFs: boolean;
  printUsage: (cmd?: string) => void;
};


export type MutuallyExclusiveContext = {
  command: string;
  summary: boolean;
  verbose: boolean;
  empty: boolean;
  fromFs: boolean;
  ignoreTooling: boolean;
  copyContents: boolean;
  isFS: boolean;
  isStructure: boolean;
  isDiff: boolean;
  theme: any; 
  icons: any;
};


export type CommandHandler = () => Promise<void> | void;