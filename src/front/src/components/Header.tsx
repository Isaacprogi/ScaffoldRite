// src/components/Header.tsx
import { Network, List, Settings, FileText, FolderTree, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';

type ViewMode = "graph" | "list";
type DisplayMode = "full" | "filename";

type Props = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  onExport?: () => void;
  onReload?: () => void; // ✅ added
};

export function Header({ 
  viewMode, 
  setViewMode, 
  displayMode = "full", 
  onDisplayModeChange,
  onExport,
  onReload // ✅ added
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 h-[4rem] relative">
      <div className="flex items-center justify-between h-full">
        {/* Left side */}
        <div className='flex items-center gap-3'>

          {/* Display Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-3 py-2 bg-slate-800 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Settings size={16} />
              <span>Display</span>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                
                <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-20">
                  <button
                    onClick={() => {
                      onDisplayModeChange?.("full");
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3
                              ${displayMode === "full" 
                                ? 'bg-pink-600/20 text-pink-400' 
                                : 'text-slate-300 hover:bg-slate-700'
                              }
                              first:rounded-t-lg`}
                  >
                    <FolderTree size={16} />
                    <div className="flex-1">
                      <div className="font-medium">Full Path</div>
                      <div className="text-xs text-slate-400">Show complete file path</div>
                    </div>
                    {displayMode === "full" && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                  </button>
                  
                  <button
                    onClick={() => {
                      onDisplayModeChange?.("filename");
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3
                              ${displayMode === "filename" 
                                ? 'bg-pink-600/20 text-pink-400' 
                                : 'text-slate-300 hover:bg-slate-700'
                              }
                              last:rounded-b-lg`}
                  >
                    <FileText size={16} />
                    <div className="flex-1">
                      <div className="font-medium">File Name Only</div>
                      <div className="text-xs text-slate-400">Show just the file name</div>
                    </div>
                    {displayMode === "filename" && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          {onExport && viewMode !== 'list' && (
            <button
              onClick={onExport}
              className="px-3 py-2 bg-slate-800 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Export as PNG"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          )}

          {/* ✅ Reload Button */}
          {onReload && (
            <button
              onClick={onReload}
              className="px-3 py-2 bg-slate-800 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Reload data"
            >
              <RefreshCw size={16} />
              <span>Reload</span>
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("graph")}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                flex items-center gap-2
                ${viewMode === "graph" 
                  ? 'bg-pink-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              <Network size={18} />
              <span>Graph View</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-all
                flex items-center gap-2
                ${viewMode === "list" 
                  ? 'bg-pink-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              <List size={18} />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}