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
  RefreshCcw,
  ArrowRight,
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
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    text: "text-amber-300",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  pink: {
    icon: "text-pink-400",
    badge: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
    text: "text-pink-300",
    border: "border-pink-500/20",
    bg: "bg-pink-500/5",
  },
  gray: {
    icon: "text-slate-400",
    badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    text: "text-slate-300",
    border: "border-slate-700",
    bg: "bg-slate-800/30",
  },
};

export function ListView({ data, mode, displayMode = "full" }: Props) {
  const { graph, circular, standalone } = data;
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set());

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

  const getFilteredFiles = (): string[] => {
    // For circular mode, we don't return individual files
    if (mode === "circular") {
      return [];
    }

    let files = Object.keys(graph);

    if (mode === "standalone") {
      files = files.filter((file) => standalone.includes(file));
    }

    if (searchTerm) {
      files = files.filter((file) =>
        file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDisplayName(file).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return files;
  };

  const getFilteredCircularCycles = (): string[][] => {
    let cycles = [...circular];

    if (searchTerm) {
      cycles = cycles.filter((cycle) =>
        cycle.some((file) =>
          file.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getDisplayName(file).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return cycles;
  };

  const filteredFiles = getFilteredFiles();
  const filteredCircularCycles = getFilteredCircularCycles();

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

  const toggleCycle = (index: number) => {
    setExpandedCycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto pb-[4rem] bg-[#1e1e1e]">
      <div className="p-6">
        {/* Stats - Notion/n8n style dashboard cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-[#2d2d2d] rounded-lg p-3 border border-[#3d3d3d] hover:border-[#4d4d4d] transition-all">
            <BarChart3 size={18} className="mb-1 text-slate-400" />
            <div className="text-2xl font-bold text-white">
              {stats.total}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Total Files
            </div>
          </div>

          <div className="bg-[#2d2d2d] rounded-lg p-3 border border-[#3d3d3d] hover:border-pink-500/30 transition-all">
            <RefreshCw size={18} className="mb-1 text-pink-400" />
            <div className="text-2xl font-bold text-pink-400">
              {stats.circular}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Circular Chains
            </div>
          </div>

          <div className="bg-[#2d2d2d] rounded-lg p-3 border border-[#3d3d3d] hover:border-amber-500/30 transition-all">
            <FileText size={18} className="mb-1 text-amber-400" />
            <div className="text-2xl font-bold text-amber-400">
              {stats.standalone}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Standalone Files
            </div>
          </div>

          <div className="bg-[#2d2d2d] rounded-lg p-3 border border-[#3d3d3d] hover:border-blue-500/30 transition-all">
            <Link size={18} className="mb-1 text-blue-400" />
            <div className="text-2xl font-bold text-blue-400">
              {stats.withDeps}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Files with Dependencies
            </div>
          </div>
        </div>

        {/* Search - Notion style */}
        <div className="mb-4 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={displayMode === "full" ? "Search file paths..." : "Search file names..."}
              className="w-full pl-9 pr-3 py-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-md text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50"
            />
          </div>
        </div>

        {/* File list - Grouped circular dependencies for circular mode */}
        {mode === "circular" ? (
          <div className="space-y-3">
            {filteredCircularCycles.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No circular dependencies found matching your search
              </div>
            ) : (
              filteredCircularCycles.map((cycle, cycleIndex) => {
                const cycleSize = cycle.length;
                const isExpanded = expandedCycles.has(cycleIndex);
                
                return (
                  <div
                    key={cycleIndex}
                    className="bg-[#2d2d2d] border border-pink-500/20 rounded-lg hover:border-pink-500/40 transition-all overflow-hidden"
                  >
                    {/* Cycle Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-pink-500/5 transition-colors"
                      onClick={() => toggleCycle(cycleIndex)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-1.5 rounded bg-pink-500/10">
                            <RefreshCcw size={16} className="text-pink-400" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] text-slate-200 font-medium">
                                Circular Dependency Chain
                              </span>
                              <span className="bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full text-[10px] font-medium border border-pink-500/20">
                                {cycleSize} files
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {cycle.slice(0, 3).map((file, idx) => (
                                <span key={idx} className="text-[11px] text-slate-400 font-mono">
                                  {getDisplayName(file)}
                                  {idx < Math.min(cycle.length, 3) - 1 && <ArrowRight size={10} className="inline mx-1 text-slate-600" />}
                                </span>
                              ))}
                              {cycleSize > 3 && (
                                <span className="text-[11px] text-slate-500">
                                  +{cycleSize - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <ChevronRight 
                          size={16} 
                          className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>

                    {/* Cycle Details - Expanded */}
                    {isExpanded && (
                      <div className="border-t border-pink-500/20 bg-pink-500/5">
                        <div className="p-4">
                          <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
                            <GitBranch size={11} />
                            Files in this circular chain:
                          </div>
                          
                          <div className="space-y-2">
                            {cycle.map((file, idx) => {
                              const displayName = getDisplayName(file);
                              const directoryPath = getDirectoryPath(file);
                              const isRoot = directoryPath === "root";
                              
                              return (
                                <div key={idx} className="bg-[#1e1e1e] rounded-md p-3 border border-pink-500/10">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-mono text-[12px] text-pink-300 font-medium">
                                        {displayName}
                                      </div>
                                      {!isRoot && (
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                          <FolderOpen size={10} />
                                          <span title={file}>
                                            {displayMode === "filename" ? directoryPath : directoryPath}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      Position {idx + 1} of {cycleSize}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-pink-500/10">
                                    <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1">
                                      <ArrowRight size={10} />
                                      Dependencies in this chain:
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {cycle.map((dep, depIdx) => {
                                        if (dep === file) return null;
                                        return (
                                          <span
                                            key={depIdx}
                                            className="text-[11px] px-2 py-0.5 bg-pink-500/10 rounded-md text-pink-400 font-mono flex items-center gap-1 border border-pink-500/20"
                                          >
                                            <ChevronRight size={10} />
                                            {getDisplayName(dep)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-3 text-[11px] text-pink-400 flex items-center gap-1.5 bg-pink-500/5 px-3 py-2 rounded border border-pink-500/10">
                            <AlertCircle size={11} />
                            This circular dependency creates a loop that can cause issues in build processes and runtime
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Normal list view for "all" and "standalone" modes */
          <div className="space-y-2">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
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
                    className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg hover:border-[#4d4d4d] hover:shadow-md transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`p-1 rounded ${styles.bg}`}>
                            <TypeIcon size={16} className={styles.icon} />
                          </div>

                          <div className="flex-1">
                            <div className="font-mono text-[13px] text-slate-200 font-medium">
                              {displayName}
                            </div>
                            {!isRoot && (
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <FolderOpen size={10} />
                                <span title={file}>
                                  {displayMode === "filename" ? directoryPath : directoryPath}
                                </span>
                              </div>
                            )}
                            {displayMode === "full" && isRoot && (
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <FolderOpen size={10} />
                                root
                              </div>
                            )}
                          </div>
                        </div>

                        <span className={`${styles.badge} px-2 py-0.5 rounded-full text-[10px] font-medium`}>
                          {type.label}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                          <GitBranch size={10} />
                          Dependencies ({deps.length}):
                        </div>

                        {deps.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {deps.map((dep) => (
                              <span
                                key={dep}
                                className="text-[11px] px-2 py-1 bg-[#1e1e1e] rounded-md text-slate-300 font-mono flex items-center gap-1 border border-[#3d3d3d]"
                                title={displayMode === "filename" ? dep : undefined}
                              >
                                <ChevronRight size={10} className="text-slate-600" />
                                {displayMode === "filename" 
                                  ? (dep.split(/[/\\]/).pop() || dep)
                                  : dep
                                }
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">
                            No dependencies
                          </div>
                        )}
                      </div>

                      {isNodeInCircular(file) && (
  <div className="mt-2 text-[11px] text-pink-400 flex items-center gap-1 bg-pink-500/5 px-2 py-1 rounded border border-pink-500/10">
    <AlertCircle size={11} />
    Part of circular dependency chain
  </div>
)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}