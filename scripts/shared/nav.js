(function () {
  window.NavRenderer = {
    items: [
      { id: "home", label: "首页", href: "../index.html", rootHref: "index.html" },
      { id: "costumes", label: "服装展示", href: "costumes.html", rootHref: "pages/costumes.html" },
      { id: "timeline", label: "节气流转图谱", href: "timeline.html", rootHref: "pages/timeline.html" },
      { id: "knowledge", label: "节气知识库", href: "knowledge.html", rootHref: "pages/knowledge.html" }
    ],
    mount: function (container, currentPage) {
      if (!container) return;

      var page = currentPage || "home";
      var isRoot = page === "home";
      var links = this.items.map(function (item) {
        var href = isRoot ? item.rootHref : item.href;
        var activeClass = item.id === page ? "is-active" : "";
        return '<a class="' + activeClass + '" href="' + href + '">' + item.label + "</a>";
      }).join("");

      container.innerHTML = [
        '<header class="site-header">',
        '  <div class="site-header__inner">',
        '    <div class="brand-block">',
        '      <span class="brand-block__title">二十四节气互动文化网页</span>',
        '      <span class="brand-block__subtitle">从服饰、时序与知识三个维度感受节气之美</span>',
        "    </div>",
        '    <nav class="site-nav">' + links + "</nav>",
        "  </div>",
        "</header>"
      ].join("");
    }
  };
})();
