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

}

function mountSharedFooter() {
  const container = document.querySelector("#site-footer");
  if (!container) return;

  if (window.FooterRenderer && typeof window.FooterRenderer.mount === "function") {
    window.FooterRenderer.mount(container);
  }
}

function createAppShell() {
  return `
    <div class="costumes-page">
      <section class="page-intro">
        <p class="eyebrow">服装展示</p>
        <h1>循节气，观衣章</h1>
        <p>
          一袭有时序，半卷见风雅。
        </p>
      </section>

      <section class="costumes-layout">
        <aside class="selector-panel card">
          <div class="selector-panel__header">
            <h2>衣章小录</h2>
            <p>随四时流转，静看纹理生香。</p>
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
              <h3>衣意</h3>
              <p id="detail-concept"></p>
            </article>
            <article class="card detail-card">
              <h3>色韵</h3>
              <p id="detail-palette"></p>
            </article>
            <article class="card detail-card detail-card--wide">
              <h3>可观处</h3>
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
  mountSharedFooter();

  const root = document.querySelector("#costumes-app");
  root.dataset.costumesRenderer = "model";
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
  console.error(error);

  if (window.CostumesPageRenderer && typeof window.CostumesPageRenderer.mount === "function") {
    window.CostumesPageRenderer.mount({
      viewerMessage: "3D 模型暂不可用，已保留静态海报与说明；无需启动 npm run dev 也可浏览。"
    });
    return;
  }

  const root = document.querySelector("#costumes-app");
  root.innerHTML = `
    <section class="card error-state">
      <h1>模型展示加载失败</h1>
      <p>${error.message}</p>
    </section>
  `;
});
