// server.ts
const http = require("http");
const fs = require("fs");
const path = require("path");

export function getHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
<title>Dependency Graph</title>
<script src="/cytoscape.min.js"></script>
<script src="/graph-client.js"></script>
<style>
body { margin:0; font-family:sans-serif; background:#1a1a2e; }
#cy { width:100vw; height:100vh; display:block; }
</style>
</head>
<body>
<div id="cy"></div>
</body>
</html>
`;
}

const CLIENT_JS = `
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/graph');
    const graphData = await response.json();
    
    // Convert to Cytoscape format if needed
    const elements = convertToElements(graphData);
    
    const cy = cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#e94560',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 60,
            'height': 60,
            'font-size': '11px',
            'font-family': 'sans-serif',
            'border-width': 2,
            'border-color': '#0f3460'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#4a5568',
            'target-arrow-color': '#4a5568',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#00d9ff',
            'line-color': '#00d9ff',
            'target-arrow-color': '#00d9ff'
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.2
          }
        }
      ],
      layout: {
        name: 'cose',
        padding: 50,
        nodeRepulsion: 4500,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000
      }
    });

    let lockedNode = null;
    
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (lockedNode === node) {
        cy.elements().removeClass('dimmed highlighted');
        lockedNode = null;
      } else {
        lockedNode = node;
        const neighborhood = node.neighborhood().add(node);
        cy.elements().addClass('dimmed');
        neighborhood.removeClass('dimmed').addClass('highlighted');
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('dimmed highlighted');
        lockedNode = null;
      }
    });

    cy.on('dbltap', 'node', (evt) => {
      cy.animate({
        fit: { eles: evt.target, padding: 100 },
        duration: 300
      });
    });

    cy.on('mouseover', 'node', () => document.body.style.cursor = 'pointer');
    cy.on('mouseout', 'node', () => document.body.style.cursor = 'default');

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        cy.fit(cy.elements(), 50);
      }
      if (e.key === 'r' || e.key === 'R') {
        cy.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
      }
      if (e.key === 'Escape') {
        cy.elements().removeClass('dimmed highlighted');
        lockedNode = null;
      }
    });

    cy.fit(cy.elements(), 50);
    
  } catch (err) {
    console.error('Failed to load graph:', err);
    document.getElementById('cy').innerHTML = '<div style="color:#e94560; padding:40px; text-align:center;">Failed to load graph</div>';
  }
});

// Convert your graph format to Cytoscape elements
function convertToElements(graph) {
  // If already in Cytoscape format, return as-is
  if (graph.nodes && Array.isArray(graph.nodes) && graph.edges && Array.isArray(graph.edges)) {
    return graph;
  }
  
  // If it's a flat array, assume it's nodes
  if (Array.isArray(graph)) {
    return { nodes: graph.map((n, i) => ({ data: { id: n.id || 'n' + i, label: n.label || n.id || String(n) } })), edges: [] };
  }
  
  // If it's an object with file dependencies: { "fileA": ["dep1", "dep2"] }
  const nodes = [];
  const edges = [];
  const seen = new Set();
  
  const makeId = (str) => 'n_' + String(str).replace(/[^a-zA-Z0-9]/g, '_');
  
  Object.keys(graph).forEach((file) => {
    const fileId = makeId(file);
    if (!seen.has(fileId)) {
      seen.add(fileId);
      nodes.push({
        data: {
          id: fileId,
          label: file.split('/').pop() || file,
          fullPath: file
        }
      });
    }
    
    if (Array.isArray(graph[file])) {
      graph[file].forEach((dep) => {
        const depId = makeId(dep);
        if (!seen.has(depId)) {
          seen.add(depId);
          nodes.push({
            data: {
              id: depId,
              label: String(dep).split('/').pop() || dep,
              fullPath: dep
            }
          });
        }
        
        edges.push({
          data: {
            id: 'e_' + fileId + '_' + depId,
            source: fileId,
            target: depId
          }
        });
      });
    }
  });
  
  return { nodes, edges };
}
`;


import { findStandaloneFiles, detectCircular, buildDependencyGraph } from "./deps";
import { baseDir } from "../../lib/utils";
import { getIgnoreList } from "../../lib/utils";

export function startServer(
  graph: any,
  circular: string[][],
  standalone: string[],
  port = 3210
) {
  const distPath = path.resolve(__dirname, "../../../src/front/dist");

  console.log("========== SERVER DEBUG ==========");
  console.log("__dirname:", __dirname);
  console.log("distPath:", distPath);
  console.log("dist exists:", fs.existsSync(distPath));

  const indexPathCheck = path.join(distPath, "index.html");
  console.log("index.html path:", indexPathCheck);
  console.log("index exists:", fs.existsSync(indexPathCheck));
  console.log("==================================");

  const server = http.createServer((req: any, res: any) => {
    console.log("\n--- Incoming Request ---");
    console.log("URL:", req.url);

    // 1. API - Return all data
    if (req.url === "/graph") {
      console.log("Serving /graph API");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        graph,
        circular,
        standalone
      }));
      return;
    }

    if (req.url === "/reload") {
      const targetDir = path.resolve(baseDir);
      const ignoreList = getIgnoreList();
      graph = buildDependencyGraph(targetDir, ignoreList);
      circular = detectCircular(graph);
      standalone = findStandaloneFiles(graph);

      res.writeHead(200);
      res.end("reloaded");
      return;
    }

    const cleanUrl = req.url?.split("?")[0] || "/";
    console.log("Clean URL:", cleanUrl);

    let filePath = path.join(
      distPath,
      cleanUrl === "/" ? "index.html" : cleanUrl
    );

    console.log("Resolved filePath:", filePath);
    console.log("File exists:", fs.existsSync(filePath));

    // 2. Serve static files
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);

      const contentType =
        ext === ".js"
          ? "application/javascript"
          : ext === ".css"
            ? "text/css"
            : ext === ".html"
              ? "text/html"
              : "application/octet-stream";

      console.log("Serving file:", filePath);
      console.log("Content-Type:", contentType);

      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 3. SPA fallback
    const indexPath = path.join(distPath, "index.html");
    console.log("Fallback to index.html:", indexPath);
    console.log("Fallback exists:", fs.existsSync(indexPath));

    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }

    console.log("❌ 404 - File not found");
    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {
    console.log("\n🚀 Running on http://localhost:" + port);
    console.log(`📊 Graph data: ${Object.keys(graph).length} nodes`);
    console.log(`🔄 Circular chains: ${circular.length}`);
    console.log(`📄 Standalone files: ${standalone.length}`);
  });
}