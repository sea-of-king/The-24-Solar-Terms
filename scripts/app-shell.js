(function () {
  var data = window.SolarTermsAppData || {};
  var assetVersion = window.SiteAssetVersion;

  function buildItems(isRoot) {
    return [
      { id: "home", label: "首页", href: isRoot ? "index.html" : "../index.html" },
      { id: "costumes", label: "服装展示", href: isRoot ? "pages/costumes.html" : "costumes.html" },
      { id: "timeline", label: "节气流转图谱", href: isRoot ? "pages/timeline.html" : "timeline.html" },
      { id: "knowledge", label: "节气知识库", href: isRoot ? "pages/knowledge.html" : "knowledge.html" }
    ];
  }

  function mountChrome(page) {
    var currentPage = page || document.body.getAttribute("data-page") || "home";
    var isRoot = currentPage === "home";

    if (!window.Vue) {
      window.NavRenderer && window.NavRenderer.mount(document.getElementById("site-nav"), currentPage);
      window.FooterRenderer && window.FooterRenderer.mount(document.getElementById("site-footer"));
      return;
    }

    var navContainer = document.getElementById("site-nav");
    if (navContainer) {
      Vue.createApp({
        data: function () {
          return {
            currentPage: currentPage,
            items: buildItems(isRoot)
          };
        },
        template: `<header class="site-header"><div class="site-header__inner"><div class="brand-block"><span class="brand-block__title">二十四节气互动文化网页</span><span class="brand-block__subtitle">从服饰、时序与知识三个维度感受节气之美</span></div><nav class="site-nav"><a v-for="item in items" :key="item.id" :href="item.href" :class="{ 'is-active': item.id === currentPage }">{{ item.label }}</a></nav></div></header>`
      }).mount(navContainer);
    }

    var footerContainer = document.getElementById("site-footer");
    if (footerContainer) {
      Vue.createApp({
        data: function () {
          return { meta: data.meta || {} };
        },
        template: `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__meta"><strong>{{ meta.siteTitle || "二十四节气互动文化网页" }}</strong><p>在服装展示、节气流转图谱与知识库之间自由浏览，了解二十四节气的季节变化、文化习俗与审美意象。</p></div></div></footer>`
      }).mount(footerContainer);
    }
  }

  function init(page) {
    mountChrome(page);
  }

  window.SiteShell = {
    init: init,
    mountChrome: mountChrome,
    data: data,
    resolveAssetPath: function (relativePath) {
      var page = document.body.getAttribute("data-page") || "home";
      var resolvedPath = page === "home" ? relativePath : "../" + relativePath;
      return assetVersion && typeof assetVersion.append === "function"
        ? assetVersion.append(resolvedPath)
        : resolvedPath;
    },
    getTermsForIds: function (ids) {
      return (ids || []).map(function (id) {
        return data.getTermById ? data.getTermById(id) : null;
      }).filter(Boolean);
    }
  };
})();
