// src/components/Sidebar.tsx
import { useState, useEffect } from "react";
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
  ChevronRight,
  // Database,
  Settings,
  HelpCircle,
  // Search,
  // Plus,
  Sparkles,
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
    hoverBg: string;
  }
> = {
  pink: {
    activeBg: "bg-pink-500/10 text-pink-400 border-l-pink-500",
    activeBadge: "bg-pink-500/20 text-pink-300",
    hoverBg: "hover:bg-white/5",
  },
  red: {
    activeBg: "bg-red-500/10 text-red-400 border-l-red-500",
    activeBadge: "bg-red-500/20 text-red-300",
    hoverBg: "hover:bg-white/5",
  },
  amber: {
    activeBg: "bg-amber-500/10 text-amber-400 border-l-amber-500",
    activeBadge: "bg-amber-500/20 text-amber-300",
    hoverBg: "hover:bg-white/5",
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  // const [searchQuery, setSearchQuery] = useState("");

  // n8n-inspired keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        setIsExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  // const menuItems = [
    // { id: "workspace", label: "Workspace", icon: Database, badge: "NEW" },
    // { id: "settings", label: "Settings", icon: Settings },
    // { id: "help", label: "Help & Resources", icon: HelpCircle },
  // ];

  return (
    <div className="relative flex">
      {/* Sidebar - Notion-inspired minimal design with n8n-style interactions */}
      <div
        className={`
          h-screen bg-[#1e1e1e] text-[#e4e4e4] border-r border-[#2d2d2d]
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? "w-80" : "w-12"}
        `}
      >
        {/* Expanded view */}
        <div
          className={`h-full flex flex-col transition-opacity duration-200 ${
            isExpanded ? "opacity-100 delay-100" : "opacity-0 hidden"
          }`}
        >
          {/* Header - Notion style */}
          <div className="flex px-3 py-3 h-[4rem] items-center justify-between border-b border-[#2d2d2d]">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="Logo" className="h-[1.8rem] opacity-90" />
              <span className="text-sm font-medium text-[#e4e4e4] tracking-tight">Scaffoldrite</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[#808080] hover:text-[#e4e4e4] transition-colors p-1 rounded hover:bg-white/5"
                aria-label="Collapse sidebar"
                title="Collapse (Ctrl+B)"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>

          {/* Quick Actions - n8n style */}
          {/* <div className="px-3 py-3 border-b border-[#2d2d2d]">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors text-sm text-[#e4e4e4] group">
              <Plus size={16} className="text-[#808080] group-hover:text-[#e4e4e4]" />
              <span>Quick Add</span>
              <span className="ml-auto text-xs text-[#808080]">⌘N</span>
            </button>
          </div> */}

          {/* Search - Notion style */}
          {/* <div className="px-3 py-3 border-b border-[#2d2d2d]">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#808080]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2d2d2d] text-sm text-[#e4e4e4] pl-7 pr-2 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500/50 placeholder-[#808080]"
              />
            </div>
          </div> */}

          {/* Mode Selection - n8n workflow style */}
          <div className="px-2 py-3 flex-1">
            <div className="mb-2 px-2">
              <span className="text-[10px] font-semibold text-[#808080] uppercase tracking-wider">Views</span>
            </div>
            
            {(["all","deps", "circular", "standalone"] as Mode[]).map((m) => {
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
                  onClick={() => setMode(m)}
                  onMouseEnter={() => setHoveredItem(m)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full text-left px-3 mt-1 py-2 rounded-md text-sm
                    transition-all duration-150 flex items-center justify-between
                    border-l-2 border-transparent
                    ${isActive ? styles.activeBg : `text-[#b4b4b4] ${styles.hoverBg}`}
                  `}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={isActive ? "text-current" : "text-[#808080]"}>
                      {getModeIcon(m)}
                    </span>
                    <span className="capitalize text-[13px]">{m}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {hoveredItem === m && !isActive && (
                      <ChevronRight size={12} className="text-[#808080]" />
                    )}
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded min-w-[28px] text-center
                        ${isActive ? styles.activeBadge : "bg-white/5 text-[#b4b4b4]"}
                      `}
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Menu - Notion style */}
          {/* <div className="px-2 py-2 border-t border-[#2d2d2d]">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-1.5 rounded-md text-sm text-[#b4b4b4] hover:bg-white/5 transition-all duration-150 flex items-center justify-between group"
              >
                <span className="flex items-center gap-2.5">
                  <item.icon size={16} className="text-[#808080] group-hover:text-[#e4e4e4]" />
                  <span className="text-[13px]">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div> */}

          {/* Legend - Clean minimal design */}
          <div className="p-3 border-t border-[#2d2d2d]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[#808080] uppercase tracking-wider">Legend</p>
              <Sparkles size={12} className="text-[#808080]" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2.5 text-[#b4b4b4]">
                <Circle size={12} className="text-pink-500 fill-pink-500/20" />
                <span className="text-[11px]">Normal file</span>
              </div>

              <div className="flex items-center gap-2.5 text-[#b4b4b4]">
                <CircleDot size={12} className="text-red-500" />
                <span className="text-[11px]">Circular dependency</span>
              </div>

              <div className="flex items-center gap-2.5 text-[#b4b4b4]">
                <CircleOff size={12} className="text-amber-500" />
                <span className="text-[11px]">Standalone file</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#2d2d2d]">
              <p className="text-[10px] text-[#808080] flex items-center gap-1.5">
                <Lightbulb size={10} />
                <span>Hover nodes for details • ⌘K for commands</span>
              </p>
            </div>
          </div>
        </div>

        {/* Collapsed view - n8n style compact bar */}
        <div
          className={`h-full flex flex-col items-center py-3 transition-opacity duration-200 ${
            !isExpanded ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[#808080] hover:text-[#e4e4e4] transition-colors p-2 rounded-md hover:bg-white/5 mb-2"
            aria-label="Expand sidebar"
            title="Expand (Ctrl+B)"
          >
            <PanelLeftOpen size={18} />
          </button>

          {/* Mode icons */}
          <div className="flex flex-col gap-1 mt-2">
            {(["all", "circular", "standalone"] as Mode[]).map((m) => {
              const isActive = mode === m;
              const color = getModeColor(m);
              const styles = modeStyles[color];

              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`
                    p-2 rounded-md transition-all duration-150 relative group
                    ${isActive ? styles.activeBg : "text-[#808080] hover:bg-white/5"}
                  `}
                  title={m.charAt(0).toUpperCase() + m.slice(1)}
                >
                  {getModeIcon(m)}
                  
                  {/* n8n-style tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-[#e4e4e4] text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#3d3d3d]">
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom icons */}
          <div className="mt-auto flex flex-col gap-1">
            <button className="p-2 rounded-md text-[#808080] hover:bg-white/5 transition-colors relative group">
              <Settings size={18} />
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-[#e4e4e4] text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#3d3d3d]">
                Settings
              </span>
            </button>
            <button className="p-2 rounded-md text-[#808080] hover:bg-white/5 transition-colors relative group">
              <HelpCircle size={18} />
              <span className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] text-[#e4e4e4] text-[11px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#3d3d3d]">
                Help
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}