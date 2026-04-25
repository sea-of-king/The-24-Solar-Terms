const fs = require("fs");
const path = require("path");
const vm = require("vm");

const {
  COSTUME_MODEL_ENTRIES,
  COSTUME_MODEL_SIZE_LIMIT_BYTES
} = require("./costume-models.config.cjs");

const repoRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function loadManifest() {
  const sandbox = { window: {}, globalThis: {}, console };
  sandbox.window = sandbox.globalThis;
  vm.createContext(sandbox);
  vm.runInContext(read("scripts/shared/costume-model-manifest.js"), sandbox, {
    filename: "scripts/shared/costume-model-manifest.js"
  });
  return sandbox.globalThis.CostumeModelManifest;
}

function validateCostumeModels() {
  const manifest = loadManifest();

  assert(manifest, "Missing CostumeModelManifest");
  assert(Array.isArray(manifest.entries), "CostumeModelManifest.entries must be an array");
  assert(manifest.entries.length === COSTUME_MODEL_ENTRIES.length, "Manifest entry count mismatch");
  assert(manifest.sizeLimitBytes === COSTUME_MODEL_SIZE_LIMIT_BYTES, "Manifest size limit mismatch");

  const configuredIds = new Set(COSTUME_MODEL_ENTRIES.map((entry) => entry.id));
  const seenIds = new Set();
  const seenRuntimePaths = new Set();

  manifest.entries.forEach((entry) => {
    assert(configuredIds.has(entry.id), `Unexpected manifest id: ${entry.id}`);
    assert(!seenIds.has(entry.id), `Duplicate manifest id: ${entry.id}`);
    seenIds.add(entry.id);

    assert(entry.runtimeAsset && typeof entry.runtimeAsset.path === "string", `Missing runtime asset path: ${entry.id}`);
    assert(!seenRuntimePaths.has(entry.runtimeAsset.path), `Duplicate runtime asset path: ${entry.runtimeAsset.path}`);
    seenRuntimePaths.add(entry.runtimeAsset.path);

    const runtimeRelativePath = entry.runtimeAsset.path.replace(/^\//, "");
    assert(exists(runtimeRelativePath), `Missing compressed model: ${runtimeRelativePath}`);

    const sourceRelativePath = entry.sourcePath;
    assert(exists(sourceRelativePath), `Missing source model: ${sourceRelativePath}`);

    const sizeBytes = fs.statSync(path.join(repoRoot, runtimeRelativePath)).size;
    assert(sizeBytes < COSTUME_MODEL_SIZE_LIMIT_BYTES, `Compressed model exceeds 5MB: ${runtimeRelativePath}`);
  });

  return manifest;
}

if (require.main === module) {
  validateCostumeModels();
  console.log("Costume model validation passed.");
}

module.exports = {
  validateCostumeModels
};
