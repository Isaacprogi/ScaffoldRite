import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

type ServerData = {
  graph: Record<string, string[]>;
  circular: string[][];
  standalone: string[];
};

type Props = {
  data: ServerData;
  mode: "all" | "circular" | "standalone";
  displayMode?: "full" | "filename";
  cyRef: React.RefObject<any>;
};

export function GraphView({
  data,
  mode,
  cyRef,
  displayMode = "full",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { graph, circular, standalone } = data;
  const previousMode = useRef<string>(mode);
  const savedPositions = useRef<Record<string, { x: number; y: number }>>({});

  // -----------------------------
  // HELPERS
  // -----------------------------
  const isNodeInCircular = (fullPath: string): boolean =>
    circular.some((cycle) => cycle.includes(fullPath));

  const isNodeStandalone = (fullPath: string): boolean =>
    standalone.includes(fullPath);

  const getDisplayName = (fullPath: string): string =>
    displayMode === "filename"
      ? fullPath.split(/[/\\]/).pop() || fullPath
      : fullPath;

  const makeId = (str: string) =>
    "n_" + String(str).replace(/[^a-zA-Z0-9]/g, "_");

  // -----------------------------
  // GRAPH DATA PARSING
  // -----------------------------
  function convertToElements(graphData: Record<string, string[]>) {
    const nodes: any[] = [];
    const edges: any[] = [];
    const seen = new Set<string>();

    Object.keys(graphData).forEach((file) => {
      const fileId = makeId(file);

      if (!seen.has(fileId)) {
        seen.add(fileId);

        const inCirc = isNodeInCircular(file);
        const isStand = isNodeStandalone(file);

        nodes.push({
          data: {
            id: fileId,
            label: getDisplayName(file),
            fullPath: file,
            inCircular: inCirc,
            isStandalone: isStand,

            // ✅ DISTINCT COLORS HERE
           backgroundColor: inCirc
  ? "#dc2626" // 🔴 strong circular red
  : isStand
  ? "#f59e0b"
  : "#e94560",

            borderColor: inCirc
  ? "#7f1d1d" // deep red border for emphasis
  : isStand
  ? "#fde68a"
  : "#1e293b",
          },
        });
      }

      graphData[file]?.forEach((dep: string) => {
        const depId = makeId(dep);

        if (!seen.has(depId)) {
          seen.add(depId);

          const inCirc = isNodeInCircular(dep);
          const isStand = isNodeStandalone(dep);

          nodes.push({
            data: {
              id: depId,
              label: getDisplayName(dep),
              fullPath: dep,
              inCircular: inCirc,
              isStandalone: isStand,

              backgroundColor: inCirc
                ? "#8b5cf6"
                : isStand
                ? "#f59e0b"
                : "#e94560",

              borderColor: inCirc
                ? "#c4b5fd"
                : isStand
                ? "#fde68a"
                : "#1e293b",
            },
          });
        }

        edges.push({
          data: {
            id: `e_${fileId}_${depId}`,
            source: fileId,
            target: depId,
          },
        });
      });
    });

    return { nodes, edges };
  }

  // -----------------------------
  // CORE INITIALIZATION
  // -----------------------------
  useEffect(() => {
    if (!ref.current || !graph) return;

    const { nodes, edges } = convertToElements(graph);

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: ref.current,
      elements: { nodes, edges },
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(backgroundColor)",
            "border-color": "data(borderColor)",
            label: "data(label)",
            color: "#e4e4e4",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "11px",
            "font-family": "ui-monospace, monospace",
            width: 56,
            height: 56,
            "border-width": 2.5,
            "text-outline-color": "#1e1e1e",
            "text-outline-width": 2,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#404040",
            "target-arrow-color": "#404040",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.6,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        fit: true,
        padding: 60,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        randomize: true,
      },
    });

    const cy = cyRef.current;

    cy.ready(() => {
      cy.resize();
      cy.fit(undefined, 60);
      cy.center();
    });

    cy.on("layoutstop", () => {
      cy.nodes().forEach((n: any) => {
        savedPositions.current[n.id()] = n.position();
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      cy.resize();
      cy.fit(undefined, 60);
    });

    resizeObserver.observe(ref.current);

    filterNodesForMode(cy, mode);

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
    };
  }, [graph]);

  // -----------------------------
  // FILTERING LOGIC
  // -----------------------------
  const filterNodesForMode = (cy: any, currentMode: string) => {
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().forEach((node: any) => {
        const inCirc = node.data("inCircular");
        const isStand = node.data("isStandalone");

        let visible = true;
        if (currentMode === "circular") visible = inCirc;
        else if (currentMode === "standalone") visible = isStand;

        node.style({
          display: visible ? "element" : "none",
          opacity: visible ? 1 : 0,
        });
      });

      cy.edges().forEach((edge: any) => {
        const show =
          edge.source().style("display") !== "none" &&
          edge.target().style("display") !== "none";

        edge.style({
          display: show ? "element" : "none",
          opacity: show ? 0.6 : 0,
        });
      });
    });

    cy.animate(
      {
        fit: { eles: cy.elements(":visible"), padding: 60 },
      },
      { duration: 400 }
    );
  };

  // Mode change
  useEffect(() => {
    if (!cyRef.current || previousMode.current === mode) return;
    previousMode.current = mode;
    filterNodesForMode(cyRef.current, mode);
  }, [mode]);

  // Label update
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.batch(() => {
      cyRef.current.nodes().forEach((n: any) => {
        n.data("label", getDisplayName(n.data("fullPath")));
      });
    });
  }, [displayMode]);

  // Tooltip
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    const handleMouseOver = (e: any) => {
      const node = e.target;

      const tooltip = document.createElement("div");
      tooltip.id = "cy-tooltip";

      tooltip.innerHTML = `
        <div style="font-family: ui-monospace, monospace; font-size: 11px;">
          <div style="font-weight:600; color:#e4e4e4;">${node.data("label")}</div>
          <div style="color:#a1a1aa; font-size:10px;">${node.data("fullPath")}</div>
          ${
            node.data("inCircular")
              ? '<div style="color:#a78bfa; margin-top:4px;">⚠️ Circular</div>'
              : ""
          }
        </div>
      `;

      tooltip.style.cssText =
        "position:fixed; background:#2d2d2d; color:#fff; padding:8px; border-radius:4px; pointer-events:none; z-index:9999; border:1px solid #444;";

      document.body.appendChild(tooltip);

      const move = (me: MouseEvent) => {
        tooltip.style.left = me.clientX + 15 + "px";
        tooltip.style.top = me.clientY - 15 + "px";
      };

      window.addEventListener("mousemove", move);

      node.once("mouseout", () => {
        tooltip.remove();
        window.removeEventListener("mousemove", move);
      });
    };

    cy.on("mouseover", "node", handleMouseOver);

    return () => {
      cy.off("mouseover", "node", handleMouseOver);
    };
  }, [graph]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "calc(100vh - 4rem)",
        background: "#1e1e1e",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
      }}
    />
  );
}