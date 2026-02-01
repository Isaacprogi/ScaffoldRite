// ./checkpage/checkpackage.ts
import fs from "fs";
import path from "path";
import depcheck from "depcheck";
import fetch from "node-fetch";
import { theme, icons } from "../../data";

const TS_TYPE_REGEX = /^@types\//;

/**
 * Checks if a package exists on npm
 */
async function isPackageValidOnNpm(pkg: string): Promise<boolean> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkAndReportPackages(): Promise<void> {
  const validateFlag = process.argv.includes("--validate");

  console.log(theme.primary.bold(`${icons.folder} Checking project dependencies...\n`));

  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(theme.error(`${icons.error} package.json not found in current directory.`));
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missingDeps: string[] = [];

  // 1️⃣ Check runtime-resolvable deps
  for (const dep of Object.keys(allDeps)) {
    if (TS_TYPE_REGEX.test(dep)) continue; // skip TypeScript types
    try {
      require.resolve(dep);
    } catch {
      missingDeps.push(dep);
    }
  }

  // 2️⃣ Run depcheck to catch imported-but-not-listed packages
  const options = { ignoreDirs: ["dist", "build", "node_modules"] };
  const result = await depcheck(process.cwd(), options);

  const depcheckMissing = Object.keys(result.missing || {}).filter(
    (dep) => !missingDeps.includes(dep)
  );

  const finalMissing = [...missingDeps, ...depcheckMissing];

  if (finalMissing.length === 0) {
    console.log(theme.success.bold(`${icons.check} All packages are installed!`));
    return;
  }

  console.log(theme.error.bold(`${icons.error} Missing packages:`));
  finalMissing.forEach((pkg) => console.log(theme.warning(`  - ${pkg}`)));

  // 3️⃣ Validate missing packages on npm (if flag provided)
  if (validateFlag) {
    console.log("\n" + theme.info("Validating missing packages on npm..."));
    const validationResults = await Promise.all(
      finalMissing.map(async (pkg) => {
        const valid = await isPackageValidOnNpm(pkg);
        return { pkg, valid };
      })
    );

    validationResults.forEach(({ pkg, valid }) => {
      if (valid) {
        console.log(theme.success(`✔ ${pkg} exists on npm`));
      } else {
        console.log(theme.error(`✗ ${pkg} does NOT exist on npm`));
      }
    });
  }

  console.log("\n" + theme.info(`Run: npm install ${finalMissing.join(" ")}`));
}
