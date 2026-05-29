/**
 * Ensures each route in api-manifest.json is mentioned in docs/api/<module>.md
 * Run: npm run docs:check
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(
  backendRoot,
  "docs",
  ".generated",
  "api-manifest.json"
);

type Manifest = {
  routes: Array<{
    method: string;
    path: string;
    module: string;
  }>;
};

function normalizeDocPath(routePath: string): string[] {
  const p = routePath.replace(/\/$/, "") || "/";
  const variants = [p, p + "/"];
  // Also match backtick path without leading segment issues
  const paramNormalized = p.replace(/:([^/]+)/g, ":$1");
  if (paramNormalized !== p) variants.push(paramNormalized);
  return variants;
}

function pathMentionedInDoc(docContent: string, routePath: string): boolean {
  for (const variant of normalizeDocPath(routePath)) {
    if (docContent.includes("`" + variant + "`")) return true;
    if (docContent.includes("|" + variant + "|")) return true;
    if (docContent.includes(" " + variant + " ")) return true;
    if (docContent.includes(variant + " |")) return true;
  }
  return false;
}

async function main() {
  let manifestRaw: string;
  try {
    manifestRaw = await readFile(manifestPath, "utf8");
  } catch {
    console.error(
      "Missing api-manifest.json. Run: npm run docs:manifest"
    );
    process.exit(1);
    return;
  }

  const manifest = JSON.parse(manifestRaw) as Manifest;
  const missing: string[] = [];
  const docCache = new Map<string, string>();

  for (const route of manifest.routes) {
    const docRel = `docs/api/${route.module}.md`;
    const docPath = path.join(backendRoot, docRel);

    if (!docCache.has(route.module)) {
      try {
        docCache.set(route.module, await readFile(docPath, "utf8"));
      } catch {
        missing.push(
          `${route.method} ${route.path} → missing file ${docRel}`
        );
        continue;
      }
    }

    const doc = docCache.get(route.module)!;
    if (!pathMentionedInDoc(doc, route.path)) {
      missing.push(
        `${route.method} ${route.path} → not found in ${docRel}`
      );
    }
  }

  if (missing.length > 0) {
    console.error(`Documentation check failed (${missing.length} issue(s)):\n`);
    for (const line of missing) {
      console.error(`  - ${line}`);
    }
    console.error(
      "\nUpdate docs/api/*.md per .agents/skills/docs-sync-workflow/SKILL.md"
    );
    process.exit(1);
  }

  console.log(
    `OK: all ${manifest.routes.length} routes are referenced in docs/api/*.md`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
