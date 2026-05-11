import { 
  Network, 
  List, 
  Settings,
  Download, 
  RefreshCw,
  Command,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../hooks/useApp';


type Props = {
  onExport?: () => void;
  onReload?: () => void;
};


export function Header({ onExport, onReload }: Props) {
  const { 
    viewMode, 
    setViewMode, 
    displayMode,
    setDisplayMode,
    showExportBtn,
    setShowExportBtn,
    showReloadBtn,
    setShowReloadBtn,
    enableTooltips,
    setEnableTooltips
  } = useApp();
  
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

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
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowSettings(true);
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
    <>
      <header className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-6 h-[4rem] relative backdrop-blur-sm">
        <div className="flex items-center justify-between h-full">
          {/* Left side */}
          <div className='flex items-center gap-2'>
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 bg-[#2d2d2d] rounded-md text-[13px] font-medium transition-all
                       flex items-center gap-2 text-[#e4e4e4] hover:bg-[#3d3d3d] border border-transparent hover:border-[#4d4d4d]"
              title="Settings (⌘D)"
            >
              <Settings size={14} className="text-[#808080]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-1">
              {/* Export Button */}
              {showExportBtn && onExport && viewMode !== 'list' && (
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
              {showReloadBtn && onReload && (
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

          {/* Right side - view switcher */}
          <div className="flex items-center gap-3">
            {/* Keyboard shortcut hint */}
            <div className="hidden md:flex items-center gap-1 text-[10px] text-[#808080] bg-[#2d2d2d] px-2 py-1 rounded">
              <Command size={10} />
              <span>+</span>
              <span className="flex gap-0.5">
                <kbd className="px-1 bg-[#3d3d3d] rounded">1</kbd>
                <span>/</span>
                <kbd className="px-1 bg-[#3d3d3d] rounded">2</kbd>
              </span>
            </div>

            {/* View Toggle */}
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
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-4">
          {/* Display Type Toggle */}
          <div>
            <label className="text-sm text-[#e4e4e4] block mb-2 font-medium">Display Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayMode("full")}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                  displayMode === "full" 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-[#2d2d2d] text-[#b4b4b4] hover:bg-[#3d3d3d]'
                }`}
              >
                Full Path
              </button>
              <button
                onClick={() => setDisplayMode("filename")}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                  displayMode === "filename" 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-[#2d2d2d] text-[#b4b4b4] hover:bg-[#3d3d3d]'
                }`}
              >
                File Name
              </button>
            </div>
          </div>

          {/* Show Export Button Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#e4e4e4] font-medium">Show Export Button</label>
            <button
              onClick={() => setShowExportBtn(!showExportBtn)}
              className={`w-10 h-5 rounded-full transition-all ${showExportBtn ? 'bg-pink-500' : 'bg-[#3d3d3d]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform m-0.5 ${showExportBtn ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Show Reload Button Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#e4e4e4] font-medium">Show Reload Button</label>
            <button
              onClick={() => setShowReloadBtn(!showReloadBtn)}
              className={`w-10 h-5 rounded-full transition-all ${showReloadBtn ? 'bg-pink-500' : 'bg-[#3d3d3d]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform m-0.5 ${showReloadBtn ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Enable Tooltips Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#e4e4e4] font-medium">Enable Tooltips</label>
            <button
              onClick={() => setEnableTooltips(!enableTooltips)}
              className={`w-10 h-5 rounded-full transition-all ${enableTooltips ? 'bg-pink-500' : 'bg-[#3d3d3d]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform m-0.5 ${enableTooltips ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="pt-2 border-t border-[#2d2d2d]">
            <p className="text-[10px] text-[#808080] flex items-center gap-1.5">
              <Command size={10} />
              <span>Press ⌘D to open settings</span>
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}