(function () {
  var TERM_START_DATES = {
    lichun: { month: 2, day: 4 },
    yushui: { month: 2, day: 19 },
    jingzhe: { month: 3, day: 5 },
    chunfen: { month: 3, day: 20 },
    qingming: { month: 4, day: 4 },
    guyu: { month: 4, day: 20 },
    lixia: { month: 5, day: 5 },
    xiaoman: { month: 5, day: 21 },
    mangzhong: { month: 6, day: 5 },
    xiazhi: { month: 6, day: 21 },
    xiaoshu: { month: 7, day: 7 },
    dashu: { month: 7, day: 22 },
    liqiu: { month: 8, day: 7 },
    chushu: { month: 8, day: 23 },
    bailu: { month: 9, day: 7 },
    qiufen: { month: 9, day: 23 },
    hanlu: { month: 10, day: 8 },
    shuangjiang: { month: 10, day: 23 },
    lidong: { month: 11, day: 7 },
    xiaoxue: { month: 11, day: 22 },
    daxue: { month: 12, day: 7 },
    dongzhi: { month: 12, day: 21 },
    xiaohan: { month: 1, day: 5 },
    dahan: { month: 1, day: 20 }
  };

  function getTermStartTime(termId, year) {
    var config = TERM_START_DATES[termId];
    if (!config) return null;
    return new Date(year, config.month - 1, config.day, 0, 0, 0, 0);
  }

  function resolveCurrentTerm(terms, now) {
    if (!terms || !terms.length) return null;

    var currentYear = now.getFullYear();
    var previousYear = currentYear - 1;
    var candidates = [];

    terms.forEach(function (term) {
      var currentStart = getTermStartTime(term.id, currentYear);
      var previousStart = getTermStartTime(term.id, previousYear);

      if (currentStart) candidates.push({ term: term, startAt: currentStart });
      if (previousStart) candidates.push({ term: term, startAt: previousStart });
    });

    candidates.sort(function (a, b) {
      return a.startAt.getTime() - b.startAt.getTime();
    });

    var active = candidates[0];
    candidates.forEach(function (item) {
      if (item.startAt.getTime() <= now.getTime()) {
        active = item;
      }
    });

    return active ? active.term : terms[0];
  }

  function initTimeline() {
    window.SiteShell.init("timeline");

    Vue.createApp({
      data: function () {
        var terms = window.SolarTermsAppData.terms || [];
        var now = new Date();
        var detectedTerm = resolveCurrentTerm(terms, now);

        return {
          terms: terms,
          selectedTermId: detectedTerm ? detectedTerm.id : (terms.length ? terms[0].id : null),
          hoveredGraphNodeId: null,
          activeMediaTab: "graph",
          videoSource: "../assets/videos/total.mp4",
          now: now,
          clockTimer: null
        };
      },
      computed: {
        liveDateText: function () {
          var now = this.now;
          return [
            now.getFullYear() + "年",
            String(now.getMonth() + 1).padStart(2, "0") + "月",
            String(now.getDate()).padStart(2, "0") + "日"
          ].join(" ");
        },
        autoCurrentTerm: function () {
          return resolveCurrentTerm(this.terms, this.now);
        },
        autoCurrentTermText: function () {
          if (!this.autoCurrentTerm) return "";
          return this.autoCurrentTerm.nameZh + " · " + this.autoCurrentTerm.dateWindowText;
        },
        currentTerm: function () {
          return window.SolarTermsAppData.getTermById(this.selectedTermId);
        },
        currentScene: function () {
          return this.currentTerm ? window.SolarTermsAppData.getTimelineSceneById(this.currentTerm.timelineSceneId) : null;
        },
        currentIndex: function () {
          var self = this;
          return this.terms.findIndex(function (term) {
            return term.id === self.selectedTermId;
          });
        },
        previousTerm: function () {
          return this.currentIndex > 0 ? this.terms[this.currentIndex - 1] : null;
        },
        nextTerm: function () {
          return this.currentIndex >= 0 && this.currentIndex < this.terms.length - 1 ? this.terms[this.currentIndex + 1] : null;
        },
        sceneTermNames: function () {
          var self = this;
          if (!this.currentScene) return "";

          return this.currentScene.representedTermIds.map(function (id) {
            var term = self.terms.find(function (item) {
              return item.id === id;
            });
            return term ? term.nameZh : id;
          }).join(" / ");
        },
        graphNodes: function () {
          if (!this.currentTerm) return [];

          var currentSeasonKey = this.getSeasonKey(this.currentTerm.season);
          var nodes = [
            {
              id: "term",
              label: this.currentTerm.nameZh,
              meta: this.currentTerm.dateWindowText,
              type: "term",
              seasonKey: currentSeasonKey,
              x: 50,
              y: 50,
              clickable: false
            },
            {
              id: "season",
              label: this.currentTerm.season + "季",
              meta: "时序归属",
              type: "season",
              seasonKey: currentSeasonKey,
              x: 50,
              y: 14,
              clickable: false
            }
          ];

          if (this.currentScene) {
            nodes.push({
              id: "scene",
              label: this.currentScene.title,
              meta: "对应场景",
              type: "scene",
              seasonKey: currentSeasonKey,
              x: 18,
              y: 26,
              clickable: false
            });
          }

          if (this.previousTerm) {
            nodes.push({
              id: "previous",
              label: this.previousTerm.nameZh,
              meta: "上一节气",
              type: "previous",
              seasonKey: this.getSeasonKey(this.previousTerm.season),
              x: 22,
              y: 72,
              clickable: true,
              targetId: this.previousTerm.id
            });
          }

          if (this.nextTerm) {
            nodes.push({
              id: "next",
              label: this.nextTerm.nameZh,
              meta: "下一节气",
              type: "next",
              seasonKey: this.getSeasonKey(this.nextTerm.season),
              x: 78,
              y: 72,
              clickable: true,
              targetId: this.nextTerm.id
            });
          }

          (this.currentTerm.customs || []).slice(0, 2).forEach(function (item, index) {
            nodes.push({
              id: "custom-" + index,
              label: item,
              meta: "民俗活动",
              type: "custom",
              seasonKey: currentSeasonKey,
              x: index === 0 ? 82 : 78,
              y: index === 0 ? 24 : 44,
              clickable: false
            });
          });

          (this.currentTerm.representativeThings || []).slice(0, 2).forEach(function (item, index) {
            nodes.push({
              id: "thing-" + index,
              label: item,
              meta: "代表意象",
              type: "thing",
              seasonKey: currentSeasonKey,
              x: index === 0 ? 16 : 34,
              y: index === 0 ? 44 : 86,
              clickable: false
            });
          });

          return nodes;
        },
        graphLinks: function () {
          return this.graphNodes
            .filter(function (node) {
              return node.id !== "term";
            })
            .map(function (node) {
              return {
                id: "link-" + node.id,
                targetId: node.id,
                x1: 50,
                y1: 50,
                x2: node.x,
                y2: node.y
              };
            });
        }
      },
      methods: {
        getSeasonKey: function (season) {
          var map = {
            "春": "spring",
            "夏": "summer",
            "秋": "autumn",
            "冬": "winter"
          };
          return map[season] || "spring";
        },
        formatOrder: function (order) {
          return String(order).padStart(2, "0");
        },
        handleGraphNodeEnter: function (node) {
          if (!node) return;
          this.hoveredGraphNodeId = node.id;
        },
        clearGraphHover: function () {
          this.hoveredGraphNodeId = null;
        },
        isGraphNodeHighlighted: function (nodeId) {
          if (!this.hoveredGraphNodeId) return false;
          if (this.hoveredGraphNodeId === "term") return true;
          return nodeId === "term" || nodeId === this.hoveredGraphNodeId;
        },
        isGraphNodeDimmed: function (nodeId) {
          return !!this.hoveredGraphNodeId && !this.isGraphNodeHighlighted(nodeId);
        },
        isGraphLinkHighlighted: function (link) {
          if (!this.hoveredGraphNodeId) return false;
          if (this.hoveredGraphNodeId === "term") return true;
          return link && link.targetId === this.hoveredGraphNodeId;
        },
        isGraphLinkDimmed: function (link) {
          return !!this.hoveredGraphNodeId && !this.isGraphLinkHighlighted(link);
        },
        selectTerm: function (termId) {
          this.clearGraphHover();
          this.selectedTermId = termId;
        },
        setMediaTab: function (tab) {
          this.activeMediaTab = tab;
          if (tab !== "graph") this.clearGraphHover();
        },
        activateGraphNode: function (node) {
          if (node && node.clickable && node.targetId) {
            this.selectTerm(node.targetId);
          }
        }
      },
      mounted: function () {
        var self = this;
        this.clockTimer = window.setInterval(function () {
          self.now = new Date();
        }, 60000);
      },
      beforeUnmount: function () {
        if (this.clockTimer) {
          window.clearInterval(this.clockTimer);
          this.clockTimer = null;
        }
      },
      template: `
        <section class="page-intro page-intro--with-status">
          <div class="page-intro__main">
            <p class="eyebrow">节气流转图谱</p>
            <h1>从时间脉络中观察二十四节气的流转与意象连接</h1>
            <p>以时间轴与关系图谱并置的方式，呈现节气在一年中的顺序、相邻关系、场景表达与民俗意象，让浏览时能快速建立完整的时序认知。</p>
          </div>
          <aside class="timeline-status-bar card" aria-label="当前时间与当前节气">
            <span class="timeline-status-bar__label">当前日期</span>
            <span class="timeline-status-bar__time">{{ liveDateText }}</span>
            <span class="timeline-status-bar__term">{{ autoCurrentTermText }}</span>
          </aside>
        </section>
        <section class="graph-layout">
          <section class="graph-stage card">
            <div class="graph-stage__header">
              <div>
                <h2>{{ currentTerm ? currentTerm.nameZh + ' 节气关系图' : '节气关系图谱' }}</h2>
                <p class="muted">{{ currentTerm ? currentTerm.dateWindowText + ' · ' + currentTerm.season + '季' : '' }}</p>
              </div>
              <div class="media-switch" role="tablist" aria-label="图谱与视频切换">
                <button
                  class="media-switch__button"
                  :class="{ 'is-active': activeMediaTab === 'graph' }"
                  type="button"
                  role="tab"
                  :aria-selected="activeMediaTab === 'graph' ? 'true' : 'false'"
                  @click="setMediaTab('graph')"
                >
                  关系图谱
                </button>
                <button
                  class="media-switch__button"
                  :class="{ 'is-active': activeMediaTab === 'video' }"
                  type="button"
                  role="tab"
                  :aria-selected="activeMediaTab === 'video' ? 'true' : 'false'"
                  @click="setMediaTab('video')"
                >
                  节气视频
                </button>
              </div>
            </div>
            <div
              v-if="activeMediaTab === 'graph'"
              class="term-knowledge-graph"
              :class="{ 'is-interacting': !!hoveredGraphNodeId }"
              @mouseleave="clearGraphHover"
            >
              <svg class="graph-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line
                  v-for="link in graphLinks"
                  :key="link.id"
                  :class="{
                    'is-active': isGraphLinkHighlighted(link),
                    'is-dimmed': isGraphLinkDimmed(link)
                  }"
                  :x1="link.x1"
                  :y1="link.y1"
                  :x2="link.x2"
                  :y2="link.y2"
                />
              </svg>
              <button
                v-for="node in graphNodes"
                :key="node.id"
                class="graph-node"
                :class="[
                  'graph-node--' + node.type,
                  'graph-node--season-' + node.seasonKey,
                  {
                    'is-clickable': node.clickable,
                    'is-active': isGraphNodeHighlighted(node.id),
                    'is-dimmed': isGraphNodeDimmed(node.id)
                  }
                ]"
                type="button"
                :style="{ left: node.x + '%', top: node.y + '%' }"
                @click="activateGraphNode(node)"
                @mouseenter="handleGraphNodeEnter(node)"
                @focus="handleGraphNodeEnter(node)"
                @blur="clearGraphHover"
              >
                <span class="graph-node__meta">{{ node.meta }}</span>
                <span class="graph-node__label">{{ node.label }}</span>
              </button>
            </div>
            <div v-else class="term-video-panel">
              <video class="term-video-panel__player" controls preload="metadata">
                <source :src="videoSource" type="video/mp4">
                当前浏览器不支持视频播放。
              </video>
            </div>
          </section>
          <aside class="graph-side">
            <article v-if="currentTerm" class="card detail-panel">
              <h3>节气概览</h3>
              <p>{{ currentTerm.summary }}</p>
              <div class="chip-row">
                <span v-for="item in currentTerm.colorImagery.slice(0, 3)" :key="item" class="chip">{{ item }}</span>
              </div>
            </article>
            <article v-if="currentScene" class="card detail-panel">
              <h3>场景映射</h3>
              <p>{{ currentScene.themeText }}</p>
              <p class="detail-panel__caption">覆盖节气：{{ sceneTermNames }}</p>
            </article>
            <article v-if="currentTerm" class="card detail-panel">
              <h3>图谱信息</h3>
              <div class="detail-list">
                <div>
                  <strong>民俗活动</strong>
                  <span>{{ currentTerm.customs.join(' / ') }}</span>
                </div>
                <div>
                  <strong>代表意象</strong>
                  <span>{{ currentTerm.representativeThings.join(' / ') }}</span>
                </div>
                <div>
                  <strong>色彩联想</strong>
                  <span>{{ currentTerm.colorImagery.join(' / ') }}</span>
                </div>
              </div>
            </article>
          </aside>
        </section>
        <section class="timeline-nodes card">
          <div class="section-header section-header--compact">
            <div>
              <p class="eyebrow">节气概览</p>
              <h2>按顺序浏览二十四节气，快速切换查看对应图谱与内容</h2>
            </div>
          </div>
          <div class="timeline-node-grid">
            <button
              v-for="term in terms"
              :key="term.id"
              class="timeline-node"
              :class="{ 'is-active': term.id === selectedTermId }"
              type="button"
              @click="selectTerm(term.id)"
            >
              <span class="timeline-node__order">#{{ formatOrder(term.order) }}</span>
              <span class="timeline-node__name">{{ term.nameZh }}</span>
              <span class="timeline-node__season">{{ term.season }}季</span>
            </button>
          </div>
        </section>
      `
    }).mount("#timeline-app");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTimeline);
  else initTimeline();
})();
