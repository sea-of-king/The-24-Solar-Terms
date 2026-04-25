(function () {
  window.FooterRenderer = {
    mount: function (container) {
      if (!container) return;

      var meta = (window.SolarTermsAppData && window.SolarTermsAppData.meta) || {};
      container.innerHTML = [
        '<footer class="site-footer">',
        '  <div class="site-footer__inner">',
        '    <div class="site-footer__meta">',
        "      <strong>" + (meta.siteTitle || "二十四节气互动文化网页") + "</strong>",
        "      <p>在服装展示、节气流转图谱与知识库之间自由浏览，了解二十四节气的季节变化、文化习俗与审美意象。</p>",
        "    </div>",
        "  </div>",
        "</footer>"
      ].join("");
    }
  };
})();
