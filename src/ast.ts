export type Node = FolderNode | FileNode;

export type FolderNode = {
  type: "folder";
  name: string;
  children: Node[];
  
};

export type FileNode = {
  type: "file";
  name: string;
};
