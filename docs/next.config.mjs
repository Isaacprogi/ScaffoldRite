// import { createMDX } from "fumadocs-mdx/next";

// /** @type {import('next').NextConfig} */
// const config = {
//   reactStrictMode: true,

//   // IMPORTANT: required for GitHub Pages
//   output: "export",
//   trailingSlash: true,

//   // GitHub Pages base path (repo name)
//   basePath: "/scaffoldrite",
//   assetPrefix: "/scaffoldrite/",

//   images: {
//     // required for static export (no Next image optimization on GH Pages)
//     unoptimized: true,

//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "raw.githubusercontent.com",
//       },
//     ],
//   },
// };

// const withMDX = createMDX({
//   // optional:
//   // configPath: "source.config.ts",
// });

// export default withMDX(config);


import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX({
  // customize the config file path
  // configPath: "source.config.ts"
});

export default withMDX(config);