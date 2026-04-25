const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { validateCostumeModels } = require("./validate-costume-models.js");

const root = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function loadAppData() {
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  [
    "scripts/shared/costume-model-manifest.js",
    "scripts/data/solar-terms.data.js",
    "scripts/data/costumes.data.js",
    "scripts/data/timeline.data.js"
  ]
    .forEach((file) => vm.runInContext(read(file), sandbox, { filename: file }));
  return sandbox.window.SolarTermsAppData;
}

function validateData(appData) {
  assert(appData.meta && appData.meta.offlineReady === true, "meta.offlineReady must be true");
  assert(Array.isArray(appData.terms) && appData.terms.length === 24, "Expected 24 solar terms");
  assert(Array.isArray(appData.costumeExhibits) && appData.costumeExhibits.length === 8, "Expected 8 costume exhibits");
  assert(Array.isArray(appData.timelineScenes) && appData.timelineScenes.length === 8, "Expected 8 timeline scenes");

  const termIds = new Set(appData.terms.map((term) => term.id));
  assert(termIds.size === 24, "Solar term ids must be unique");

  appData.costumeExhibits.forEach((costume) => {
    assert(exists(costume.posterImage), `Missing costume poster: ${costume.posterImage}`);
    costume.representedTermIds.forEach((id) => assert(termIds.has(id), `Costume references missing term: ${id}`));
    assert(["packaged-model", "poster-only"].includes(costume.modelSourceType), `Invalid costume model source type: ${costume.id}`);
    assert(!("proceduralStyle" in costume), `proceduralStyle should not exist on costume: ${costume.id}`);

    if (costume.modelSourceType === "packaged-model") {
      assert(costume.modelAsset, `Missing model asset definition: ${costume.id}`);
      assert(typeof costume.modelAsset.path === "string", `Missing GLB model path: ${costume.id}`);
      assert(exists(costume.modelAsset.path.replace(/^\//, "")), `Missing GLB model: ${costume.modelAsset.path}`);
    }
  });

  const sceneIds = new Set(appData.timelineScenes.map((scene) => scene.id));
  appData.timelineScenes.forEach((scene) => {
    assert(exists(scene.posterImage), `Missing timeline poster: ${scene.posterImage}`);
    scene.representedTermIds.forEach((id) => assert(termIds.has(id), `Timeline references missing term: ${id}`));
    assert(scene.mediaType === "poster", `Timeline scene must use local poster media: ${scene.id}`);
    assert(!("motionPattern" in scene), `Timeline scene should not keep canvas motion config: ${scene.id}`);
    assert(!("palette" in scene), `Timeline scene should not keep canvas palette config: ${scene.id}`);
  });

  appData.terms.forEach((term) => {
    assert(sceneIds.has(term.timelineSceneId), `Solar term ${term.id} is missing a valid timeline scene`);
  });
}

function validateFiles() {
  [
    "index.html",
    "pages/costumes.html",
    "pages/timeline.html",
    "pages/knowledge.html",
    "styles/base.css",
    "styles/layout.css",
    "styles/home.css",
    "styles/costumes.css",
    "styles/timeline.css",
    "styles/knowledge.css",
    "scripts/app-shell.js",
    "scripts/shared/build-version.js",
    "scripts/shared/costume-model-manifest.js",
    "scripts/modules/timeline-player.js",
    "scripts/modules/knowledge-grid.js",
    "vendor/vue/vue.global.prod.js"
  ].forEach((file) => assert(exists(file), `Missing file: ${file}`));

  const home = read("index.html");
  const costumes = read("pages/costumes.html");
  const timeline = read("pages/timeline.html");
  const knowledge = read("pages/knowledge.html");

  assert(home.includes("scripts/shared/build-version.js"), "Home page must load build version helper");
  assert(home.includes("vendor/vue/vue.global.prod.js"), "Home page must use local Vue");
  assert(home.includes("scripts/data/solar-terms.data.js"), "Home page must use local data scripts");
  assert(
    costumes.includes("../scripts/shared/build-version.js"),
    "Costumes page must load build version helper"
  );
  assert(costumes.includes("../src/costumes/main.js"), "Costumes page must use the local module entry");
  assert(timeline.includes("../scripts/shared/build-version.js"), "Timeline page must load build version helper");
  assert(timeline.includes("../vendor/vue/vue.global.prod.js"), "Timeline page must use local Vue");
  assert(knowledge.includes("../scripts/shared/build-version.js"), "Knowledge page must load build version helper");
  assert(knowledge.includes("../vendor/vue/vue.global.prod.js"), "Knowledge page must use local Vue");

  assert(!read("scripts/modules/timeline-player.js").includes('getContext("2d")'), "Timeline module must not use canvas 2D");
}

validateFiles();
validateCostumeModels();
validateData(loadAppData());
console.log("Site validation passed.");
