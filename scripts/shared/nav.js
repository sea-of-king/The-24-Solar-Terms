(function () {
  window.NavRenderer = {
    items: [
      { id: "home", label: "首页", href: "../index.html", rootHref: "index.html" },
      { id: "timeline", label: "节气流转图谱", href: "timeline.html", rootHref: "pages/timeline.html" },
      { id: "knowledge", label: "节气知识库", href: "knowledge.html", rootHref: "pages/knowledge.html" },
      { id: "tree-hole", label: "节气树洞", href: "tree-hole.html", rootHref: "pages/tree-hole.html" },
      { id: "agent", label: "节气智能助手", href: "agent.html", rootHref: "pages/agent.html" },
      { id: "costumes", label: "服装展示", href: "costumes.html", rootHref: "pages/costumes.html" }
    ],
    mount: function (container, currentPage) {
      if (!container) return;

      var page = currentPage || "home";
      var isRoot = page === "home";
      var navId = "site-nav-menu";
      var links = this.items.map(function (item) {
        var href = isRoot ? item.rootHref : item.href;
        var activeClass = item.id === page ? "is-active" : "";
        return '<a class="' + activeClass + '" href="' + href + '">' + item.label + "</a>";
      }).join("");

      container.innerHTML = [
        '<header class="site-header" data-nav-open="false">',
        '  <div class="site-header__inner">',
        '    <div class="site-header__top">',
        '      <div class="brand-block">',
        '        <span class="brand-block__title">二十四节气互动文化网页</span>',
        '        <span class="brand-block__subtitle">看衣色，循时序，读风物，问节气。</span>',
        "      </div>",
        '      <button class="site-nav-toggle" type="button" aria-expanded="false" aria-controls="' + navId + '" aria-label="展开导航">',
        '        <span class="site-nav-toggle__text">导航</span>',
        '        <span class="site-nav-toggle__icon" aria-hidden="true"><span></span><span></span><span></span></span>',
        "      </button>",
        "    </div>",
        '    <nav class="site-nav" id="' + navId + '">' + links + "</nav>",
        "  </div>",
        "</header>"
      ].join("");

      var header = container.querySelector(".site-header");
      var toggle = container.querySelector(".site-nav-toggle");
      if (!header || !toggle) return;

      toggle.addEventListener("click", function () {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        var nextOpen = !isOpen;
        toggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        toggle.setAttribute("aria-label", nextOpen ? "收起导航" : "展开导航");
        header.setAttribute("data-nav-open", nextOpen ? "true" : "false");
        header.classList.toggle("is-nav-open", nextOpen);
      });
    }
  };
})();
