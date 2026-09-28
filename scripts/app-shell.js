(function () {
  var data = window.SolarTermsAppData || {};
  var assetVersion = window.SiteAssetVersion;

  function buildItems(isRoot) {
    return [
      { id: "home", label: "首页", href: isRoot ? "index.html" : "../index.html" },
      { id: "timeline", label: "节气流转图谱", href: isRoot ? "pages/timeline.html" : "timeline.html" },
      { id: "knowledge", label: "节气知识库", href: isRoot ? "pages/knowledge.html" : "knowledge.html" },
      { id: "tree-hole", label: "节气树洞", href: isRoot ? "pages/tree-hole.html" : "tree-hole.html" },
      { id: "agent", label: "节气智能助手", href: isRoot ? "pages/agent.html" : "agent.html" },
      { id: "costumes", label: "服装展示", href: isRoot ? "pages/costumes.html" : "costumes.html" }
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
            items: buildItems(isRoot),
            navOpen: false
          };
        },
        methods: {
          toggleNav: function () {
            this.navOpen = !this.navOpen;
          }
        },
        template: `<header class="site-header" :class="{ 'is-nav-open': navOpen }" :data-nav-open="navOpen ? 'true' : 'false'"><div class="site-header__inner"><div class="site-header__top"><div class="brand-block"><span class="brand-block__title">二十四节气互动文化网页</span><span class="brand-block__subtitle">看衣色，循时序，读风物，问节气。</span></div><button class="site-nav-toggle" type="button" :aria-expanded="navOpen ? 'true' : 'false'" aria-controls="site-nav-menu" :aria-label="navOpen ? '收起导航' : '展开导航'" @click="toggleNav"><span class="site-nav-toggle__text">导航</span><span class="site-nav-toggle__icon" aria-hidden="true"><span></span><span></span><span></span></span></button></div><nav class="site-nav" id="site-nav-menu"><a v-for="item in items" :key="item.id" :href="item.href" :class="{ 'is-active': item.id === currentPage }">{{ item.label }}</a></nav></div></header>`
      }).mount(navContainer);
    }

    var footerContainer = document.getElementById("site-footer");
    if (footerContainer) {
      Vue.createApp({
        data: function () {
          return { meta: data.meta || {} };
        },
        template: `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__meta"><strong>{{ meta.siteTitle || "二十四节气互动文化网页" }}</strong><p>于衣色、时序、风物与问答之间，从容读一岁节气。</p></div></div></footer>`
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
