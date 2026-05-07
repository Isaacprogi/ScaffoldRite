// src/components/ListView.tsx
import { useState } from "react";
import {
  BarChart3,
  RefreshCw,
  FileText,
  Link,
  Search,
  FolderOpen,
  AlertCircle,
  ChevronRight,
  File,
  GitBranch,
} from "lucide-react";

type ServerData = {
  graph: Record<string, string[]>;
  circular: string[][];
  standalone: string[];
};

type Props = {
  data: ServerData;
  mode: "all" | "circular" | "standalone";
  displayMode?: "full" | "filename";
};

type ColorKey = "amber" | "pink" | "gray";

const colorStyles: Record<
  ColorKey,
  {
    icon: string;
    badge: string;
    text: string;
    border: string;
    bg: string;
  }
> = {
  amber: {
    icon: "text-amber-400",
    badge:
      "bg-amber-900/50 text-amber-300 border border-amber-800",
    text: "text-amber-300",
    border: "border-amber-800",
    bg: "bg-amber-900/50",
  },
  pink: {
    icon: "text-pink-400",
    badge:
      "bg-pink-900/50 text-pink-300 border border-pink-800",
    text: "text-pink-300",
    border: "border-pink-800",
    bg: "bg-pink-900/50",
  },
  gray: {
    icon: "text-slate-400",
    badge:
      "bg-slate-900/50 text-slate-300 border border-slate-700",
    text: "text-slate-300",
    border: "border-slate-700",
    bg: "bg-slate-900/50",
  },
};

export function ListView({ data, mode, displayMode = "full" }: Props) {
  const { graph, circular, standalone } = data;
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to get display name based on mode
  const getDisplayName = (fullPath: string) => {
    if (displayMode === "filename") {
      return fullPath.split(/[/\\]/).pop() || fullPath;
    }
    return fullPath;
  };

  const getDirectoryPath = (fullPath: string) => {
    const parts = fullPath.split(/[/\\]/);
    if (parts.length <= 1) return "root";
    const directory = parts.slice(0, -1).join("/");
    return directory || "root";
  };

  const isNodeInCircular = (fullPath: string): boolean => {
    return circular.some((cycle) => cycle.includes(fullPath));
  };

  const isNodeStandalone = (fullPath: string): boolean => {
    return standalone.includes(fullPath);
  };

  const getFilteredFiles = () => {
    let files = Object.keys(graph);

    switch (mode) {
      case "circular":
        const circularFiles = new Set<string>();
        circular.forEach((cycle) => {
          cycle.forEach((file) => circularFiles.add(file));
        });
        files = files.filter((file) => circularFiles.has(file));
        break;
      case "standalone":
        files = files.filter((file) => standalone.includes(file));
        break;
      case "all":
      default:
        break;
    }

    if (searchTerm) {
      files = files.filter((file) =>
        file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDisplayName(file).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return files;
  };

  const filteredFiles = getFilteredFiles();

  const stats = {
    total: Object.keys(graph).length,
    circular: circular.length,
    standalone: standalone.length,
    withDeps: Object.keys(graph).filter(
      (f) => graph[f]?.length > 0
    ).length,
  };

  const getFileType = (file: string) => {
    if (isNodeStandalone(file))
      return {
        label: "Standalone",
        color: "amber" as ColorKey,
        icon: FileText,
      };
    if (isNodeInCircular(file))
      return {
        label: "Circular",
        color: "pink" as ColorKey,
        icon: RefreshCw,
      };
    return {
      label: "Normal",
      color: "gray" as ColorKey,
      icon: File,
    };
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto pb-[4rem] bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <BarChart3 size={24} className="mb-1 text-slate-400" />
            <div className="text-2xl font-bold text-white">
              {stats.total}
            </div>
            <div className="text-xs text-slate-400">
              Total Files
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <RefreshCw size={24} className="mb-1 text-red-400" />
            <div className="text-2xl font-bold text-red-400">
              {stats.circular}
            </div>
            <div className="text-xs text-slate-400">
              Circular Chains
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <FileText size={24} className="mb-1 text-amber-400" />
            <div className="text-2xl font-bold text-amber-400">
              {stats.standalone}
            </div>
            <div className="text-xs text-slate-400">
              Standalone Files
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <Link size={24} className="mb-1 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">
              {stats.withDeps}
            </div>
            <div className="text-xs text-slate-400">
              Files with Dependencies
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={displayMode === "full" ? "Search file paths..." : "Search file names..."}
              className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* File list */}
        <div className="space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No files found matching your search
            </div>
          ) : (
            filteredFiles.map((file) => {
              const deps = graph[file] || [];
              const type = getFileType(file);
              const TypeIcon = type.icon;
              const styles = colorStyles[type.color];
              const displayName = getDisplayName(file);
              const directoryPath = getDirectoryPath(file);
              const isRoot = directoryPath === "root";

              return (
                <div
                  key={file}
                  className="bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <TypeIcon
                          size={20}
                          className={styles.icon}
                        />

                        <div className="flex-1">
                          <div className="font-mono text-sm text-white">
                            {displayName}
                          </div>
                          {!isRoot && (
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <FolderOpen size={12} />
                              {displayMode === "filename" ? (
                                <span title={file}>
                                  {directoryPath}
                                </span>
                              ) : (
                                directoryPath
                              )}
                            </div>
                          )}
                          {displayMode === "full" && isRoot && (
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <FolderOpen size={12} />
                              root
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={styles.badge + " px-2 py-1 rounded-full text-xs font-medium"}>
                        {type.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <GitBranch size={12} />
                        Dependencies ({deps.length}):
                      </div>

                      {deps.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {deps.map((dep) => (
                            <span
                              key={dep}
                              className="text-xs px-2 py-1 bg-slate-900 rounded-md text-slate-300 font-mono flex items-center gap-1"
                              title={displayMode === "filename" ? dep : undefined}
                            >
                              <ChevronRight size={10} />
                              {displayMode === "filename" 
                                ? (dep.split(/[/\\]/).pop() || dep)
                                : dep
                              }
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic">
                          No dependencies
                        </div>
                      )}
                    </div>

                    {isNodeInCircular(file) && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Part of circular dependency chain
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}