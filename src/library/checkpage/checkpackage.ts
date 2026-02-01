// ./checkpage/checkpackage.ts
import fs from "fs";
import path from "path";
import depcheck from "depcheck";
import { theme, icons } from "../../data";

const TS_TYPE_REGEX = /^@types\//;

export async function checkAndReportPackages(): Promise<void> {
  console.log(theme.primary.bold(`${icons.folder} Checking project dependencies...\n`));

  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(theme.error(`${icons.error} package.json was not found in current directory.`));
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missingDeps: string[] = [];

  // 1️⃣ Check runtime-resolvable deps
  for (const dep of Object.keys(allDeps)) {
    try {
      require.resolve(dep);
    } catch {
      missingDeps.push(dep);
    }
  }

  // 2️⃣ Run depcheck to catch imported-but-not-listed packages
  const options = { ignoreDirs: ["dist", "build", "node_modules"] };
  const result = await depcheck(process.cwd(), options);

  // Combine depcheck missing deps (filter duplicates)
  const depcheckMissing = Object.keys(result.missing || {}).filter(
    (dep) => !missingDeps.includes(dep)
  );
  const finalMissing = [...missingDeps, ...depcheckMissing];

  if (finalMissing.length === 0) {
    console.log(theme.success.bold(`${icons.check} All packages are installed!`));
    return;
  }

  // Separate runtime deps vs TypeScript types
  const runtimeDeps: string[] = [];
  const typeDeps: string[] = [];

  finalMissing.forEach((pkg) => {
    if (TS_TYPE_REGEX.test(pkg)) typeDeps.push(pkg);
    else runtimeDeps.push(pkg);
  });

  console.log(theme.error.bold(`${icons.error} Missing packages:`));

  runtimeDeps.forEach((pkg) => console.log(theme.warning(`  - ${pkg} (runtime)`)));
  typeDeps.forEach((pkg) => console.log(theme.warning(`  - ${pkg} (TypeScript type)`)));

  console.log(); // newline

  if (runtimeDeps.length)
    console.log(theme.info(`Install runtime packages: npm install ${runtimeDeps.join(" ")}`));

  if (typeDeps.length)
    console.log(theme.info(`Install TypeScript types as dev deps: npm install -D ${typeDeps.join(" ")}`));
}
