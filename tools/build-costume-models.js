const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  COSTUME_MODEL_ENTRIES,
  COSTUME_MODEL_SIZE_LIMIT_BYTES
} = require("./costume-models.config.cjs");

const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "assets", "generated", "costumes");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function resolveCliPath() {
  return path.join(repoRoot, "node_modules", "@gltf-transform", "cli", "bin", "cli.js");
}

function runOptimize(sourcePath, outputPath) {
  const cliPath = resolveCliPath();
  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      "optimize",
      sourcePath,
      outputPath,
      "--compress",
      "draco",
      "--texture-compress",
      "webp",
      "--texture-size",
      "1024"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe"
    }
  );

  if (result.status !== 0) {
    throw new Error(
      [
        `Failed to optimize ${sourcePath}`,
        result.stderr,
        result.stdout,
        result.error ? String(result.error) : ""
      ].filter(Boolean).join("\n")
    );
  }

  return result.stdout.trim();
}

function createManifestPayload(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    sourcePath: entry.sourcePath.replace(/\\/g, "/"),
    sourceAliasPath: entry.sourceAliasPath.replace(/\\/g, "/"),
    outputPath: entry.outputPath.replace(/\\/g, "/"),
    sizeBytes: entry.sizeBytes,
    sizeLabel: formatBytes(entry.sizeBytes),
    runtimeAsset: {
      path: "/" + entry.outputPath.replace(/\\/g, "/"),
      scale: entry.scale,
      rotationY: entry.rotationY
    }
  }));
}

function writeManifest(entries) {
  const manifestEntries = createManifestPayload(entries);
  const lines = [
    "(function (root) {",
    "  var entries = " + JSON.stringify(manifestEntries, null, 2) + ";",
    "  var byId = Object.create(null);",
    "  entries.forEach(function (entry) {",
    "    byId[entry.id] = entry;",
    "  });",
    "  function normalizeSourcePath(value) {",
    "    if (typeof value !== \"string\") return value;",
    "    return value",
    "      .replace(/^\\/?assets\\/module\\//, \"assets/moudle/\")",
    "      .replace(/^\\/assets\\/module\\//, \"/assets/moudle/\");",
    "  }",
    "  root.CostumeModelManifest = {",
    "    generatedAt: " + JSON.stringify(new Date().toISOString()) + ",",
    "    sizeLimitBytes: " + COSTUME_MODEL_SIZE_LIMIT_BYTES + ",",
    "    entries: entries,",
    "    byId: byId,",
    "    modelPaths: entries.map(function (entry) { return entry.runtimeAsset.path; }),",
    "    normalizeSourcePath: normalizeSourcePath",
    "  };",
    "})(typeof globalThis !== \"undefined\" ? globalThis : window);",
    ""
  ];

  fs.writeFileSync(
    path.join(repoRoot, "scripts", "shared", "costume-model-manifest.js"),
    lines.join("\n"),
    "utf8"
  );
}

function writeReadme(entries) {
  const content = [
    "# Costume Model Outputs",
    "",
    `Size limit: ${formatBytes(COSTUME_MODEL_SIZE_LIMIT_BYTES)}`,
    "",
    "| Costume ID | Source Model | Compressed Output | Size |",
    "| --- | --- | --- | --- |",
    ...entries.map((entry) =>
      `| ${entry.id} | ${entry.sourcePath.replace(/\\/g, "/")} | ${entry.outputPath.replace(/\\/g, "/")} | ${formatBytes(entry.sizeBytes)} |`
    ),
    ""
  ].join("\n");

  fs.writeFileSync(path.join(outputDir, "README.md"), content, "utf8");
}

function main() {
  ensureDir(outputDir);

  const results = COSTUME_MODEL_ENTRIES.map((entry) => {
    const sourcePath = entry.sourcePath.replace(/\\/g, "/");
    const outputPath = entry.outputPath.replace(/\\/g, "/");
    const log = runOptimize(sourcePath, outputPath);
    const sizeBytes = fs.statSync(path.join(repoRoot, outputPath)).size;

    return {
      ...entry,
      sizeBytes,
      log
    };
  });

  writeManifest(results);
  writeReadme(results);

  results.forEach((entry) => {
    console.log(`${entry.id}: ${formatBytes(entry.sizeBytes)} -> ${entry.outputPath}`);
  });
}

main();
