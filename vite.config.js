const fs = require("fs");
const path = require("path");
const { defineConfig } = require("vite");

const projectRoot = __dirname;
const outDir = path.resolve(projectRoot, "dist");
const buildVersion = new Date().toISOString().replace(/[-:.TZ]/g, "");

function replaceDirContents(sourceDirName, targetDirName = sourceDirName) {
  const sourceDir = path.resolve(projectRoot, sourceDirName);
  const targetDir = path.resolve(outDir, targetDirName);

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true
  });
}

function rewriteBuiltHtmlAssetUrls() {
  const htmlFiles = [
    path.resolve(outDir, "index.html"),
    path.resolve(outDir, "pages", "costumes.html"),
    path.resolve(outDir, "pages", "timeline.html"),
    path.resolve(outDir, "pages", "knowledge.html")
  ];

  htmlFiles.forEach((htmlFile) => {
    if (!fs.existsSync(htmlFile)) return;

    const isNestedPage = path.dirname(htmlFile) !== outDir;
    const vitePrefix = isNestedPage ? "../_vite/" : "./_vite/";
    const html = fs.readFileSync(htmlFile, "utf8")
      .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/i, "")
      .replace(/(["'])\/_vite\//g, "$1" + vitePrefix)
      .replace(
        /(<script[^>]*\ssrc=|<link[^>]*\srel=["']stylesheet["'][^>]*\shref=)(["'])(?!https?:|data:|mailto:|#)(?![^"']*\?)(?![^"']*\/_vite\/)([^"']+)\2/gi,
        function (_, tagPrefix, quote, assetPath) {
          return tagPrefix + quote + assetPath + "?v=" + buildVersion + quote;
        }
      );

    fs.writeFileSync(htmlFile, html);
  });
}

function writeBuildVersionScript() {
  const targetFile = path.resolve(outDir, "scripts", "shared", "build-version.js");
  const script = [
    "(function () {",
    '  var version = "' + buildVersion + '";',
    "",
    "  function hasQuery(url) {",
    '    return typeof url === "string" && url.indexOf("?") >= 0;',
    "  }",
    "",
    "  function appendVersion(url) {",
    '    if (typeof url !== "string" || !url) return url;',
    '    if (/\\/$/.test(url)) return url;',
    "    if (hasQuery(url) || !version) return url;",
    '    return url + "?v=" + encodeURIComponent(version);',
    "  }",
    "",
    "  window.SiteAssetVersion = {",
    "    value: version,",
    "    append: appendVersion",
    "  };",
    "})();",
    ""
  ].join("\n");

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, script);
}

module.exports = defineConfig({
  // Use relative asset URLs so the built dist/ can be hosted from a domain root
  // or any nested static subdirectory without breaking _vite references.
  base: "./",
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  },
  build: {
    outDir: "dist",
    assetsDir: "_vite",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(projectRoot, "index.html"),
        timeline: path.resolve(projectRoot, "pages/timeline.html"),
        knowledge: path.resolve(projectRoot, "pages/knowledge.html"),
        costumes: path.resolve(projectRoot, "pages/costumes.html")
      }
    }
  },
  plugins: [
    {
      name: "copy-runtime-static-assets",
      closeBundle() {
        replaceDirContents("vendor");
        replaceDirContents("scripts");
        replaceDirContents("assets");
        writeBuildVersionScript();
        rewriteBuiltHtmlAssetUrls();
      }
    }
  ]
});
