// src/components/Header.tsx
import { 
  Network, 
  List, 
  // Settings, 
  FileText, 
  FolderTree, 
  Download, 
  RefreshCw,
  ChevronDown,
  Layout,
  // Sparkles,
  Command,
  // Eye,
  // Palette
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type ViewMode = "graph" | "list";
type DisplayMode = "full" | "filename";

type Props = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  onExport?: () => void;
  onReload?: () => void;
};

export function Header({ 
  viewMode, 
  setViewMode, 
  displayMode = "full", 
  onDisplayModeChange,
  onExport,
  onReload
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        onExport?.();
        triggerExportAnimation();
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        onReload?.();
        triggerReloadAnimation();
      }
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        setViewMode("graph");
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        setViewMode("list");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onExport, onReload, setViewMode]);

  const triggerExportAnimation = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const triggerReloadAnimation = () => {
    setIsReloading(true);
    setTimeout(() => setIsReloading(false), 1000);
  };

  const handleExport = () => {
    triggerExportAnimation();
    onExport?.();
  };

  const handleReload = () => {
    triggerReloadAnimation();
    onReload?.();
  };

  return (
    <header className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-6 h-[4rem] relative backdrop-blur-sm">
      <div className="flex items-center justify-between h-full">
        {/* Left side - Notion style */}
        <div className='flex items-center gap-2'>

          {/* Display Dropdown - Notion inspired */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-3 py-1.5 bg-[#2d2d2d] rounded-md text-[13px] font-medium transition-all
                       flex items-center gap-2 text-[#e4e4e4] hover:bg-[#3d3d3d] border border-transparent hover:border-[#4d4d4d]"
            >
              <Layout size={14} className="text-[#808080]" />
              <span className="hidden sm:inline">Display</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-[#2d2d2d] rounded-lg shadow-xl border border-[#3d3d3d] z-20 overflow-hidden backdrop-blur-sm">
                <div className="px-3 py-2 border-b border-[#3d3d3d]">
                  <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-wider">Display Options</p>
                </div>
                
                <button
                  onClick={() => {
                    onDisplayModeChange?.("full");
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[13px] transition-all flex items-center gap-3 group
                            ${displayMode === "full" 
                              ? 'bg-pink-500/10 text-pink-400' 
                              : 'text-[#b4b4b4] hover:bg-white/5'
                            }`}
                >
                  <div className={`p-1 rounded ${displayMode === "full" ? 'bg-pink-500/20' : 'bg-[#3d3d3d] group-hover:bg-[#4d4d4d]'}`}>
                    <FolderTree size={14} className={displayMode === "full" ? 'text-pink-400' : 'text-[#808080]'} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Full Path</div>
                    <div className="text-[10px] text-[#808080]">Show complete file path</div>
                  </div>
                  {displayMode === "full" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  )}
                </button>
                
                <button
                  onClick={() => {
                    onDisplayModeChange?.("filename");
                    setShowDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[13px] transition-all flex items-center gap-3 group
                            ${displayMode === "filename" 
                              ? 'bg-pink-500/10 text-pink-400' 
                              : 'text-[#b4b4b4] hover:bg-white/5'
                            }`}
                >
                  <div className={`p-1 rounded ${displayMode === "filename" ? 'bg-pink-500/20' : 'bg-[#3d3d3d] group-hover:bg-[#4d4d4d]'}`}>
                    <FileText size={14} className={displayMode === "filename" ? 'text-pink-400' : 'text-[#808080]'} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">File Name Only</div>
                    <div className="text-[10px] text-[#808080]">Show just the file name</div>
                  </div>
                  {displayMode === "filename" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  )}
                </button>

                <div className="px-3 py-2 border-t border-[#3d3d3d] bg-[#252525]">
                  <p className="text-[10px] text-[#808080] flex items-center gap-1.5">
                    <Command size={10} />
                    <span>Press ⌘D to toggle display</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - n8n style with animations */}
          <div className="flex items-center gap-1 ml-1">
            {/* Export Button */}
            {onExport && viewMode !== 'list' && (
              <button
                onClick={handleExport}
                className={`relative px-3 py-1.5 rounded-md text-[13px] font-medium transition-all
                         flex items-center gap-2 text-[#e4e4e4] hover:bg-[#2d2d2d] group
                         ${isExporting ? 'bg-green-500/20 text-green-400' : ''}`}
                title="Export as PNG (⌘E)"
              >
                <Download size={14} className={`transition-transform group-hover:scale-110 ${isExporting ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Export</span>
                {isExporting && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-ping" />
                )}
              </button>
            )}

            {/* Reload Button */}
            {onReload && (
              <button
                onClick={handleReload}
                className={`relative px-3 py-1.5 rounded-md text-[13px] font-medium transition-all
                         flex items-center gap-2 text-[#e4e4e4] hover:bg-[#2d2d2d] group`}
                title="Reload data (⌘R)"
              >
                <RefreshCw size={14} className={`transition-all ${isReloading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span className="hidden sm:inline">Reload</span>
                {isReloading && (
                  <span className="absolute inset-0 rounded-md bg-blue-500/10 animate-pulse" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right side - n8n style view switcher */}
        <div className="flex items-center gap-3">
          {/* Keyboard shortcut hint - Notion style */}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-[#808080] bg-[#2d2d2d] px-2 py-1 rounded">
            <Command size={10} />
            <span>+</span>
            <span className="flex gap-0.5">
              <kbd className="px-1 bg-[#3d3d3d] rounded">1</kbd>
              <span>/</span>
              <kbd className="px-1 bg-[#3d3d3d] rounded">2</kbd>
            </span>
          </div>

          {/* View Toggle - n8n workflow style */}
          <div className="flex gap-1 bg-[#2d2d2d] rounded-md p-0.5">
            <button
              onClick={() => setViewMode("graph")}
              className={`
                px-3 py-1.5 rounded text-[13px] font-medium transition-all duration-200
                flex items-center gap-2 relative overflow-hidden
                ${viewMode === "graph" 
                  ? 'bg-pink-500 text-white shadow-sm' 
                  : 'text-[#b4b4b4] hover:text-[#e4e4e4] hover:bg-white/5'
                }
              `}
            >
              <Network size={14} />
              <span className="hidden sm:inline">Graph</span>
              {viewMode === "graph" && (
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-white/20 to-pink-500/0 animate-shimmer" />
              )}
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`
                px-3 py-1.5 rounded text-[13px] font-medium transition-all duration-200
                flex items-center gap-2 relative overflow-hidden
                ${viewMode === "list" 
                  ? 'bg-pink-500 text-white shadow-sm' 
                  : 'text-[#b4b4b4] hover:text-[#e4e4e4] hover:bg-white/5'
                }
              `}
            >
              <List size={14} />
              <span className="hidden sm:inline">List</span>
              {viewMode === "list" && (
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-white/20 to-pink-500/0 animate-shimmer" />
              )}
            </button>
          </div>

          {/* Quick settings indicator - n8n style */}
          {/* <div className="h-6 w-px bg-[#2d2d2d] mx-1" /> */}
          {/* <button className="p-1.5 rounded-md text-[#808080] hover:text-[#e4e4e4] hover:bg-[#2d2d2d] transition-all group">
            <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
          </button> */}
        </div>
      </div>
    </header>
  );
}