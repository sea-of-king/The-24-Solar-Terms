(function () {
  var STORAGE_KEY = "solar-agent-chat";
  var API = "http://127.0.0.1:8765/api/agent";

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) { /* quota exceeded — silently drop */ }
  }

  window.SiteShell && window.SiteShell.init();

  var appEl = document.getElementById("agent-app");
  if (!appEl || !window.Vue) return;

  Vue.createApp({
    data: function () {
      return {
        messages: loadHistory(),
        input: "",
        loading: false
      };
    },
    watch: {
      messages: {
        deep: true,
        handler: function (val) { saveHistory(val); }
      }
    },
    methods: {
      sendMessage: function () {
        var query = this.input.trim();
        if (!query || this.loading) return;

        this.messages.push({ role: "user", text: query });
        this.input = "";
        this.loading = true;
        this.$nextTick(this.scrollBottom);

        var self = this;
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          self.messages.push({
            role: "agent",
            text: data.response,
            intent: data.intent,
            term: data.term
          });
          self.loading = false;
          self.$nextTick(self.scrollBottom);
        })
        .catch(function () {
          self.messages.push({
            role: "error",
            text: "智能体服务未启动，请运行 python agent_server.py"
          });
          self.loading = false;
          self.$nextTick(self.scrollBottom);
        });
      },
      scrollBottom: function () {
        var area = this.$el.querySelector(".chat-area");
        if (area) area.scrollTop = area.scrollHeight;
      }
    },
    template: [
      '<div class="chat-area" ref="chat">',
      '  <div v-if="messages.length === 0" class="chat-empty">',
      '    <div>✨ 向节气专家提问吧</div>',
      '    <div style="font-size:12px;color:#b0a898">例如：立春有什么习俗 · 冬至如何养生 · 大暑天气特点</div>',
      '  </div>',
      '  <div v-for="(m, i) in messages" :key="i" :class="[\'msg\', \'msg--\' + m.role]">',
      '    <span class="msg__label">{{ m.role === "user" ? "你" : m.role === "agent" ? "节气专家" : "" }}</span>',
      '    <div class="msg__bubble">{{ m.text }}</div>',
      '  </div>',
      '</div>',
      '<div class="chat-input-area">',
      '  <input type="text" v-model="input"',
      '    placeholder="输入你想了解的节气问题…"',
      '    @keyup.enter="sendMessage"',
      '    :disabled="loading" />',
      '  <button @click="sendMessage" :disabled="loading || !input.trim()">',
      '    <span v-if="!loading">&#8593;</span>',
      '    <span v-else style="animation: msg-in .3s infinite">&#8943;</span>',
      '  </button>',
      '</div>'
    ].join("\n")
  }).mount(appEl);
})();
