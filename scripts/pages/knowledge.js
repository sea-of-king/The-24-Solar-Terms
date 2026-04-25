(function () {
  function initKnowledge() {
    var englishNames = {
      lichun: "Start of Spring",
      yushui: "Rain Water",
      jingzhe: "Awakening of Insects",
      chunfen: "Spring Equinox",
      qingming: "Pure Brightness",
      guyu: "Grain Rain",
      lixia: "Start of Summer",
      xiaoman: "Grain Buds",
      mangzhong: "Grain in Ear",
      xiazhi: "Summer Solstice",
      xiaoshu: "Minor Heat",
      dashu: "Major Heat",
      liqiu: "Start of Autumn",
      chushu: "End of Heat",
      bailu: "White Dew",
      qiufen: "Autumn Equinox",
      hanlu: "Cold Dew",
      shuangjiang: "Frost's Descent",
      lidong: "Start of Winter",
      xiaoxue: "Minor Snow",
      daxue: "Major Snow",
      dongzhi: "Winter Solstice",
      xiaohan: "Minor Cold",
      dahan: "Major Cold"
    };

    var seasonThemes = {
      "春": { start: "#edf5de", end: "#bfd9a7", ink: "#47653d", accent: "#8fb46d" },
      "夏": { start: "#e4f2ee", end: "#a6d3c8", ink: "#225f63", accent: "#56a39a" },
      "秋": { start: "#f8edd8", end: "#dfbf84", ink: "#865521", accent: "#c59553" },
      "冬": { start: "#eef2f8", end: "#becbdd", ink: "#40516e", accent: "#7e95b8" }
    };

    function getSeasonTheme(season) {
      return seasonThemes[season] || seasonThemes["春"];
    }

    function wrapText(context, text, maxWidth) {
      var lines = [];
      var currentLine = "";

      (text || "").split("").forEach(function (char) {
        var testLine = currentLine + char;
        if (context.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      });

      if (currentLine) lines.push(currentLine);
      return lines;
    }

    function drawRoundedRect(context, x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + width, y, x + width, y + height, radius);
      context.arcTo(x + width, y + height, x, y + height, radius);
      context.arcTo(x, y + height, x, y, radius);
      context.arcTo(x, y, x + width, y, radius);
      context.closePath();
    }

    function canvasToBlob(canvas) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve(blob);
        }, "image/png");
      });
    }

    async function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    }

    window.SiteShell.init("knowledge");
    Vue.createApp({
      data: function () {
        return {
          englishNames: englishNames,
          grouped: window.KnowledgeGrid.groupBySeason(window.SolarTermsAppData.terms || []),
          shareMessage: "",
          shareMessageTimer: null,
          workingTermId: null
        };
      },
      methods: {
        setShareMessage: function (message) {
          var self = this;
          this.shareMessage = message;
          if (this.shareMessageTimer) window.clearTimeout(this.shareMessageTimer);
          this.shareMessageTimer = window.setTimeout(function () {
            self.shareMessage = "";
            self.shareMessageTimer = null;
          }, 2400);
        },
        buildShareText: function (term) {
          return [
            term.nameZh + " | " + (this.englishNames[term.id] || term.pinyin),
            term.dateWindowText,
            term.summary,
            "习俗：" + term.customs.join(" / "),
            "意象：" + term.representativeThings.join(" / ")
          ].join("\n");
        },
        createTermCanvas: function (term) {
          var theme = getSeasonTheme(term.season);
          var canvas = document.createElement("canvas");
          canvas.width = 1080;
          canvas.height = 1440;

          var context = canvas.getContext("2d");
          var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, theme.start);
          gradient.addColorStop(1, theme.end);
          context.fillStyle = gradient;
          context.fillRect(0, 0, canvas.width, canvas.height);

          var softGlow = context.createRadialGradient(820, 280, 40, 820, 280, 340);
          softGlow.addColorStop(0, "rgba(255,255,255,0.92)");
          softGlow.addColorStop(1, "rgba(255,255,255,0)");
          context.fillStyle = softGlow;
          context.fillRect(0, 0, canvas.width, canvas.height);

          context.fillStyle = "rgba(255,255,255,0.72)";
          drawRoundedRect(context, 70, 70, 940, 1300, 40);
          context.fill();

          context.strokeStyle = "rgba(255,255,255,0.46)";
          context.lineWidth = 2;
          drawRoundedRect(context, 92, 92, 896, 1256, 30);
          context.stroke();

          context.fillStyle = theme.accent;
          context.globalAlpha = 0.16;
          context.beginPath();
          context.arc(820, 1100, 180, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;

          context.fillStyle = theme.ink;
          context.font = "36px 'Microsoft YaHei', sans-serif";
          context.fillText(term.season + "季节气", 120, 170);

          context.font = "bold 94px 'STKaiti', 'KaiTi', serif";
          context.fillText(term.nameZh, 120, 286);

          context.fillStyle = "rgba(55, 55, 55, 0.72)";
          context.font = "32px 'Georgia', 'Times New Roman', serif";
          context.fillText(this.englishNames[term.id] || term.pinyin, 120, 340);

          context.fillStyle = theme.ink;
          context.font = "30px 'Microsoft YaHei', sans-serif";
          context.fillText(term.dateWindowText, 120, 412);

          context.fillStyle = "rgba(255,255,255,0.92)";
          drawRoundedRect(context, 120, 474, 840, 250, 28);
          context.fill();

          context.fillStyle = theme.ink;
          context.font = "bold 34px 'Microsoft YaHei', sans-serif";
          context.fillText("节气简介", 156, 536);

          context.font = "30px 'Microsoft YaHei', sans-serif";
          wrapText(context, term.summary, 760).slice(0, 5).forEach(function (line, index) {
            context.fillText(line, 156, 596 + index * 46);
          });

          var sections = [
            { title: "气候变化", text: term.climateNotes.join(" / ") },
            { title: "民俗活动", text: term.customs.join(" / ") },
            { title: "色彩联想", text: term.colorImagery.join(" / ") },
            { title: "代表意象", text: term.representativeThings.join(" / ") }
          ];

          sections.forEach(function (section, index) {
            var x = index % 2 === 0 ? 120 : 548;
            var y = index < 2 ? 766 : 1010;

            context.fillStyle = "rgba(255,255,255,0.86)";
            drawRoundedRect(context, x, y, 392, 194, 24);
            context.fill();

            context.fillStyle = theme.ink;
            context.font = "bold 28px 'Microsoft YaHei', sans-serif";
            context.fillText(section.title, x + 28, y + 48);

            context.font = "26px 'Microsoft YaHei', sans-serif";
            wrapText(context, section.text, 334).slice(0, 4).forEach(function (line, lineIndex) {
              context.fillText(line, x + 28, y + 96 + lineIndex * 34);
            });
          });

          context.fillStyle = "rgba(55,55,55,0.7)";
          context.font = "24px 'Microsoft YaHei', sans-serif";
          context.fillText("二十四节气互动文化网页", 120, 1308);

          return canvas;
        },
        downloadCanvas: function (canvas, filename) {
          var link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = filename;
          link.click();
        },
        generateCard: async function (term) {
          this.workingTermId = term.id;
          try {
            var canvas = this.createTermCanvas(term);
            this.downloadCanvas(canvas, term.id + "-share-card.png");
            this.setShareMessage("节气卡片已生成");
          } finally {
            this.workingTermId = null;
          }
        },
        shareTerm: async function (term) {
          this.workingTermId = term.id;
          try {
            var canvas = this.createTermCanvas(term);
            var blob = await canvasToBlob(canvas);
            var shareText = this.buildShareText(term);
            var file = blob ? new File([blob], term.id + "-share-card.png", { type: "image/png" }) : null;

            if (navigator.share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: term.nameZh + "节气卡片",
                text: shareText,
                files: [file]
              });
              this.setShareMessage("分享已发起");
              return;
            }

            this.downloadCanvas(canvas, term.id + "-share-card.png");
            try {
              await copyText(shareText);
              this.setShareMessage("已下载卡片，并复制分享文案");
            } catch (error) {
              this.setShareMessage("已下载卡片");
            }
          } catch (error) {
            this.setShareMessage("分享生成失败，请重试");
          } finally {
            this.workingTermId = null;
          }
        }
      },
      beforeUnmount: function () {
        if (this.shareMessageTimer) {
          window.clearTimeout(this.shareMessageTimer);
          this.shareMessageTimer = null;
        }
      },
      template: `
        <div class="knowledge-share-feedback" :class="{ 'is-visible': !!shareMessage }">{{ shareMessage }}</div>
        <section v-for="group in grouped" :key="group.season" class="season-section card">
          <header class="season-section__header">
            <div>
              <p class="eyebrow">{{ group.season }}季</p>
              <h2>{{ group.season }}季节气知识卡</h2>
            </div>
            <span class="chip">{{ group.terms.length }} 个节气</span>
          </header>
          <div class="knowledge-grid">
            <article v-for="term in group.terms" :key="term.id" class="knowledge-card card">
              <div class="knowledge-card__top">
                <div>
                  <h3>{{ term.nameZh }}</h3>
                  <div class="knowledge-card__date">{{ term.dateWindowText }}</div>
                </div>
                <span class="chip">{{ englishNames[term.id] || term.pinyin }}</span>
              </div>
              <p class="knowledge-card__summary">{{ term.summary }}</p>
              <div class="knowledge-list">
                <strong>气候变化</strong>
                <span>{{ term.climateNotes.join(" / ") }}</span>
              </div>
              <div class="knowledge-list">
                <strong>民俗活动</strong>
                <span>{{ term.customs.join(" / ") }}</span>
              </div>
              <div class="knowledge-list">
                <strong>色彩联想</strong>
                <span>{{ term.colorImagery.join(" / ") }}</span>
              </div>
              <div class="knowledge-list">
                <strong>代表意象</strong>
                <span>{{ term.representativeThings.join(" / ") }}</span>
              </div>
              <div class="knowledge-card__actions">
                <button
                  class="knowledge-card__action"
                  type="button"
                  :disabled="workingTermId === term.id"
                  @click="generateCard(term)"
                >
                  {{ workingTermId === term.id ? "生成中..." : "生成卡片" }}
                </button>
                <button
                  class="knowledge-card__action knowledge-card__action--primary"
                  type="button"
                  :disabled="workingTermId === term.id"
                  @click="shareTerm(term)"
                >
                  {{ workingTermId === term.id ? "处理中..." : "一键分享" }}
                </button>
              </div>
            </article>
          </div>
        </section>
      `
    }).mount("#knowledge-app");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initKnowledge);
  else initKnowledge();
})();
