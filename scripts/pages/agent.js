(function () {
  var STORAGE_KEY = "solar-agent-chat";
  var CONVERSATION_KEY = "solar-agent-conversation";
  var VISITOR_KEY = "solar-agent-visitor";
  var ASSISTANT_ID = "solar-terms";
  var API = resolveAgentApiUrl();

  function isLocalHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }

  function resolveAgentApiUrl() {
    var location = window.location;
    if (isLocalHost(location.hostname)) {
      return location.protocol + "//" + location.hostname + ":8765/api/agent";
    }
    return getPublicPathPrefix() + "/api/agent";
  }

  function getPublicPathPrefix() {
    var pathname = window.location.pathname || "/";
    return pathname === "/solar-terms" || pathname.indexOf("/solar-terms/") === 0
      ? "/solar-terms"
      : "";
  }

  function getAgentUnavailableMessage() {
    return isLocalHost(window.location.hostname)
      ? "智能体服务未启动，请运行 python agent_server.py"
      : "智能体服务暂不可用，请稍后重试。";
  }

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

  function loadConversationId() {
    try { return sessionStorage.getItem(CONVERSATION_KEY) || ""; } catch (e) { return ""; }
  }

  function saveConversationId(conversationId) {
    try { sessionStorage.setItem(CONVERSATION_KEY, conversationId || ""); } catch (e) { /* storage unavailable */ }
  }

  function getVisitorId() {
    try {
      var value = localStorage.getItem(VISITOR_KEY);
      if (!value) {
        value = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + Math.random();
        localStorage.setItem(VISITOR_KEY, value);
      }
      return value;
    } catch (e) {
      return "browser-" + String(Date.now());
    }
  }

  function getMessageLabel(role) {
    if (role === "user") return "你";
    if (role === "agent") return "二十四节气助手";
    return "";
  }

  window.SiteShell && window.SiteShell.init();

  var appEl = document.getElementById("agent-app");
  if (!appEl || !window.Vue) return;

  Vue.createApp({
    data: function () {
      return {
        messages: loadHistory(),
        conversationId: loadConversationId(),
        input: "",
        loading: false,
        promptSuggestions: [
          "帮我用三句话讲清楚惊蛰的物候和习俗",
          "清明节气适合做哪些展陈讲解内容？",
          "小满为什么叫小满？它和农事有什么关系？",
          "冬至有哪些饮食习俗和养生提醒？"
        ]
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
          headers: { "Content-Type": "application/json", "X-Visitor-ID": getVisitorId() },
          body: JSON.stringify({
            query: query,
            assistantId: ASSISTANT_ID,
            conversationId: self.conversationId || undefined
          })
        })
        .then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error(data.detail || data.response || "agent request failed");
            return data;
          });
        })
        .then(function (data) {
          self.conversationId = data.conversationId || self.conversationId;
          saveConversationId(self.conversationId);
          self.messages.push({
            role: "agent",
            text: data.response,
            intent: data.intent,
            term: data.term,
            messageId: data.messageId,
            sources: data.sources || []
          });
          self.loading = false;
          self.$nextTick(self.scrollBottom);
        })
        .catch(function () {
          self.messages.push({
            role: "error",
            text: getAgentUnavailableMessage()
          });
          self.loading = false;
          self.$nextTick(self.scrollBottom);
        });
      },
      sendSuggestion: function (text) {
        if (this.loading) return;
        this.input = text;
        this.sendMessage();
      },
      scrollBottom: function () {
        var area = this.$refs.chat;
        if (area) area.scrollTop = area.scrollHeight;
      },
      getMessageLabel: function (role) {
        return getMessageLabel(role);
      }
    },
    template: [
      '<div class="chat-area" ref="chat">',
      '  <div v-if="messages.length === 0" class="chat-empty">',
      '    <div class="chat-empty__title">从一个节气问题开始</div>',
      '    <div class="chat-empty__hint">可询问物候变化、民俗典故、饮食养生、诗词意象与农事安排。</div>',
      '    <div class="prompt-list" aria-label="推荐问题">',
      '      <button v-for="item in promptSuggestions" :key="item" type="button" @click="sendSuggestion(item)">{{ item }}</button>',
      '    </div>',
      '  </div>',
      '  <div v-for="(m, i) in messages" :key="i" :class="[\'msg\', \'msg--\' + m.role]">',
      '    <template v-if="m.role === \'agent\'">',
      '      <div class="msg__row">',
      '        <img class="msg__avatar" src="../assets/images/agent/assistant-avatar.svg" alt="二十四节气助手头像" loading="lazy" decoding="async" />',
      '        <div class="msg__content">',
      '          <span class="msg__label">{{ getMessageLabel(m.role) }}</span>',
      '          <div class="msg__bubble">{{ m.text }}</div>',
      '        </div>',
      '      </div>',
      '    </template>',
      '    <template v-else>',
      '      <span class="msg__label">{{ getMessageLabel(m.role) }}</span>',
      '      <div class="msg__bubble">{{ m.text }}</div>',
      '    </template>',
      '  </div>',
      '</div>',
      '<div class="chat-input-area">',
      '  <input type="text" v-model="input"',
      '    placeholder="例如：立春有哪些习俗？"',
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
