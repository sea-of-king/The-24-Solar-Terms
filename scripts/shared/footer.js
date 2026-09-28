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
        "      <p>于衣色、时序、风物与问答之间，从容读一岁节气。</p>",
        "    </div>",
        "  </div>",
        "</footer>"
      ].join("");
    }
  };
})();
