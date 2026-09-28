(function () {
  var API_BASE_URL = resolveApiBaseUrl();

  function getVisitorId() {
    var key = "solar-terms-tree-hole-visitor";
    var value = window.localStorage.getItem(key);
    if (!value) {
      value = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : "visitor-" + Date.now() + "-" + Math.random().toString(16).slice(2);
      window.localStorage.setItem(key, value);
    }
    return value;
  }

  function isLocalHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }

  function resolveApiBaseUrl() {
    var location = window.location;
    if (isLocalHost(location.hostname)) {
      return location.protocol + "//" + location.hostname + ":8080/api/tree-hole";
    }
    return getPublicPathPrefix() + "/api/tree-hole";
  }

  function getPublicPathPrefix() {
    var pathname = window.location.pathname || "/";
    return pathname === "/solar-terms" || pathname.indexOf("/solar-terms/") === 0
      ? "/solar-terms"
      : "";
  }
  var DEFAULT_POSTS = [
    {
      id: "default-qingming",
      name: "清明路过的人",
      season: "春",
      mood: "想念",
      message: "清明的细雨落进伞边时，我忽然想把没说完的思念慢慢讲给风听。",
      createdAt: "2026-04-04T09:30:00.000Z"
    },
    {
      id: "default-xiazhi",
      name: "夏至午后",
      season: "夏",
      mood: "明亮",
      message: "夏至白昼很长，我把拖延许久的小计划重新翻开，心里也亮了一些。",
      createdAt: "2026-06-21T13:10:00.000Z"
    },
    {
      id: "default-bailu",
      name: "白露听风",
      season: "秋",
      mood: "安静",
      message: "白露后的早晚有了凉意，人也愿意停下来，把纷乱心绪一页页理清。",
      createdAt: "2026-09-07T20:12:00.000Z"
    },
    {
      id: "default-lichun",
      name: "立春折枝",
      season: "春",
      mood: "期待",
      message: "立春那天看到新芽探头，我忽然相信沉闷日子终会被温柔一点点推开。",
      createdAt: "2026-02-04T08:18:00.000Z"
    },
    {
      id: "default-mangzhong",
      name: "芒种赶路人",
      season: "夏",
      mood: "忙碌",
      message: "芒种一到，连风都像催人赶路，可我仍想在奔忙里留一点喘息空隙。",
      createdAt: "2026-06-05T18:26:00.000Z"
    },
    {
      id: "default-shuangjiang",
      name: "霜降夜读",
      season: "秋",
      mood: "沉静",
      message: "霜降后的夜色更深了，读到喜欢的句子时，心里反而慢慢安稳下来。",
      createdAt: "2026-10-23T21:05:00.000Z"
    },
    {
      id: "default-daxue",
      name: "大雪围炉",
      season: "冬",
      mood: "温热",
      message: "大雪时节围着热茶发呆，窗外再冷，屋里也总能守住一小团暖意。",
      createdAt: "2026-12-07T19:22:00.000Z"
    },
    {
      id: "default-dahan",
      name: "大寒等春",
      season: "冬",
      mood: "坚韧",
      message: "大寒把清晨冻得发白，可我知道再往前走几步，春天就会慢慢靠近。",
      createdAt: "2026-01-20T07:42:00.000Z"
    }
  ];

  function ensureRecentPosts(posts) {
    var merged = posts.slice();
    var existingIds = Object.create(null);

    merged.forEach(function (post) {
      existingIds[String(post.id)] = true;
    });

    DEFAULT_POSTS.forEach(function (post) {
      if (merged.length >= 8) return;
      if (!existingIds[post.id]) {
        merged.push(post);
        existingIds[post.id] = true;
      }
    });

    return merged.map(function (post) {
      post.likeCount = post.likeCount || 0;
      post.liked = Boolean(post.liked);
      post.comments = post.comments || [];
      return post;
    });
  }

  function getPage() {
    return document.body.getAttribute("data-page") || "home";
  }

  // 转换后端数据格式到前端格式
  function transformPostFromAPI(post) {
    return {
      id: post.id,
      name: post.nickname,
      season: post.season,
      mood: "此刻",
      message: post.content,
      createdAt: post.createdAt,
      likeCount: post.likeCount || 0,
      liked: Boolean(post.liked),
      comments: post.comments || []
    };
  }

  // 从后端 API 读取留言
  async function readPosts() {
    try {
      var response = await fetch(API_BASE_URL + "/messages", { headers: { "X-Visitor-ID": getVisitorId() } });
      if (!response.ok) throw new Error("API 请求失败");
      var result = await response.json();
      return ensureRecentPosts(result.data.map(transformPostFromAPI));
    } catch (error) {
      console.error("读取留言失败，使用默认数据:", error);
      return ensureRecentPosts(DEFAULT_POSTS);
    }
  }

  // 创建新留言到后端 API
  async function createPost(postData) {
    var response = await fetch(API_BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nickname: postData.name || "匿名来信",
        season: postData.season,
        content: postData.message
      })
    });

    if (!response.ok) {
      var errorResult = await response.json();
      throw new Error(errorResult.message || "发布失败");
    }

    var result = await response.json();
    return transformPostFromAPI(result.data);
  }

  async function toggleLike(postId) {
    var response = await fetch(API_BASE_URL + "/messages/" + postId + "/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: getVisitorId() }) });
    if (!response.ok) throw new Error("点赞失败，请稍后重试。");
    return response.json();
  }

  async function createComment(postId, commentData) {
    var response = await fetch(API_BASE_URL + "/messages/" + postId + "/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: getVisitorId(), nickname: commentData.name || "无名来信", content: commentData.content, parentId: commentData.parentId || null }) });
    if (!response.ok) { var errorResult = await response.json(); throw new Error(errorResult.message || "评论失败"); }
    var result = await response.json();
    return result.data;
  }

  function formatTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function getSeasonCount(posts, season) {
    return posts.filter(function (post) {
      return post.season === season;
    }).length;
  }

  function mountHomeEntry(root) {
    if (!root || !window.Vue) return;

    Vue.createApp({
      data: function () {
        return {
          previews: []
        };
      },
      methods: {
        formatTime: formatTime,
        loadPosts: async function () {
          var posts = await readPosts();
          this.previews = posts.slice(0, 3);
        }
      },
      mounted: function () {
        this.loadPosts();
      },
      template: '' +
        '<article class="tree-hole-entry-card card">' +
        '  <div>' +
        '    <h3>去树洞，寄一句当下心绪</h3>' +
        '    <p>一言一语，都可托付给春夏秋冬。</p>' +
        '  </div>' +
        '  <div class="tree-hole-preview-list">' +
        '    <article class="tree-hole-preview-item" v-for="post in previews" :key="post.id">' +
        '      <strong>{{ post.season }}季 · {{ post.mood }}</strong>' +
        '      <p>{{ post.message }}</p>' +
        '      <time>{{ formatTime(post.createdAt) }}</time>' +
        '    </article>' +
        '  </div>' +
        '  <div class="tree-hole-entry-card__actions">' +
        '    <a class="btn btn-primary" href="pages/tree-hole.html">进入节气树洞</a>' +
        '    <a class="btn btn-secondary" href="pages/knowledge.html">先读节气知识</a>' +
        '  </div>' +
        '</article>'
    }).mount(root);
  }

  function mountForum(root) {
    if (!root || !window.Vue) return;

    Vue.createApp({
      data: function () {
        return {
          posts: [],
          selectedSeason: "全部",
          form: {
            name: "",
            season: "春",
            mood: "",
            message: ""
          },
          feedback: "",
          isLoading: false,
          isSubmitting: false,
          commentDrafts: {},
          replyTarget: null,
          activeLikeId: null
        };
      },
      computed: {
        filteredPosts: function () {
          var posts = this.posts.slice().sort(function (a, b) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          if (this.selectedSeason === "全部") return posts;
          return posts.filter(function (post) {
            return post.season === this.selectedSeason;
          }, this);
        },
        seasonStats: function () {
          var posts = this.posts;
          return ["春", "夏", "秋", "冬"].map(function (season) {
            return {
              season: season,
              count: getSeasonCount(posts, season)
            };
          });
        }
      },
      methods: {
        formatTime: formatTime,
        loadPosts: async function () {
          this.isLoading = true;
          this.posts = await readPosts();
          this.isLoading = false;
        },
        submitPost: async function () {
          var message = this.form.message.trim();
          if (!message) {
            this.feedback = "先写下一句想说的话。";
            return;
          }

          this.isSubmitting = true;
          this.feedback = "发布中...";

          try {
            var newPost = await createPost({
              name: this.form.name.trim(),
              season: this.form.season,
              message: message
            });

            this.posts = [newPost].concat(this.posts);
            this.form.name = "";
            this.form.mood = "";
            this.form.message = "";
            this.feedback = "已经收到这段节气心情。";
          } catch (error) {
            this.feedback = error.message || "发布失败，请稍后重试。";
          } finally {
            this.isSubmitting = false;
          }
        },
        commentKey: function (postId) { return String(postId); },
        openComment: function (post, parent) {
          this.replyTarget = { postId: post.id, parent: parent || null };
          var key = this.commentKey(post.id);
          if (!this.commentDrafts[key]) this.commentDrafts[key] = { name: "", content: "" };
        },
        submitComment: async function (post) {
          var key = this.commentKey(post.id), draft = this.commentDrafts[key] || {}, content = (draft.content || "").trim();
          if (!content) return;
          try {
            var item = await createComment(post.id, { name: (draft.name || "").trim(), content: content, parentId: this.replyTarget && this.replyTarget.postId === post.id && this.replyTarget.parent ? this.replyTarget.parent.id : null });
            if (item.parentId) {
              var parent = post.comments.find(function (comment) { return comment.id === item.parentId; });
              if (parent) { if (!parent.replies) parent.replies = []; parent.replies.push(item); }
            } else { post.comments.push(item); }
            this.commentDrafts[key] = { name: draft.name || "", content: "" };
            this.replyTarget = null;
          } catch (error) { this.feedback = error.message || "评论失败，请稍后重试。"; }
        },
        likePost: async function (post) {
          this.activeLikeId = post.id;
          try { var result = await toggleLike(post.id); post.liked = result.liked; post.likeCount = result.likeCount; } catch (error) { this.feedback = error.message || "点赞失败，请稍后重试。"; } finally { this.activeLikeId = null; }
        }
      },
      mounted: function () {
        this.loadPosts();
      },
      template: '' +
        '<div class="tree-hole-forum-shell">' +
        '  <section class="tree-hole-forum-hero card">' +
        '    <div>' +
        '      <p class="eyebrow">互动论坛</p>' +
        '      <h2>循四时翻帖，也听人间回声。</h2>' +
        '      <p>此间所记，皆是节令里的片刻心音。</p>' +
        '    </div>' +
        '    <div class="tree-hole-forum-hero__meta">' +
        '      <button class="chip" type="button" v-for="season in [\'全部\', \'春\', \'夏\', \'秋\', \'冬\']" :key="season" @click="selectedSeason = season">{{ season }}</button>' +
        '    </div>' +
        '  </section>' +
        '  <div class="tree-hole-forum-grid">' +
        '    <section class="tree-hole-panel tree-hole-panel--form card">' +
        '      <div class="tree-hole-panel__atmosphere" aria-hidden="true"><span></span><span></span><span></span></div>' +
        '      <h3>写下此刻</h3>' +
        '      <div class="tree-hole-field-grid">' +
        '        <label class="tree-hole-field"><span>昵称</span><input v-model="form.name" maxlength="16" placeholder="可以匿名" :disabled="isSubmitting"></label>' +
        '        <label class="tree-hole-field"><span>季节</span><select v-model="form.season" :disabled="isSubmitting"><option>春</option><option>夏</option><option>秋</option><option>冬</option></select></label>' +
        '      </div>' +
        '      <label class="tree-hole-field"><span>心情标签</span><input v-model="form.mood" maxlength="12" placeholder="例如：期待、想念、安静" :disabled="isSubmitting"></label>' +
        '      <label class="tree-hole-field"><span>想说的话</span><textarea v-model="form.message" maxlength="280" placeholder="把此刻留给节气。" :disabled="isSubmitting"></textarea></label>' +
        '      <div class="tree-hole-form__meta">' +
        '        <span class="tree-hole-tip">{{ form.message.length }}/280</span>' +
        '        <button class="btn btn-primary tree-hole-submit" type="button" @click="submitPost" :disabled="isSubmitting">{{ isSubmitting ? "发布中..." : "发布" }}</button>' +
        '      </div>' +
        '      <p v-if="feedback" class="tree-hole-feedback" :class="{ \'tree-hole-feedback--success\': form.message.length === 0 && !isSubmitting }">{{ feedback }}</p>' +
        '    </section>' +
        '    <aside class="tree-hole-sidebar card">' +
        '      <h3>四季回声</h3>' +
        '      <p>按季节查看大家留下的片段。</p>' +
        '      <div class="tree-hole-sidebar__stats">' +
        '        <article class="tree-hole-sidebar__stat" v-for="item in seasonStats" :key="item.season">' +
        '          <strong>{{ item.count }}</strong>' +
        '          <span>{{ item.season }}季留言</span>' +
        '        </article>' +
        '      </div>' +
        '      <button class="btn btn-secondary tree-hole-refresh" type="button" @click="loadPosts" :disabled="isLoading">刷新</button>' +
        '    </aside>' +
        '  </div>' +
        '  <section class="tree-hole-stream card">' +
        '    <div class="tree-hole-feed__header">' +
        '      <div><p class="eyebrow">最近留言</p><h3>{{ selectedSeason }}季树洞</h3></div>' +
        '      <span class="chip">{{ filteredPosts.length }} 条</span>' +
        '    </div>' +
        '    <div v-if="isLoading" class="tree-hole-empty">加载中...</div>' +
        '    <div v-else-if="filteredPosts.length" class="tree-hole-feed tree-hole-feed--forum">' +
        '      <article class="tree-hole-entry tree-hole-entry--forum" v-for="post in filteredPosts" :key="post.id">' +
        '        <div class="tree-hole-entry__meta"><strong>{{ post.name }}</strong><span>{{ post.season }}季 · {{ post.mood }}</span></div>' +
        '        <p>{{ post.message }}</p>' +
        '        <time>{{ formatTime(post.createdAt) }}</time>' +
        '        <div class="tree-hole-entry__footer"><button class="tree-hole-action" type="button" @click="likePost(post)" :disabled="activeLikeId === post.id" :class="{ \'is-active\': post.liked }">{{ post.liked ? "已点赞" : "点赞" }} {{ post.likeCount }}</button><button class="tree-hole-action" type="button" @click="openComment(post)">评论 {{ post.comments.length }}</button></div>' +
        '        <section class="tree-hole-comments" v-if="post.comments.length || (replyTarget && replyTarget.postId === post.id)">' +
        '          <article class="tree-hole-comment" v-for="comment in post.comments" :key="comment.id"><strong>{{ comment.nickname }}</strong><p>{{ comment.content }}</p><time>{{ formatTime(comment.createdAt) }}</time><button class="tree-hole-comment__reply" type="button" @click="openComment(post, comment)">回复</button>' +
        '            <div class="tree-hole-replies" v-if="comment.replies && comment.replies.length"><article class="tree-hole-comment tree-hole-comment--reply" v-for="reply in comment.replies" :key="reply.id"><strong>{{ reply.nickname }}</strong><p>{{ reply.content }}</p><time>{{ formatTime(reply.createdAt) }}</time></article></div>' +
        '          </article>' +
        '          <div class="tree-hole-comment-form" v-if="replyTarget && replyTarget.postId === post.id"><input v-model="commentDrafts[commentKey(post.id)].name" maxlength="16" placeholder="昵称（可匿名)"><textarea v-model="commentDrafts[commentKey(post.id)].content" maxlength="280" :placeholder="replyTarget.parent ? \'回复 \' + replyTarget.parent.nickname : \'写下评论\'"></textarea><div><button class="tree-hole-action" type="button" @click="submitComment(post)">发布评论</button><button class="tree-hole-comment__reply" type="button" @click="replyTarget = null">取消</button></div></div>' +
        '        </section>' +
        '      </article>' +
        '    </div>' +
        '    <div v-else class="tree-hole-empty">这一季还没有留言。</div>' +
        '  </section>' +
        '</div>'
    }).mount(root);
  }

  function initTreeHole() {
    var root = document.querySelector("#tree-hole-app");
    var page = getPage();

    if (page === "tree-hole" && window.SiteShell) {
      window.SiteShell.init("tree-hole");
      mountForum(root);
      return;
    }

    mountHomeEntry(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTreeHole);
  } else {
    initTreeHole();
  }
})();

