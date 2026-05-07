// src/components/Graph.tsx
import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

type ServerData = {
  graph: Record<string, string[]>;  // This matches what your server returns
  circular: string[][];
  standalone: string[];
};

type Props = {
  data: ServerData;
  mode: "all" | "circular" | "standalone";
  displayMode?: "full" | "filename";
  cyRef: React.RefObject<any>;
};

export function GraphView({ data, mode, cyRef, displayMode = "full" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { graph, circular, standalone } = data;
  
  // Track previous mode to avoid unnecessary layout re-runs
  const previousMode = useRef<string>(mode);
  const isInitialLayout = useRef<boolean>(true);

  // Helper to check if a node is part of circular dependencies
  const isNodeInCircular = (fullPath: string): boolean => {
    return circular.some(cycle => cycle.includes(fullPath));
  };

  // Helper to check if a node is standalone
  const isNodeStandalone = (fullPath: string): boolean => {
    return standalone.includes(fullPath);
  };

  // Helper to get display name based on mode
  const getDisplayName = (fullPath: string): string => {
    if (displayMode === "filename") {
      return fullPath.split(/[/\\]/).pop() || fullPath;
    }
    return fullPath;
  };

  // 🔥 Convert backend graph → Cytoscape format with metadata
  function convertToElements(graph: Record<string, string[]>) {
    const nodes: any[] = [];
    const edges: any[] = [];
    const seen = new Set<string>();

    const makeId = (str: string) =>
      "n_" + String(str).replace(/[^a-zA-Z0-9]/g, "_");

    Object.keys(graph).forEach((file) => {
      const fileId = makeId(file);
      const inCircular = isNodeInCircular(file);
      const isStandaloneNode = isNodeStandalone(file);

      if (!seen.has(fileId)) {
        seen.add(fileId);
        
        // Determine node styling based on metadata
        let backgroundColor = "#e94560"; // default
        let borderColor = "#1e293b";
        
        if (inCircular) {
          backgroundColor = "#dc2626"; // red for circular dependencies
          borderColor = "#fca5a5";
        } else if (isStandaloneNode) {
          backgroundColor = "#f59e0b"; // amber/yellow for standalone files
          borderColor = "#fcd34d";
        }
        
        nodes.push({
          data: {
            id: fileId,
            label: getDisplayName(file),
            fullPath: file,
            inCircular,
            isStandalone: isStandaloneNode
          },
          style: {
            "background-color": backgroundColor,
            "border-color": borderColor
          }
        });
      }

      if (Array.isArray(graph[file])) {
        graph[file].forEach((dep: string) => {
          const depId = makeId(dep);
          const depInCircular = isNodeInCircular(dep);
          const depIsStandalone = isNodeStandalone(dep);

          if (!seen.has(depId)) {
            seen.add(depId);
            
            let depBgColor = "#e94560";
            let depBorderColor = "#1e293b";
            
            if (depInCircular) {
              depBgColor = "#dc2626";
              depBorderColor = "#fca5a5";
            } else if (depIsStandalone) {
              depBgColor = "#f59e0b";
              depBorderColor = "#fcd34d";
            }
            
            nodes.push({
              data: {
                id: depId,
                label: getDisplayName(dep),
                fullPath: dep,
                inCircular: depInCircular,
                isStandalone: depIsStandalone
              },
              style: {
                "background-color": depBgColor,
                "border-color": depBorderColor
              }
            });
          }

          edges.push({
            data: {
              id: `e_${fileId}_${depId}`,
              source: fileId,
              target: depId
            }
          });
        });
      }
    });

    return { nodes, edges };
  }

  // Filter nodes based on current mode
  const filterNodesForMode = (cy: any, currentMode: string) => {
    cy.nodes().forEach((node: any) => {
      const nodeData = node.data();
      const inCircular = nodeData.inCircular;
      const isStandalone = nodeData.isStandalone;
      
      switch(currentMode) {
        case "circular":
          // Show only nodes involved in circular dependencies
          if (inCircular) {
            node.show();
          } else {
            node.hide();
          }
          break;
        case "standalone":
          // Show only standalone nodes
          if (isStandalone) {
            node.show();
          } else {
            node.hide();
          }
          break;
        case "all":
        default:
          node.show();
          break;
      }
    });
    
    // Hide edges where source or target is hidden
    cy.edges().forEach((edge: any) => {
      const sourceVisible = edge.source().visible();
      const targetVisible = edge.target().visible();
      if (sourceVisible && targetVisible) {
        edge.show();
      } else {
        edge.hide();
      }
    });
  };

  // 🔵 INIT GRAPH
  useEffect(() => {
    if (!ref.current || !graph) return;

    const { nodes, edges } = convertToElements(graph);

    cyRef.current = cytoscape({
      container: ref.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(backgroundColor)",
            label: "data(label)",
            color: "#fff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "12px",
            width: 60,
            height: 60,
            "border-width": 2,
            "border-color": "data(borderColor)",
            "background-opacity": 0.9,
            "text-outline-color": "#0f172a",
            "text-outline-width": 2,
            "transition-property": "background-color, border-color, width, height",
          }
        },
        {
          selector: "node:hover",
          style: {
            "background-color": "#f43f5e",
            "border-color": "#cbd5e1",
            width: 68,
            height: 68,
            "font-size": "13px"
          }
        },
        {
          selector: 'node[inCircular = "true"]',
          style: {
            "background-color": "#dc2626",
            "border-color": "#fca5a5",
            "border-width": 3
          }
        },
        {
          selector: 'node[isStandalone = "true"]',
          style: {
            "background-color": "#f59e0b",
            "border-color": "#fcd34d",
            "border-width": 3
          }
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#334155",
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.7,
            "transition-property": "line-color, opacity",
          }
        },
        {
          selector: "edge:hover",
          style: {
            "line-color": "#e94560",
            "target-arrow-color": "#e94560",
            width: 3,
            opacity: 1
          }
        }
      ],
      layout: {
        name: "cose",
        padding: 50,
        nodeRepulsion: 4500,
        edgeElasticity: 100,
        gravity: 80,
        numIter: 800,
        animate: true,
        animationDuration: 500
      }
    });

    // Add tooltip functionality to show full path on hover
    cyRef.current.on('mouseover', 'node', (event: any) => {
      const node = event.target;
      const fullPath = node.data('fullPath');
      const tooltip = document.createElement('div');
      tooltip.className = 'cytoscape-tooltip';
      tooltip.textContent = fullPath;
      tooltip.style.cssText = `
        position: fixed;
        background: #1e293b;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        pointer-events: none;
        z-index: 1000;
        border: 1px solid #475569;
        white-space: nowrap;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
      `;
      document.body.appendChild(tooltip);
      
      const updateTooltipPosition = (e: MouseEvent) => {
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.top = (e.clientY - 30) + 'px';
      };
      
      const onMouseMove = (e: MouseEvent) => updateTooltipPosition(e);
      window.addEventListener('mousemove', onMouseMove);
      
      node.once('mouseout', () => {
        tooltip.remove();
        window.removeEventListener('mousemove', onMouseMove);
      });
    });

    // Apply initial mode filtering
    filterNodesForMode(cyRef.current, mode);
    
    // Mark initial layout as done
    isInitialLayout.current = false;

    return () => cyRef.current?.destroy();
  }, [graph, circular, standalone]);

  // 🔵 MODE SWITCHING - Only change layout and visibility, not full rerender
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    // Check if mode actually changed
    const modeChanged = previousMode.current !== mode;
    if (!modeChanged) return;
    
    // Update previous mode ref
    previousMode.current = mode;
    
    // Filter nodes based on mode
    filterNodesForMode(cy, mode);

    // Apply appropriate layout based on mode
    if (mode === "circular" && circular.length > 0) {
      cy.layout({ 
        name: "circle", 
        animate: true, 
        animationDuration: 500,
        radius: 250,
        fit: true,
        padding: 50
      }).run();
    } else if (mode === "standalone" && standalone.length > 0) {
      cy.layout({ 
        name: "grid", 
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
        rows: Math.ceil(Math.sqrt(standalone.length))
      }).run();
    } else if (mode === "all") {
      // Only run cose layout if we're coming from a different mode
      // This prevents re-running layout when already in "all" mode
      cy.layout({ 
        name: "cose", 
        animate: true, 
        animationDuration: 500,
        nodeRepulsion: 4500,
        gravity: 80,
        fit: true
      }).run();
    }
  }, [mode, circular.length, standalone.length]);

  // 🔵 DISPLAY MODE CHANGE - Update node labels without rebuilding the graph
  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    // Update all node labels
    cy.nodes().forEach((node: any) => {
      const fullPath = node.data('fullPath');
      const newLabel = getDisplayName(fullPath);
      node.data('label', newLabel);
    });
    
    // Force style update to refresh the display
    cy.style().update();
  }, [displayMode]);

  return (
    <div 
      ref={ref} 
      className="flex-1 w-full h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 to-slate-800"
    />
  );
}