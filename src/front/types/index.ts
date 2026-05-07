// src/types/graph.ts
export type GraphNode = {
  data: {
    id: string;
    label: string;
    fullPath?: string;
  };
};

export type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
  };
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};