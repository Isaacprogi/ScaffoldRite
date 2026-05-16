import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { GraphView } from "./components/Graph";
import { ListView } from "./components/ListView";
import { mockData } from "../data";
import { useApp } from "./hooks/useApp";
import { useGraph } from "./hooks/useGraph";

export default function App() {
  const { data, refetch, loading } = useGraph() || mockData;
  const { displayMode, viewMode, dependencyMode, setDependencyMode } = useApp();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalNodes = Object.keys(data?.graph || {}).length;
  const circularCount = data?.circular?.length || 0;
  const standaloneCount = data?.standalone?.length || 0;
  const depsCount = totalNodes - standaloneCount;

  const cyRef = useRef<any>(null);

  const handleExport = () => {
    if (cyRef.current) {
      console.log("Exporting graph as PNG...");
      const pngData = cyRef.current.png({
        output: "blob",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `dependency-graph-${new Date().toISOString()}.png`;
      link.href = URL.createObjectURL(pngData);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const handleReload = async () => {
    console.log("Reloading graph data...");
    await refetch();
    window.location.reload();
  };

  useEffect(() => {
    console.log("Loading state changed:", loading);
  }, [loading]);
  

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-white">
        <div className="text-center px-4">
          <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Loading graph data...</p>
          <p className="text-xs text-slate-500 mt-2">
            Fetching from localhost:3210
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col font-outfit h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mode={dependencyMode}
          setMode={(mode) => setDependencyMode(mode)}
          circularCount={circularCount}
          standaloneCount={standaloneCount}
          totalNodes={totalNodes}
          depsCount={depsCount}
          onExport={handleExport}
          onReload={handleReload}
        />

        <div className="flex-1 overflow-hidden">
          <Header />

          {viewMode === "graph" ? (
            <div className={isMobile ? "touch-manipulation" : ""}>
              <GraphView
                cyRef={cyRef}
                data={data}
                displayMode={displayMode}
                mode={dependencyMode}
              />
            </div>
          ) : (
            <ListView
              data={data}
              mode={dependencyMode}
              displayMode={displayMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}