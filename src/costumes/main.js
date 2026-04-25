import { VIEW_PRESETS } from "./data.js";
import { CostumeShowcase } from "./costume-showcase.js";

const modelWarmupPromise = CostumeShowcase.warmup(
  VIEW_PRESETS.map((preset) => preset.modelAsset).filter(Boolean)
).catch((error) => {
  console.warn("Model warmup failed", error);
});

function mountSharedNav() {
  const container = document.querySelector("#site-nav");
  if (!container) return;

  if (window.NavRenderer && typeof window.NavRenderer.mount === "function") {
    window.NavRenderer.mount(container, "costumes");
    return;
  }

  container.innerHTML = `
    <header class="site-header">
      <div class="site-header__inner">
        <div class="brand-block">
          <span class="brand-block__title">二十四节气互动文化网页</span>
          <span class="brand-block__subtitle">从服饰、时序与知识三个维度感受节气之美</span>
        </div>
        <nav class="site-nav">
          <a href="../index.html">首页</a>
          <a class="is-active" href="./costumes.html">服装展示</a>
          <a href="./timeline.html">节气流转图谱</a>
          <a href="./knowledge.html">节气知识卡</a>
        </nav>
      </div>
    </header>
  `;
}

function createAppShell() {
  return `
    <div class="costumes-page">
      <section class="page-intro">
        <p class="eyebrow">服装展示</p>
        <h1>节气代表服饰建模展示</h1>
        <p>
          页面保留当前高质量模型渲染与材质处理，只将跳转入口统一为与首页、时间轴、知识卡页面一致的顶部导航样式，
          方便用户在不同内容页之间连续浏览。
        </p>
      </section>

      <section class="costumes-layout">
        <aside class="selector-panel card">
          <div class="selector-panel__header">
            <h2>服装索引</h2>
            <p>按节气查看代表服装，并在右侧模型区域自由拖拽、缩放与观察细节。</p>
          </div>
          <div class="selector-list" id="preset-list"></div>
        </aside>

        <section class="showcase-panel">
          <article class="viewer-stage card">
            <div class="viewer-stage__toolbar">
              <div>
                <h2 id="detail-headline"></h2>
                <p class="muted" id="detail-lead"></p>
              </div>
              <span class="pill" id="detail-badge"></span>
            </div>

            <div class="viewer-shell">
              <div class="viewer-shell__canvas" id="viewer-canvas"></div>
              <div class="viewer-shell__overlay" id="viewer-overlay">
                <div class="viewer-loading">
                  <div class="viewer-loading__pulse" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p id="viewer-status">建模加载中…</p>
                </div>
              </div>
            </div>

            <div class="viewer-stage__tips">
              <span>中心区左键旋转</span>
              <span>滚轮缩放观察</span>
              <span>边缘区左键平移</span>
            </div>
          </article>

          <section class="detail-grid">
            <article class="card detail-card">
              <h3>设计概念</h3>
              <p id="detail-concept"></p>
            </article>
            <article class="card detail-card">
              <h3>配色与材质</h3>
              <p id="detail-palette"></p>
            </article>
            <article class="card detail-card detail-card--wide">
              <h3>细节亮点</h3>
              <ul class="feature-bullets" id="detail-highlights"></ul>
            </article>
          </section>
        </section>
      </section>
    </div>
  `;
}

function createPresetButton(preset, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `selector-item${isActive ? " is-active" : ""}`;
  button.dataset.presetId = preset.id;
  button.innerHTML = `
    <img src="${preset.posterImage}" alt="${preset.navTitle}">
    <span>
      <span class="selector-item__title">${preset.navTitle}</span>
      <span class="selector-item__terms">${preset.navSubtitle}</span>
    </span>
  `;
  return button;
}

function applyDetails(preset, nodes) {
  nodes.headline.textContent = preset.headline;
  nodes.lead.textContent = preset.lead;
  nodes.badge.textContent = preset.badge;
  nodes.concept.textContent = preset.concept;
  nodes.palette.textContent = preset.palette;
  nodes.highlights.innerHTML = preset.highlights.map((item) => `<li>${item}</li>`).join("");
}

function renderViewerFallback(preset, container, message) {
  container.innerHTML = `
    <div class="viewer-fallback">
      <img src="${preset.posterImage}" alt="${preset.headline}">
      <div class="viewer-fallback__body">
        <p class="viewer-fallback__title">${preset.headline}</p>
        <p>${message}</p>
      </div>
    </div>
  `;
}

async function renderActivePreset(showcase, preset, nodes, viewerCanvas, isImmediate = false) {
  applyDetails(preset, nodes);

  if (!preset.modelAsset) {
    showcase.hideLoading();
    renderViewerFallback(preset, viewerCanvas, "当前条目未配置可用模型，已切换为海报与说明。");
    return;
  }

  try {
    await showcase.showPreset(preset, isImmediate);
  } catch (error) {
    console.warn("Failed to render preset model", preset.id, error);
    showcase.hideLoading();
    renderViewerFallback(preset, viewerCanvas, "模型资源未能正常加载，已切换为海报与说明。");
  }
}

async function bootstrap() {
  mountSharedNav();

  const root = document.querySelector("#costumes-app");
  root.innerHTML = createAppShell();

  const presetList = document.querySelector("#preset-list");
  const viewerCanvas = document.querySelector("#viewer-canvas");
  const nodes = {
    headline: document.querySelector("#detail-headline"),
    lead: document.querySelector("#detail-lead"),
    badge: document.querySelector("#detail-badge"),
    concept: document.querySelector("#detail-concept"),
    palette: document.querySelector("#detail-palette"),
    highlights: document.querySelector("#detail-highlights")
  };

  let activePreset = VIEW_PRESETS[0];
  VIEW_PRESETS.forEach((preset, index) => {
    presetList.appendChild(createPresetButton(preset, index === 0));
  });
  applyDetails(activePreset, nodes);

  const showcase = new CostumeShowcase(
    viewerCanvas,
    document.querySelector("#viewer-status"),
    document.querySelector("#viewer-overlay")
  );

  window.__costumePresets = VIEW_PRESETS;
  window.__costumeShowcase = showcase;

  await showcase.init();
  await renderActivePreset(showcase, activePreset, nodes, viewerCanvas, true);

  presetList.addEventListener("click", async (event) => {
    const trigger = event.target.closest(".selector-item");
    if (!trigger) return;

    const nextPreset = VIEW_PRESETS.find((item) => item.id === trigger.dataset.presetId);
    if (!nextPreset || nextPreset.id === activePreset.id) return;

    activePreset = nextPreset;
    presetList.querySelectorAll(".selector-item").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.presetId === nextPreset.id);
    });
    await renderActivePreset(showcase, nextPreset, nodes, viewerCanvas);
  });

  window.addEventListener("beforeunload", () => showcase.destroy(), { once: true });
}

bootstrap().catch((error) => {
  const root = document.querySelector("#costumes-app");
  root.innerHTML = `
    <section class="card error-state">
      <h1>模型展示加载失败</h1>
      <p>${error.message}</p>
    </section>
  `;
  console.error(error);
});
