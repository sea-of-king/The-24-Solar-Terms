(function () {
  var MODEL_CACHE_NAME = "solar-terms-costume-model-v2";
  var manifest = window.CostumeModelManifest || { modelPaths: [] };
  var assetVersion = window.SiteAssetVersion;

  function appendAssetVersion(path) {
    return assetVersion && typeof assetVersion.append === "function"
      ? assetVersion.append(path)
      : path;
  }

  function resolveRuntimeAssetPath(assetPath) {
    if (typeof assetPath !== "string" || !assetPath) return assetPath;
    if (!assetPath.startsWith("/")) return assetPath;

    var normalizedPath = assetPath.replace(/^\//, "");
    var basePrefix = window.location.pathname.indexOf("/pages/") >= 0 ? "../" : "./";
    return appendAssetVersion(basePrefix + normalizedPath);
  }

  var MODEL_PATHS = Array.isArray(manifest.modelPaths)
    ? manifest.modelPaths.map(resolveRuntimeAssetPath)
    : [];
  var pending = {};

  function isSupported() {
    return typeof window !== "undefined" && typeof window.fetch === "function";
  }

  function storeInCache(path, response) {
    if (!("caches" in window)) return Promise.resolve(response);
    return caches.open(MODEL_CACHE_NAME).then(function (cache) {
      return cache.put(path, response.clone()).then(function () {
        return response;
      });
    });
  }

  function preload(path) {
    if (!isSupported()) return Promise.resolve(null);
    path = resolveRuntimeAssetPath(path);
    if (pending[path]) return pending[path];

    pending[path] = (function () {
      if ("caches" in window) {
        return caches.open(MODEL_CACHE_NAME).then(function (cache) {
          return cache.match(path).then(function (cached) {
            if (cached) return cached.arrayBuffer();

            return fetch(path, { cache: "force-cache" }).then(function (response) {
              if (!response.ok) throw new Error("Failed to preload model");
              return storeInCache(path, response).then(function (storedResponse) {
                return storedResponse.arrayBuffer();
              });
            });
          });
        });
      }

      return fetch(path, { cache: "force-cache" }).then(function (response) {
        if (!response.ok) throw new Error("Failed to preload model");
        return response.arrayBuffer();
      });
    })().catch(function () {
      return null;
    });

    return pending[path];
  }

  function preloadAll() {
    MODEL_PATHS.forEach(function (path) {
      preload(path);
    });
  }

  function schedule() {
    if (!isSupported()) return;

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(preloadAll, { timeout: 1200 });
      return;
    }

    window.setTimeout(preloadAll, 180);
  }

  window.ModelPreload = {
    preload: preload,
    preloadAll: preloadAll,
    schedule: schedule
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    schedule();
  } else {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  }
})();
