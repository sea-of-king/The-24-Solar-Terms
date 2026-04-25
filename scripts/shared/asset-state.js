(function () {
  function isWebGLAvailable() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (error) {
      return false;
    }
  }

  function supportsCanvas2D() {
    try {
      return !!document.createElement("canvas").getContext("2d");
    } catch (error) {
      return false;
    }
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  window.AssetState = {
    isWebGLAvailable: isWebGLAvailable,
    supportsCanvas2D: supportsCanvas2D,
    prefersReducedMotion: prefersReducedMotion
  };
})();
