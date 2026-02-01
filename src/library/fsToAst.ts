import fs from "fs";
import path from "path";
import { FolderNode, FileNode } from "./ast";
import { theme,icons } from "../data";



export function buildASTFromFS(
  dir: string,
  ignoreList: string[] = []
): FolderNode {
  
  if (!fs.existsSync(dir)) {
  throw new Error(
    `${icons.error} ${theme.error('Directory not found:')} ${theme.highlight(dir)}\n` +
    `${theme.info('Tip:')} Make sure the directory exists or create it with ${theme.primary(`mkdir -p "${dir}"`)}`
  );
}


const root: FolderNode = {
  type: "folder",
  name: path.basename(dir),
  children: [],
};

const isScaffoldriteInternal = (p: string) => {
   const rel = path.relative(dir, p);
   return rel === ".scaffoldrite" || rel.startsWith(".scaffoldrite" + path.sep);
 };

function scan(folderPath: string, node: FolderNode) {
  const items = fs.readdirSync(folderPath);
  
  for (const item of items) {
    if (ignoreList.includes(item)) continue;
    
    const itemPath = path.join(folderPath, item);
    

      if (isScaffoldriteInternal(itemPath)) continue;

      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const childFolder: FolderNode = {
          type: "folder",
          name: item,
          children: [],
        };
        node.children.push(childFolder);
        scan(itemPath, childFolder);
      } else {
        const childFile: FileNode = {
          type: "file",
          name: item,
        };
        node.children.push(childFile);
      }
    }
  }

  scan(dir, root);
  return root;
}
