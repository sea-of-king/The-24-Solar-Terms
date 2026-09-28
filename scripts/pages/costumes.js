(function () {
  var STATIC_VIEWER_MESSAGE = "当前为静态展示模式；请运行 npm run dev 方能看到模型展示。";
  var LOADING_VIEWER_MESSAGE = "模型正在加载…";

  function isExternalPath(value) {
    return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.indexOf("//") === 0 || value.indexOf("#") === 0;
  }

  function isNestedPage() {
    return /(^|\/)pages(\/|$)/.test(window.location.pathname.replace(/\\/g, "/"));
  }

  function resolveAssetPath(assetPath) {
    if (typeof assetPath !== "string" || !assetPath || isExternalPath(assetPath)) return assetPath;

    var normalizedPath = assetPath.charAt(0) === "/" ? assetPath.slice(1) : assetPath;
    var shouldPrefix = normalizedPath.indexOf("./") !== 0 && normalizedPath.indexOf("../") !== 0;
    var resolvedPath = shouldPrefix ? (isNestedPage() ? "../" : "./") + normalizedPath : normalizedPath;

    return window.SiteAssetVersion && typeof window.SiteAssetVersion.append === "function"
      ? window.SiteAssetVersion.append(resolvedPath)
      : resolvedPath;
  }

  function getTermName(termId) {
    var appData = window.SolarTermsAppData || {};
    var term = typeof appData.getTermById === "function" ? appData.getTermById(termId) : null;
    return term ? term.nameZh : termId;
  }

  function getRepresentedTermNames(costume) {
    return (costume.representedTermIds || []).map(getTermName).filter(Boolean);
  }

  function createPresetFromCostume(costume) {
    var termNames = getRepresentedTermNames(costume);
    var subtitle = termNames.length ? termNames.join(" / ") : costume.seasonGroup || "节气服装";

    return {
      id: costume.id,
      navTitle: costume.title,
      navSubtitle: subtitle,
      posterImage: resolveAssetPath(costume.posterImage),
      badge: costume.seasonGroup || "代表服装",
      headline: costume.title,
      lead: subtitle + "一袭成章，留住时令风骨。",
      concept: costume.designConcept || "海报留形，亦可见其意。",
      palette: costume.paletteDescription || "淡设时色，轻写衣纹。",
      highlights: [
        "所映节气：" + subtitle,
        costume.fallbackDescription || "以一幅海报，留一段时令风姿。",
        "静览其形，亦可得其韵。"
      ]
    };
  }

  function getStaticPresets() {
    var appData = window.SolarTermsAppData || {};
    var costumes = Array.isArray(appData.costumeExhibits) ? appData.costumeExhibits : [];

    if (costumes.length) {
      return costumes.map(createPresetFromCostume);
    }

    return [{
      id: "costume-static-fallback",
      navTitle: "清明烟岚",
      navSubtitle: "静态展示",
      posterImage: resolveAssetPath("assets/images/costumes/qingming-mist.svg"),
      badge: "静态展示",
      headline: "服装展示",
      lead: "一页静陈衣章，不启模型，亦可观其韵。",
      concept: "暂未取到完整衣录，先以清明一章相迎。",
      palette: "待数据齐备，四时衣色自会次第展开。",
      highlights: ["海报可独立浏览", "模型可用时将自动入场"]
    }];
  }

  function hasModelAsset(presetId) {
    var manifest = window.CostumeModelManifest;
    return !!(manifest && manifest.byId && manifest.byId[presetId] && manifest.byId[presetId].runtimeAsset);
  }

  function shouldPreferModelRenderer(presets) {
    return (presets || []).some(function (preset) {
      return hasModelAsset(preset.id);
    });
  }

  function mountSharedNav() {
    var container = document.querySelector("#site-nav");
    if (!container || !window.NavRenderer || typeof window.NavRenderer.mount !== "function") return;
    window.NavRenderer.mount(container, "costumes");
  }

  function mountSharedFooter() {
    var container = document.querySelector("#site-footer");
    if (!container || !window.FooterRenderer || typeof window.FooterRenderer.mount !== "function") return;
    window.FooterRenderer.mount(container);
  }

  function createAppShell(options) {
    options = options || {};
    var loadingMode = !!options.loadingMode;
    var overlayClass = loadingMode ? "viewer-shell__overlay" : "viewer-shell__overlay is-hidden";
    var viewerStatus = loadingMode ? LOADING_VIEWER_MESSAGE : "静态展示已就绪";
    var tips = loadingMode
      ? [
        "模型正在加载",
        "加载完成后自动展示",
        "资源异常时将回退图片"
      ]
      : [
        "无需启动 npm run dev",
        "点击左侧切换服装",
        "本地海报与说明可直接浏览"
      ];

    return [
      '<div class="costumes-page">',
      '  <section class="page-intro">',
      '    <p class="eyebrow">服装展示</p>',
      "    <h1>循节气，观衣章</h1>",
      "    <p>一袭有时序，半卷见风雅。</p>",
      "  </section>",
      "",
      '  <section class="costumes-layout">',
      '    <aside class="selector-panel card">',
      '      <div class="selector-panel__header">',
      "        <h2>衣章小录</h2>",
      "        <p>随四时流转，静看纹理生香。</p>",
      "      </div>",
      '      <div class="selector-list" id="preset-list"></div>',
      "    </aside>",
      "",
      '    <section class="showcase-panel">',
      '      <article class="viewer-stage card">',
      '        <div class="viewer-stage__toolbar">',
      "          <div>",
      '            <h2 id="detail-headline"></h2>',
      '            <p class="muted" id="detail-lead"></p>',
      "          </div>",
      '          <span class="pill" id="detail-badge"></span>',
      "        </div>",
      "",
      '        <div class="viewer-shell">',
      '          <div class="viewer-shell__canvas" id="viewer-canvas" aria-live="polite"></div>',
      '          <div class="' + overlayClass + '" id="viewer-overlay">',
      '            <div class="viewer-loading">',
      '              <div class="viewer-loading__pulse" aria-hidden="true">',
      "                <span></span>",
      "                <span></span>",
      "                <span></span>",
      "              </div>",
      '              <p id="viewer-status">' + viewerStatus + "</p>",
      "            </div>",
      "          </div>",
      "        </div>",
      "",
      '        <div class="viewer-stage__tips">',
      "          <span>" + tips[0] + "</span>",
      "          <span>" + tips[1] + "</span>",
      "          <span>" + tips[2] + "</span>",
      "        </div>",
      "      </article>",
      "",
      '      <section class="detail-grid">',
      '        <article class="card detail-card">',
      "          <h3>衣意</h3>",
      '          <p id="detail-concept"></p>',
      "        </article>",
      '        <article class="card detail-card">',
      "          <h3>色韵</h3>",
      '          <p id="detail-palette"></p>',
      "        </article>",
      '        <article class="card detail-card detail-card--wide">',
      "          <h3>可观处</h3>",
      '          <ul class="feature-bullets" id="detail-highlights"></ul>',
      "        </article>",
      "      </section>",
      "    </section>",
      "  </section>",
      "</div>"
    ].join("\n");
  }

  function createPresetButton(preset, isActive) {
    var button = document.createElement("button");
    var image = document.createElement("img");
    var textWrap = document.createElement("span");
    var title = document.createElement("span");
    var subtitle = document.createElement("span");

    button.type = "button";
    button.className = "selector-item" + (isActive ? " is-active" : "");
    button.dataset.presetId = preset.id;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");

    image.src = preset.posterImage;
    image.alt = preset.navTitle;

    title.className = "selector-item__title";
    title.textContent = preset.navTitle;

    subtitle.className = "selector-item__terms";
    subtitle.textContent = preset.navSubtitle;

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);
    button.appendChild(image);
    button.appendChild(textWrap);

    return button;
  }

  function getDetailNodes() {
    return {
      headline: document.querySelector("#detail-headline"),
      lead: document.querySelector("#detail-lead"),
      badge: document.querySelector("#detail-badge"),
      concept: document.querySelector("#detail-concept"),
      palette: document.querySelector("#detail-palette"),
      highlights: document.querySelector("#detail-highlights")
    };
  }

  function applyDetails(preset, nodes) {
    if (!preset || !nodes) return;

    if (nodes.headline) nodes.headline.textContent = preset.headline;
    if (nodes.lead) nodes.lead.textContent = preset.lead;
    if (nodes.badge) nodes.badge.textContent = preset.badge;
    if (nodes.concept) nodes.concept.textContent = preset.concept;
    if (nodes.palette) nodes.palette.textContent = preset.palette;

    if (nodes.highlights) {
      nodes.highlights.innerHTML = "";
      (preset.highlights || []).forEach(function (item) {
        var listItem = document.createElement("li");
        listItem.textContent = item;
        nodes.highlights.appendChild(listItem);
      });
    }
  }

  function renderViewerFallback(preset, container, message) {
    if (!preset || !container) return;

    container.innerHTML = "";

    var wrapper = document.createElement("div");
    var image = document.createElement("img");
    var body = document.createElement("div");
    var title = document.createElement("p");
    var text = document.createElement("p");

    wrapper.className = "viewer-fallback";
    wrapper.setAttribute("role", "img");
    wrapper.setAttribute("aria-label", preset.headline + "静态海报");

    image.src = preset.posterImage;
    image.alt = preset.headline;

    body.className = "viewer-fallback__body";
    title.className = "viewer-fallback__title";
    title.textContent = preset.headline;
    text.textContent = message || STATIC_VIEWER_MESSAGE;

    body.appendChild(title);
    body.appendChild(text);
    wrapper.appendChild(image);
    wrapper.appendChild(body);
    container.appendChild(wrapper);
  }

  function setActivePreset(state, preset) {
    var viewerCanvas = document.querySelector("#viewer-canvas");
    var nodes = getDetailNodes();

    state.activePreset = preset;
    applyDetails(preset, nodes);
    renderViewerFallback(preset, viewerCanvas, state.viewerMessage);

    state.buttons.forEach(function (button) {
      var isActive = button.dataset.presetId === preset.id;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function mount(options) {
    options = options || {};
    mountSharedNav();
    mountSharedFooter();

    var root = document.querySelector("#costumes-app");
    if (!root) return null;

    var presets = getStaticPresets();
    var loadingMode = !!options.loadingMode;
    var presetList;
    var state = {
      activePreset: presets[0],
      buttons: [],
      presets: presets,
      viewerMessage: options.viewerMessage || STATIC_VIEWER_MESSAGE
    };

    root.innerHTML = createAppShell({ loadingMode: loadingMode });
    root.dataset.costumesRenderer = loadingMode ? "model-pending" : "static";

    presetList = document.querySelector("#preset-list");
    presets.forEach(function (preset, index) {
      var button = createPresetButton(preset, index === 0);
      state.buttons.push(button);
      presetList.appendChild(button);
    });

    if (!loadingMode) {
      setActivePreset(state, state.activePreset);
    } else {
      applyDetails(state.activePreset, getDetailNodes());
    }

    presetList.addEventListener("click", function (event) {
      var target = event.target;
      var trigger = null;

      while (target && target !== presetList) {
        if (target.classList && target.classList.contains("selector-item")) {
          trigger = target;
          break;
        }
        target = target.parentNode;
      }

      if (!trigger) return;

      var nextPreset = presets.find(function (item) {
        return item.id === trigger.dataset.presetId;
      });
      if (!nextPreset || nextPreset.id === state.activePreset.id) return;

      setActivePreset(state, nextPreset);
    });

    window.__costumeStaticPresets = presets;
    window.__costumePresets = presets;
    return state;
  }

  function autoMount() {
    if (!document.querySelector("#costumes-app")) return;
    var presets = getStaticPresets();
    if (shouldPreferModelRenderer(presets)) {
      mount({ loadingMode: true });
      return;
    }
    mount();
  }

  window.CostumesPageRenderer = {
    applyDetails: applyDetails,
    createAppShell: createAppShell,
    getStaticPresets: getStaticPresets,
    mount: mount,
    renderViewerFallback: renderViewerFallback,
    resolveAssetPath: resolveAssetPath
  };

  if (document.querySelector("#costumes-app")) {
    autoMount();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  } else {
    autoMount();
  }
})();
