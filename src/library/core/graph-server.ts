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

export function startServer(graph: any, port: number = 3210) {
  const server = http.createServer((req: any, res: any) => {
    if (req.url === "/graph") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(graph));
      return;
    }

    if (req.url === "/cytoscape.min.js") {
      const cyPath = require.resolve('cytoscape/dist/cytoscape.min.js');
      res.writeHead(200, { "Content-Type": "application/javascript" });
      fs.createReadStream(cyPath).pipe(res);
      return;
    }

    if (req.url === "/graph-client.js") {
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(CLIENT_JS);
      return;
    }

    if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(getHTML());
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {
    console.log("Server: http://localhost:" + port);
  });
}