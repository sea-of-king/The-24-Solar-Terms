(function () {
  function renderPoster(container, options) {
    if (!container || !options || !options.posterImage) {
      return;
    }

    container.innerHTML = [
      '<div class="empty-state">',
      '  <div>',
      '    <img src="' + options.posterImage + '" alt="' + (options.title || "静态海报") + '">',
      '    <p>' + (options.description || "当前环境下展示静态说明。") + "</p>",
      "  </div>",
      "</div>"
    ].join("");
  }

  window.FallbackRenderers = { renderPoster: renderPoster };
})();
