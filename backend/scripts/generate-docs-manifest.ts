/**
 * Scans Express route files and app mounts → docs/.generated/api-manifest.json
 * Run: npm run docs:manifest
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(backendRoot, "src");
const outDir = path.join(backendRoot, "docs", ".generated");
const outFile = path.join(outDir, "api-manifest.json");

type RouteEntry = {
  method: string;
  path: string;
  fullPath: string;
  module: string;
  sourceFile: string;
};

const MOUNT_RE =
  /app\.use\(\s*["'](\/api\/[^"']+)["']\s*,\s*(\w+)\s*\)/g;
const ROUTE_RE =
  /(\w+Router)\.(get|post|patch|put|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gi;

/** Map router variable prefix → module slug (matches docs/api/<slug>.md). */
const ROUTER_MODULE: Record<string, string> = {
  auth: "auth",
  profile: "profile",
  dining: "dining",
  admission: "admission",
  inventory: "inventory",
  finance: "finance",
  notifications: "notifications",
};

function routerVarToModule(routerVar: string): string | undefined {
  const key = routerVar.replace(/Router$/i, "").toLowerCase();
  return ROUTER_MODULE[key];
}

async function listRouteFiles(): Promise<string[]> {
  const modulesDir = path.join(srcRoot, "modules");
  const entries = await readdir(modulesDir, { withFileTypes: true });
  const files: string[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const dir = path.join(modulesDir, ent.name);
    const inner = await readdir(dir);
    for (const name of inner) {
      if (name.endsWith(".routes.ts") || name.endsWith(".route.ts")) {
        files.push(path.join(dir, name));
      }
    }
  }

  return files.sort();
}

function parseMounts(appSource: string): Map<string, string> {
  const routerToMount = new Map<string, string>();
  let m: RegExpExecArray | null;
  MOUNT_RE.lastIndex = 0;
  while ((m = MOUNT_RE.exec(appSource)) !== null) {
    const mount = m[1];
    const routerVar = m[2];
    routerToMount.set(routerVar, mount);
  }
  return routerToMount;
}

function parseRoutesInFile(
  filePath: string,
  content: string,
  routerToMount: Map<string, string>
): RouteEntry[] {
  const routes: RouteEntry[] = [];
  const relSource = path.relative(backendRoot, filePath).replace(/\\/g, "/");
  let m: RegExpExecArray | null;

  ROUTE_RE.lastIndex = 0;
  while ((m = ROUTE_RE.exec(content)) !== null) {
    const routerVar = m[1];
    const method = m[2].toUpperCase();
    const routePath = m[3];
    const module = routerVarToModule(routerVar);
    if (!module) continue;

    const mount =
      routerToMount.get(routerVar) ??
      `/api/${module === "profile" ? "profile" : module}`;
    const fullPath =
      mount.replace(/\/$/, "") +
      (routePath.startsWith("/") ? routePath : `/${routePath}`);

    routes.push({
      method,
      path: routePath,
      fullPath,
      module,
      sourceFile: relSource,
    });
  }

  return routes;
}

async function collectEnvKeys(): Promise<string[]> {
  const keys = new Set<string>();
  const envRe = /process\.env\.([A-Z0-9_]+)/g;

  async function scanFile(filePath: string) {
    const content = await readFile(filePath, "utf8");
    let m: RegExpExecArray | null;
    envRe.lastIndex = 0;
    while ((m = envRe.exec(content)) !== null) {
      keys.add(m[1]);
    }
  }

  await scanFile(path.join(srcRoot, "Constants.ts"));
  await scanFile(path.join(srcRoot, "app.ts"));
  await scanFile(path.join(srcRoot, "db", "index.ts"));

  const utilsDir = path.join(srcRoot, "utils");
  for (const name of await readdir(utilsDir)) {
    if (name.endsWith(".ts")) {
      await scanFile(path.join(utilsDir, name));
    }
  }

  return [...keys].sort();
}

async function main() {
  const appPath = path.join(srcRoot, "app.ts");
  const appSource = await readFile(appPath, "utf8");
  const routerToMount = parseMounts(appSource);

  const allRoutes: RouteEntry[] = [];
  for (const filePath of await listRouteFiles()) {
    const content = await readFile(filePath, "utf8");
    allRoutes.push(...parseRoutesInFile(filePath, content, routerToMount));
  }

  allRoutes.sort((a, b) =>
    a.module.localeCompare(b.module) ||
    a.path.localeCompare(b.path) ||
    a.method.localeCompare(b.method)
  );

  const mounts = [...routerToMount.entries()].map(([routerVar, mount]) => ({
    routerVar,
    mount,
    module: routerVarToModule(routerVar) ?? null,
  }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: "scripts/generate-docs-manifest.ts",
    mounts,
    routeCount: allRoutes.length,
    routes: allRoutes,
    environmentVariables: await collectEnvKeys(),
    docFiles: {
      index: "docs/README.md",
      apiByModule: Object.fromEntries(
        Object.values(ROUTER_MODULE).map((mod) => [
          mod,
          `docs/api/${mod}.md`,
        ])
      ),
    },
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Wrote ${allRoutes.length} routes → ${path.relative(backendRoot, outFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
