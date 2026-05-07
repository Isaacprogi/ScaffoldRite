export const mockData = {
  graph: {
    "src/index.ts": ["./utils/logger.ts", "./components/App.tsx"],
    "src/components/App.tsx": ["./Header.tsx", "./Sidebar.tsx", "./GraphView.tsx"],
    "src/components/Header.tsx": ["./utils/helpers.ts"],
    "src/components/Sidebar.tsx": ["./utils/helpers.ts", "./utils/storage.ts"],
    "src/components/GraphView.tsx": ["./utils/graphUtils.ts", "./utils/cytoscapeConfig.ts"],
    "src/utils/logger.ts": [],
    "src/utils/helpers.ts": ["./logger.ts"],
    "src/utils/storage.ts": ["./logger.ts", "./helpers.ts"],
    "src/utils/graphUtils.ts": ["./logger.ts", "./helpers.ts"],
    "src/utils/cytoscapeConfig.ts": [],
    "src/services/api.ts": ["./httpClient.ts", "./auth.ts"],
    "src/services/httpClient.ts": ["./utils/logger.ts"],
    "src/services/auth.ts": ["./httpClient.ts", "./utils/storage.ts"],
    "src/hooks/useGraph.ts": ["./services/api.ts", "./utils/helpers.ts"],
    "src/hooks/useAuth.ts": ["./services/auth.ts"],
    "src/pages/Dashboard.tsx": ["../components/Header.tsx", "../components/Sidebar.tsx", "../hooks/useGraph.ts"],
    "src/pages/Settings.tsx": ["../components/Header.tsx", "../hooks/useAuth.ts"],
    "src/pages/Profile.tsx": ["../components/Header.tsx", "../hooks/useAuth.ts"],
    "tests/index.test.ts": ["../src/index.ts"],
    "tests/components/Header.test.ts": ["../src/components/Header.tsx"],
    "tests/utils/helpers.test.ts": ["../src/utils/helpers.ts"],
    "scripts/build.js": [],
    "scripts/deploy.js": ["./build.js"],
    "config/webpack.common.js": [],
    "config/webpack.dev.js": ["./webpack.common.js"],
    "config/webpack.prod.js": ["./webpack.common.js"]
  },
  
  circular: [
    ["src/utils/helpers.ts", "src/utils/logger.ts", "src/utils/helpers.ts"],
    ["src/services/httpClient.ts", "src/services/auth.ts", "src/utils/storage.ts", "src/services/httpClient.ts"]
  ],
  
  standalone: [
    "src/utils/cytoscapeConfig.ts",
    "scripts/build.js",
    "config/webpack.common.js",
    "src/components/GraphView copy.tsx"
  ]
};