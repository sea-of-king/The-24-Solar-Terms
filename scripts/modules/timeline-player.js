(function () {
  function TimelinePlayer(container) {
    this.container = container;
  }

  TimelinePlayer.prototype.setScene = function (scene) {
    if (!this.container || !scene) return;

    this.container.innerHTML = "";
    window.FallbackRenderers.renderPoster(this.container, {
      posterImage: window.SiteShell.resolveAssetPath(scene.posterImage),
      title: scene.title,
      description: scene.themeText
    });
  };

  window.TimelinePlayer = TimelinePlayer;
})();
