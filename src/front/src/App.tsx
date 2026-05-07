// src/App.tsx
import { useState, useRef, useEffect } from "react";
import { useGraph } from "./hooks/useGraph";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { GraphView } from "./components/Graph";
import { ListView } from "./components/ListView";
import {mockData} from '../data'

type DependencyMode = "all" | "circular" | "standalone";
type ViewMode = "graph" | "list";
type DisplayMode = "full" | "filename";

export default function App() {
//   const { data, refetch, loading } = useGraph() || mockData ; // ✅ added loading
const loading = false
const data = mockData

const refetch = () => {
    
}

  const [dependencyMode, setDependencyMode] = useState<DependencyMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");

  const cyRef = useRef<any>(null);

  const handleExport = () => {
    if (cyRef.current) {
      console.log("Exporting graph as PNG...");

      const pngData = cyRef.current.png({
        output: 'blob',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `dependency-graph-${new Date().toISOString()}.png`;
      link.href = URL.createObjectURL(pngData);
      link.click();

      URL.revokeObjectURL(link.href);
    }
  };

  // ✅ reload uses refetch (no page refresh)
  const handleReload = async () => {
    console.log("Reloading graph data...");
    // await refetch();
     window.location.reload(); // simplest + reliable
  };

  useEffect(()=>{
   console.log("Loading state changed:", loading);
  },[loading])

  // ✅ INITIAL LOADING STATE
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p>Loading graph data...</p>
          <p className="text-xs text-slate-500 mt-2">
            Fetching from localhost:3210/graph
          </p>
        </div>
      </div>
    );
  }

  // optional safety fallback
  if (!data) return null;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">

        <Sidebar 
          mode={dependencyMode} 
          setMode={setDependencyMode}
          circularCount={data.circular?.length || 0}
          standaloneCount={data.standalone?.length || 0}
          totalNodes={Object.keys(data.graph || {}).length}
        />

        <div className="flex-1 overflow-hidden">

          <Header 
            viewMode={viewMode} 
            setViewMode={setViewMode}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onExport={handleExport}
            onReload={handleReload}
          />

          {viewMode === "graph" ? (
            <GraphView 
              cyRef={cyRef} 
              data={data} 
              displayMode={displayMode} 
              mode={dependencyMode} 
            />
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