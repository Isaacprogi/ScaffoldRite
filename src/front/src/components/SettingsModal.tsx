// src/components/SettingsModal.tsx
import { Eye, FileDown, HelpCircle } from 'lucide-react';

type DisplayMode = "full" | "filename";
type SettingsModalProps = {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  showExportButton: boolean;
  onShowExportButtonChange: (show: boolean) => void;
  enableTooltips: boolean;
  onEnableTooltipsChange: (enable: boolean) => void;
  onExport?: () => void;
};

export function SettingsModalContent({
  displayMode,
  onDisplayModeChange,
  showExportButton,
  onShowExportButtonChange,
  enableTooltips,
  onEnableTooltipsChange,
  onExport
}: SettingsModalProps) {
  return (
    <div className="space-y-6">
      {/* Display Type Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-pink-400" />
            <label className="text-sm font-medium text-[#e4e4e4]">Display Type</label>
          </div>
          <span className="text-[10px] text-[#808080]">Toggle display format</span>
        </div>
        
        <div className="bg-[#2d2d2d] rounded-lg p-1 flex gap-1">
          <button
            onClick={() => onDisplayModeChange("full")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
              ${displayMode === "full" 
                ? 'bg-pink-500 text-white shadow-sm' 
                : 'text-[#b4b4b4] hover:text-[#e4e4e4] hover:bg-[#3d3d3d]'
              }`}
          >
            Full Path
          </button>
          <button
            onClick={() => onDisplayModeChange("filename")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
              ${displayMode === "filename" 
                ? 'bg-pink-500 text-white shadow-sm' 
                : 'text-[#b4b4b4] hover:text-[#e4e4e4] hover:bg-[#3d3d3d]'
              }`}
          >
            File Name Only
          </button>
        </div>
        <p className="text-[11px] text-[#808080] mt-1">
          {displayMode === "full" 
            ? "Shows complete file paths for better context" 
            : "Shows only filenames for cleaner view"}
        </p>
      </div>

      {/* Show Export Button Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown size={16} className="text-green-400" />
            <label className="text-sm font-medium text-[#e4e4e4]">Show Export Button</label>
          </div>
          <button
            onClick={() => onShowExportButtonChange(!showExportButton)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all
              ${showExportButton ? 'bg-pink-500' : 'bg-[#3d3d3d]'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all
                ${showExportButton ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <p className="text-[11px] text-[#808080]">
          {showExportButton 
            ? "Export button is visible in the header" 
            : "Export button is hidden from the header"}
        </p>
        {showExportButton && onExport && (
          <button
            onClick={onExport}
            className="w-full mt-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 
                     border border-green-500/30 rounded-md text-green-400 text-sm 
                     font-medium transition-all flex items-center justify-center gap-2"
          >
            <FileDown size={14} />
            Test Export
          </button>
        )}
      </div>

      {/* Enable Tooltips Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-blue-400" />
            <label className="text-sm font-medium text-[#e4e4e4]">Enable Tooltips</label>
          </div>
          <button
            onClick={() => onEnableTooltipsChange(!enableTooltips)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all
              ${enableTooltips ? 'bg-pink-500' : 'bg-[#3d3d3d]'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all
                ${enableTooltips ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <p className="text-[11px] text-[#808080]">
          {enableTooltips 
            ? "Tooltips will appear on hover" 
            : "Tooltips are disabled"}
        </p>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="pt-2 border-t border-[#2d2d2d]">
        <p className="text-[10px] text-[#808080] flex items-center gap-1.5">
          <span className="font-mono bg-[#2d2d2d] px-1.5 py-0.5 rounded">⌘D</span>
          <span>to open settings</span>
        </p>
      </div>
    </div>
  );
}