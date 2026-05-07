// src/components/Sidebar.tsx
import { useState } from "react";
import Logo from "../assets/logo_transparent.png";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  RefreshCw,
  FileText,
  Circle,
  CircleDot,
  CircleOff,
  Lightbulb,
} from "lucide-react";

type Mode = "all" | "circular" | "standalone";

type Props = {
  mode: Mode;
  setMode: (m: Mode) => void;
  circularCount?: number;
  standaloneCount?: number;
  totalNodes?: number;
};

type ColorKey = "pink" | "red" | "amber";

const modeStyles: Record<
  ColorKey,
  {
    activeBg: string;
    activeBadge: string;
  }
> = {
  pink: {
    activeBg: "bg-pink-600 text-white shadow-lg",
    activeBadge: "bg-pink-400/30",
  },
  red: {
    activeBg: "bg-red-600 text-white shadow-lg",
    activeBadge: "bg-red-400/30",
  },
  amber: {
    activeBg: "bg-amber-600 text-white shadow-lg",
    activeBadge: "bg-amber-400/30",
  },
};

export function Sidebar({
  mode,
  setMode,
  circularCount = 0,
  standaloneCount = 0,
  totalNodes = 0,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getModeIcon = (m: Mode) => {
    switch (m) {
      case "all":
        return <LayoutDashboard size={18} />;
      case "circular":
        return <RefreshCw size={18} />;
      case "standalone":
        return <FileText size={18} />;
    }
  };

  const getModeColor = (m: Mode): ColorKey => {
    switch (m) {
      case "all":
        return "pink";
      case "circular":
        return "red";
      case "standalone":
        return "amber";
    }
  };

  return (
    <div className="relative flex">
      {/* Sidebar - Collapses to icon bar instead of fully closing */}
      <div
        className={`
          h-screen bg-slate-900 text-white border-r border-slate-800
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? "w-72" : "w-16"}
        `}
      >
        {/* Expanded view */}
        <div
          className={`h-full flex flex-col transition-opacity duration-200 ${
            isExpanded ? "opacity-100 delay-100" : "opacity-0 hidden"
          }`}
        >
          {/* Header */}
          <div className="flex px-4 py-2 h-[4rem] items-center justify-between border-b border-slate-800">
            <div>
              <img src={Logo} alt="Logo" className="h-[2rem]" />
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="p-3 space-y-2 flex-1">
            {(["all", "circular", "standalone",'untracked', 'ignored'] as Mode[]).map((m) => {
              const count =
                m === "all"
                  ? totalNodes
                  : m === "circular"
                  ? circularCount
                  : standaloneCount;

              const color = getModeColor(m);
              const styles = modeStyles[color];

              const isActive = mode === m;

              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                  }}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm
                    transition-all duration-200 flex items-center justify-between
                    ${
                      isActive
                        ? styles.activeBg
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/70"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {getModeIcon(m)}
                    <span className="capitalize">{m}</span>
                  </span>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? styles.activeBadge
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-2">Legend</p>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Circle size={12} className="text-pink-600 fill-pink-600" />
                <span className="text-slate-300">Normal file</span>
              </div>

              <div className="flex items-center gap-2">
                <CircleDot size={12} className="text-red-600" />
                <span className="text-slate-300">
                  Circular dependency
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CircleOff size={12} className="text-amber-600" />
                <span className="text-slate-300">Standalone file</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Lightbulb size={12} />
                <span>Tip: Hover over nodes to see details</span>
              </p>
            </div>
          </div>
        </div>

        {/* Collapsed view - Icon bar */}
        <div
          className={`h-full flex flex-col items-center py-4 transition-opacity duration-200 ${
            !isExpanded ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-md hover:bg-slate-800 mb-4"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>

          {/* Mode icons */}
          <div className="flex flex-col gap-2">
            {(["all", "circular", "standalone","untracked","ignored"] as Mode[]).map((m) => {
              const isActive = mode === m;
              const color = getModeColor(m);
              const styles = modeStyles[color];

              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`
                    p-2 rounded-md transition-all duration-200 relative group
                    ${
                      isActive
                        ? styles.activeBg
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/70"
                    }
                  `}
                  title={m.charAt(0).toUpperCase() + m.slice(1)}
                >
                  {getModeIcon(m)}
                  
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}