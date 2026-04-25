(function () {
  var TERM_SCHEDULE = [
    { id: "lichun", month: 2, day: 4 },
    { id: "yushui", month: 2, day: 19 },
    { id: "jingzhe", month: 3, day: 6 },
    { id: "chunfen", month: 3, day: 21 },
    { id: "qingming", month: 4, day: 5 },
    { id: "guyu", month: 4, day: 20 },
    { id: "lixia", month: 5, day: 6 },
    { id: "xiaoman", month: 5, day: 21 },
    { id: "mangzhong", month: 6, day: 6 },
    { id: "xiazhi", month: 6, day: 21 },
    { id: "xiaoshu", month: 7, day: 7 },
    { id: "dashu", month: 7, day: 23 },
    { id: "liqiu", month: 8, day: 8 },
    { id: "chushu", month: 8, day: 23 },
    { id: "bailu", month: 9, day: 8 },
    { id: "qiufen", month: 9, day: 23 },
    { id: "hanlu", month: 10, day: 8 },
    { id: "shuangjiang", month: 10, day: 24 },
    { id: "lidong", month: 11, day: 8 },
    { id: "xiaoxue", month: 11, day: 22 },
    { id: "daxue", month: 12, day: 7 },
    { id: "dongzhi", month: 12, day: 22 },
    { id: "xiaohan", month: 1, day: 6 },
    { id: "dahan", month: 1, day: 20 }
  ];

  var SEASON_LABELS = ["春", "夏", "秋", "冬"];
  var SEASON_DESCRIPTIONS = {
    "春": "新枝未满，风先柔了。草木将醒未醒，一切都带着将要发生的轻意。",
    "夏": "日光漫长，叶影浓密。万物都向上生长，连空气里也像盛着热烈的回响。",
    "秋": "露意渐白，天色渐高。收获与清澈一同抵达，世界忽然显得格外安静明净。",
    "冬": "霜雪轻覆，声息内敛。万物向内收藏，寒意之下却仍藏着下一轮新生。"
  };
  var SEASON_STYLES = {
    "春": { tone: "春意初醒", accent: "新绿、晴光、微风", range: "立春 - 谷雨" },
    "夏": { tone: "夏气正盛", accent: "浓翠、长日、繁茂", range: "立夏 - 大暑" },
    "秋": { tone: "秋色转清", accent: "白露、禾色、澄明", range: "立秋 - 霜降" },
    "冬": { tone: "冬藏待新", accent: "寒雪、暗梅、静夜", range: "立冬 - 大寒" }
  };

  function buildScheduleMap(terms) {
    return TERM_SCHEDULE.map(function (item, index) {
      var term = terms.find(function (candidate) {
        return candidate.id === item.id;
      });
      return {
        id: item.id,
        month: item.month,
        day: item.day,
        term: term,
        order: index + 1
      };
    }).filter(function (entry) {
      return !!entry.term;
    });
  }

  function createTermDate(month, day, year) {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function getCurrentContext(schedule) {
    var now = new Date();
    var thisYear = now.getFullYear();
    var current = schedule[0];
    var next = schedule[0];

    for (var i = 0; i < schedule.length; i += 1) {
      var start = createTermDate(schedule[i].month, schedule[i].day, thisYear);
      var endIndex = (i + 1) % schedule.length;
      var endYear = schedule[endIndex].month < schedule[i].month ? thisYear + 1 : thisYear;
      var end = createTermDate(schedule[endIndex].month, schedule[endIndex].day, endYear);

      if (now >= start && now < end) {
        current = schedule[i];
        next = schedule[endIndex];
        break;
      }

      if (now < start) {
        current = schedule[(i + schedule.length - 1) % schedule.length];
        next = schedule[i];
        break;
      }
    }

    var currentStartYear = current.month > next.month ? thisYear - 1 : thisYear;
    var currentStart = createTermDate(current.month, current.day, currentStartYear);
    var nextYear = next.month < current.month ? currentStartYear + 1 : currentStartYear;
    var nextStart = createTermDate(next.month, next.day, nextYear);
    var progress = Math.min(100, Math.max(0, ((now - currentStart) / (nextStart - currentStart)) * 100));
    var diffDays = Math.max(0, Math.ceil((nextStart - now) / 86400000));

    return {
      current: current,
      next: next,
      progress: Math.round(progress),
      daysUntilNext: diffDays
    };
  }

  function formatCurrentTime(date) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long",
      month: "numeric",
      day: "numeric",
      hour12: false
    }).format(date);
  }

  function buildModules() {
    return [
      {
        title: "先看形与色",
        href: "pages/costumes.html",
        kicker: "衣饰展面",
        description: "若想先被画面打动，就从服饰开始。节气的色泽与形态，会比解释更早抵达心里。",
        tags: ["看风姿", "看色彩", "看节令神情"],
        metrics: ["更偏视觉", "适合先入情境"]
      },
      {
        title: "再看时与序",
        href: "pages/timeline.html",
        kicker: "时序长卷",
        description: "若想把一年完整走一遍，就沿时间轴缓缓向前。节气会像卷轴一样，一段一段展开。",
        tags: ["看流转", "看递进", "看四季次第"],
        metrics: ["更偏整体", "适合慢慢浏览"]
      },
      {
        title: "细读意与事",
        href: "pages/knowledge.html",
        kicker: "文字展签",
        description: "若想静下来细读，可以进入知识页。那里像一册可翻阅的小集，适合反复停留。",
        tags: ["看意象", "看线索", "看文化细部"],
        metrics: ["更偏阅读", "适合安静停留"]
      }
    ];
  }

  function buildHighlights(context, terms) {
    var currentTerm = context.current.term;
    var nextTerm = context.next.term;
    var springTerm = terms.find(function (term) { return term.id === "chunfen"; }) || terms[3];
    var autumnTerm = terms.find(function (term) { return term.id === "bailu"; }) || terms[14];

    return [
      {
        label: "此刻",
        title: currentTerm ? currentTerm.nameZh : "当前节气",
        description: currentTerm
          ? "从当下开始，最容易与节气相遇。此刻属于“" + currentTerm.nameZh + "”，也属于这一天正在流动的气息。"
          : "从当下开始，最容易与节气相遇。",
        chips: [
          currentTerm ? currentTerm.season + "季" : "四季流转中",
          "进度 " + context.progress + "%"
        ]
      },
      {
        label: "将至",
        title: nextTerm ? nextTerm.nameZh : "下一节气",
        description: nextTerm
          ? "还有 " + context.daysUntilNext + " 天，另一段风意便会轻轻接上。节气的动人，往往就在这种不露声色的递转之间。"
          : "下一段节气正在靠近。",
        chips: [
          "还有 " + context.daysUntilNext + " 天",
          nextTerm ? nextTerm.season + "季" : "稍后揭晓"
        ]
      },
      {
        label: "适合停留",
        title: springTerm && autumnTerm ? springTerm.nameZh + " 与 " + autumnTerm.nameZh : "节气对看",
        description: springTerm && autumnTerm
          ? "一个偏明净舒展，一个偏清润沉静。把它们并置，是想让季节之间的细微气质先被看见。"
          : "从两个气质不同的节气开始，更容易读出四季的差异。",
        chips: ["先感受", "再深入"]
      }
    ];
  }

  function buildJourneys() {
    return [
      {
        title: "若想先被画面牵引",
        description: "从服饰页开始最好。先看颜色与姿态，再回到首页看四季，会更容易读出节气的神情。",
        tags: ["由形入意", "更有沉浸感"]
      },
      {
        title: "若想顺着时间慢看",
        description: "时间轴最适合。一路向前，节气不会显得零散，而像一年在人间慢慢铺开的纹理。",
        tags: ["由序入境", "适合完整浏览"]
      },
      {
        title: "若想安静地读",
        description: "知识页会更合适。把节气当作一篇篇短章去读，往往能读出比图像更绵长的余味。",
        tags: ["由意入心", "适合细读"]
      }
    ];
  }

  function buildFeaturedTerms(terms) {
    return [terms[0], terms[6], terms[15], terms[21]].filter(Boolean).map(function (term) {
      var line = term.summary;
      if (term.id === "lichun") line = "风从寒意里回身，春意才刚刚落在枝头。";
      else if (term.id === "lixia") line = "光开始浓起来，草木与热意一同向上生长。";
      else if (term.id === "qiufen") line = "昼夜渐衡，清气浮起，世界显出一种安稳的明净。";
      else if (term.id === "dongzhi") line = "寒夜最深处，也藏着日光重新归来的消息。";

      return {
        id: term.id,
        season: term.season,
        pinyin: term.pinyin,
        nameZh: term.nameZh,
        line: line,
        meta: term.dateWindowText,
        tags: (term.representativeThings || []).slice(0, 2)
      };
    });
  }

  function initHome() {
    window.SiteShell.init("home");

    var terms = window.SolarTermsAppData.terms || [];
    var schedule = buildScheduleMap(terms);
    var context = getCurrentContext(schedule);
    var modules = buildModules();
    var highlights = buildHighlights(context, terms);
    var journeys = buildJourneys();
    var featuredTerms = buildFeaturedTerms(terms);
    var seasonCards = SEASON_LABELS.map(function (seasonLabel) {
      var seasonTerms = terms.filter(function (term) {
        return term.season === seasonLabel;
      });
      var style = SEASON_STYLES[seasonLabel];
      return {
        season: seasonLabel,
        tone: style.tone,
        accent: style.accent,
        range: style.range,
        description: SEASON_DESCRIPTIONS[seasonLabel],
        terms: seasonTerms.slice(0, 6)
      };
    });

    Vue.createApp({
      data: function () {
        return {
          currentTerm: context.current.term,
          nextTerm: context.next.term,
          progress: context.progress,
          daysUntilNext: context.daysUntilNext
        };
      },
      template: '' +
        '<div class="season-spotlight" v-if="currentTerm && nextTerm">' +
        '  <div class="season-spotlight__header">' +
        '    <span class="pill">此刻行至 {{ currentTerm.season }}季</span>' +
        '    <span class="pill">{{ nextTerm.nameZh }} 将在 {{ daysUntilNext }} 天后到来</span>' +
        '  </div>' +
        '  <div class="season-spotlight__body">' +
        '    <div>' +
        '      <p class="season-spotlight__label">当下展签</p>' +
        '      <h3>{{ currentTerm.nameZh }}</h3>' +
        '      <p>{{ currentTerm.summary }}</p>' +
        '    </div>' +
        '    <div class="season-spotlight__next">' +
        '      <p class="season-spotlight__label">下一段风意</p>' +
        '      <strong>{{ nextTerm.nameZh }}</strong>' +
        '      <span>{{ nextTerm.summary }}</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="season-progress">' +
        '    <div class="season-progress__track"><span :style="{ width: progress + \'%\' }"></span></div>' +
        '    <div class="season-progress__meta"><span>这一段节令已经行过</span><strong>{{ progress }}%</strong></div>' +
        '  </div>' +
        '</div>'
    }).mount("#hero-season-spotlight");

    Vue.createApp({
      data: function () {
        return {
          stats: [
            { value: "24", label: "节气缀成长卷" },
            { value: "4", label: "四季各成展面" },
            { value: "3", label: "三种靠近方式" }
          ]
        };
      },
      template: '' +
        '<div class="hero-stats-grid">' +
        '  <article class="hero-stat card" v-for="stat in stats" :key="stat.label">' +
        '    <strong>{{ stat.value }}</strong>' +
        '    <span>{{ stat.label }}</span>' +
        '  </article>' +
        '</div>'
    }).mount("#hero-stats");

    if (document.querySelector("#hero-now-panel")) {
      Vue.createApp({
        data: function () {
          return {
            nowText: formatCurrentTime(new Date()),
            currentTerm: context.current.term,
            nextTerm: context.next.term,
            daysUntilNext: context.daysUntilNext,
            timerId: null
          };
        },
        mounted: function () {
          var self = this;
          self.timerId = window.setInterval(function () {
            self.nowText = formatCurrentTime(new Date());
          }, 1000);
        },
        beforeUnmount: function () {
          if (this.timerId) {
            window.clearInterval(this.timerId);
          }
        },
        template: '' +
          '<div class="hero-now-grid">' +
          '  <article class="hero-now-card hero-now-card--time">' +
          '    <p class="hero-now-card__label">此刻时间</p>' +
          '    <strong>{{ nowText }}</strong>' +
          '    <span>适合先停留片刻，再沿着节气继续往前看。</span>' +
          '  </article>' +
          '  <article class="hero-now-card">' +
          '    <p class="hero-now-card__label">当前节气</p>' +
          '    <strong>{{ currentTerm ? currentTerm.nameZh : "节气载入中" }}</strong>' +
          '    <span v-if="currentTerm">{{ currentTerm.season }}季 · {{ currentTerm.pinyin }}</span>' +
          '    <span v-else>请稍候</span>' +
          '  </article>' +
          '  <article class="hero-now-card">' +
          '    <p class="hero-now-card__label">下一节气</p>' +
          '    <strong>{{ nextTerm ? nextTerm.nameZh : "节气载入中" }}</strong>' +
          '    <span>{{ daysUntilNext }} 天后到来</span>' +
          '  </article>' +
          '</div>'
      }).mount("#hero-now-panel");
    }

    Vue.createApp({
      data: function () {
        return { seasonCards: seasonCards };
      },
      template: '' +
        '<div class="season-rhythm-grid">' +
        '  <article class="season-rhythm-card card" v-for="card in seasonCards" :key="card.season">' +
        '    <div class="season-rhythm-card__ornament"></div>' +
        '    <p class="eyebrow">{{ card.tone }}</p>' +
        '    <div class="season-rhythm-card__header">' +
        '      <h3>{{ card.season }}季</h3>' +
        '      <span class="pill">{{ card.range }}</span>' +
        '    </div>' +
        '    <p class="season-rhythm-card__description">{{ card.description }}</p>' +
        '    <div class="chip-row">' +
        '      <span class="chip">{{ card.accent }}</span>' +
        '      <span class="chip" v-for="term in card.terms.slice(0, 3)" :key="term.id">{{ term.nameZh }}</span>' +
        '    </div>' +
        '    <div class="season-rhythm-card__line">' +
        '      <span v-for="term in card.terms" :key="term.id">{{ term.nameZh }}</span>' +
        '    </div>' +
        '  </article>' +
        '</div>'
    }).mount("#season-rhythm");

    Vue.createApp({
      data: function () {
        return { modules: modules };
      },
      template: '' +
        '<div class="module-grid">' +
        '  <a v-for="module in modules" :key="module.title" class="module-card card" :href="module.href">' +
        '    <p class="module-card__kicker">{{ module.kicker }}</p>' +
        '    <h3>{{ module.title }}</h3>' +
        '    <p>{{ module.description }}</p>' +
        '    <div class="module-card__metrics">' +
        '      <span v-for="metric in module.metrics" :key="metric">{{ metric }}</span>' +
        '    </div>' +
        '    <div class="module-card__meta">' +
        '      <span v-for="tag in module.tags" :key="tag" class="chip">{{ tag }}</span>' +
        '    </div>' +
        '  </a>' +
        '</div>'
    }).mount("#home-app");

    Vue.createApp({
      data: function () {
        return { highlights: highlights };
      },
      template: '' +
        '<div class="home-highlights-grid">' +
        '  <article class="home-highlight card" v-for="item in highlights" :key="item.title">' +
        '    <p class="eyebrow">{{ item.label }}</p>' +
        '    <h3>{{ item.title }}</h3>' +
        '    <p>{{ item.description }}</p>' +
        '    <div class="module-card__meta">' +
        '      <span class="chip" v-for="chip in item.chips" :key="chip">{{ chip }}</span>' +
        '    </div>' +
        '  </article>' +
        '</div>'
    }).mount("#home-highlights");

    Vue.createApp({
      data: function () {
        return { journeys: journeys };
      },
      template: '' +
        '<div class="home-highlights-grid">' +
        '  <article class="home-highlight card" v-for="item in journeys" :key="item.title">' +
        '    <p class="eyebrow">浏览建议</p>' +
        '    <h3>{{ item.title }}</h3>' +
        '    <p>{{ item.description }}</p>' +
        '    <div class="module-card__meta">' +
        '      <span class="chip" v-for="tag in item.tags" :key="tag">{{ tag }}</span>' +
        '    </div>' +
        '  </article>' +
        '</div>'
    }).mount("#home-journey");

    Vue.createApp({
      data: function () {
        return { featuredTerms: featuredTerms };
      },
      template: '' +
        '<div class="featured-terms-grid">' +
        '  <article v-for="term in featuredTerms" :key="term.id" class="term-card card">' +
        '    <p class="eyebrow">{{ term.season }}季 · {{ term.pinyin }}</p>' +
        '    <h3>{{ term.nameZh }}</h3>' +
        '    <p>{{ term.line }}</p>' +
        '    <div class="term-card__meta">' +
        '      <span class="chip">{{ term.meta }}</span>' +
        '      <span class="chip" v-for="tag in term.tags" :key="tag">{{ tag }}</span>' +
        '    </div>' +
        '  </article>' +
        '</div>'
    }).mount("#featured-terms");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome);
  } else {
    initHome();
  }
})();
