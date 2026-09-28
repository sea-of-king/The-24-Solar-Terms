# 二十四节气 · 互动文化网页

<p align="center">
  <strong>看衣色，循时序，读风物，问节气。</strong>
</p>

<p align="center">
  一个把中国二十四节气文化做成可浏览、可探索、可提问的互动数字体验。
</p>

<p align="center">
  <a href="https://github.com/sea-of-king/The-24-Solar-Terms"><img src="https://img.shields.io/github/repo-size/sea-of-king/The-24-Solar-Terms?style=flat-square" alt="Repository size"></a>
  <a href="https://github.com/sea-of-king/The-24-Solar-Terms/commits/main"><img src="https://img.shields.io/github/last-commit/sea-of-king/The-24-Solar-Terms?style=flat-square" alt="Last commit"></a>
  <a href="https://github.com/sea-of-king/The-24-Solar-Terms"><img src="https://img.shields.io/github/languages/top/sea-of-king/The-24-Solar-Terms?style=flat-square" alt="Top language"></a>
  <a href="https://github.com/sea-of-king/The-24-Solar-Terms"><img src="https://img.shields.io/github/stars/sea-of-king/The-24-Solar-Terms?style=flat-square" alt="GitHub stars"></a>
</p>

---

## 项目简介

二十四节气是中国人观察太阳周年运动、安排农事生活并理解时间秩序的一套传统知识。这个项目以现代网页为载体，将节气的时序、物候、民俗、饮食、服饰与诗意表达组织成一条可以自由漫游的内容路径。

项目适合用于传统文化展示、数字人文学习、课堂互动和节气主题活动。它既提供静态内容的沉浸式阅读，也提供智能问答与社区交流能力，让用户从“看见节气”进一步走向“理解节气、分享节气”。

## 核心功能

- **节气首页**：以四时流转为视觉入口，快速进入不同内容模块。
- **节气时间线**：按春、夏、秋、冬浏览二十四节气，查看日期、物候和文化信息。
- **服装展示**：通过节气主题服饰内容和可选的 Three.js 3D 展示，感受时令审美。
- **节气知识库**：集中浏览节气相关的民俗、饮食、气候、农事与诗词信息。
- **AI 节气助手**：支持自然语言提问，可回答节气习俗、养生、饮食、诗词和气候等问题。
- **节气树洞**：发布与节气有关的文字，浏览动态、点赞和评论，形成轻量社区互动。
- **知识库检索**：支持文档切分、向量嵌入和检索增强生成（RAG），为智能问答提供扩展能力。
- **容器化部署**：前端、Go API、Python AI 服务、异步 worker 及基础设施可通过 Docker Compose 统一启动。

## 截图与演示

> 截图占位：建议在此处补充首页、时间线、服装 3D 展示、AI 助手和节气树洞的实际截图。
>
> 推荐素材目录：`docs/images/`。上传图片后，可将本区替换为 `![首页截图](docs/images/home.png)` 等 GitHub 原生 Markdown 图片。

<!-- Demo 占位：可在此补充线上演示地址、演示 GIF 或产品视频。 -->

## 技术栈

| 层次 | 技术 | 用途 |
| --- | --- | --- |
| 前端 | HTML、CSS、原生 JavaScript、Vue 3 | 页面结构、交互与内容呈现 |
| 视觉与 3D | Three.js、Postprocessing、glTF | 服饰展示与沉浸式视觉效果 |
| 前端工具 | Vite、Node.js | 本地开发、构建和静态资源服务 |
| AI 服务 | Python、FastAPI、Uvicorn | 智能助手 API、知识检索和管理接口 |
| 模型接入 | DeepSeek API、OpenAI 兼容 Embedding API | 生成式回答和向量嵌入 |
| 异步任务 | Celery、RabbitMQ、Redis | 知识库导入、队列调度和缓存 |
| 数据存储 | PostgreSQL、pgvector、MySQL | AI 数据、向量数据和树洞内容 |
| 后端服务 | Go | 树洞 API 与高并发轻量接口 |
| 部署 | Docker、Docker Compose、Nginx | 服务编排、构建和静态文件托管 |

## 快速启动

### 仅启动前端

环境要求：Node.js 22+、npm 10+。

```bash
git clone https://github.com/sea-of-king/The-24-Solar-Terms.git
cd The-24-Solar-Terms
npm install
npm run dev
```

启动后访问终端输出的本地地址，通常为 `http://localhost:5173`。

### 使用 Docker 启动完整服务

环境要求：Docker 24+、Docker Compose v2+，以及可用的 DeepSeek API Key。

```bash
cp compose.env.example compose.env
# 编辑 compose.env，填写数据库密码、队列密码、ADMIN_API_KEY 和 DEEPSEEK_API_KEY
docker compose --env-file compose.env up -d --build
```

默认情况下，Web 服务绑定到 `http://127.0.0.1:8088`。查看服务状态和日志：

```bash
docker compose --env-file compose.env ps
docker compose --env-file compose.env logs -f web agent tree-hole worker
```

停止服务：

```bash
docker compose --env-file compose.env down
```

更多生产环境路径代理、数据卷和版本策略说明，请参阅 [`DEPLOY.md`](DEPLOY.md)。

## 配置说明

复制 [`compose.env.example`](compose.env.example) 为 `compose.env`，并只在本地或部署环境填写真实值。`compose.env` 已被 Git 忽略，不应提交 API Key 或数据库密码。

| 配置项 | 说明 | 示例 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 对话模型密钥 | `sk-...` |
| `DEEPSEEK_BASE_URL` | DeepSeek 或兼容服务地址 | `https://api.deepseek.com/v1` |
| `DEFAULT_ASSISTANT_ID` | 默认助手领域标识 | `solar-terms` |
| `EMBEDDING_API_KEY` | 向量嵌入服务密钥，可选 | `sk-...` |
| `EMBEDDING_BASE_URL` | OpenAI 兼容嵌入服务地址 | `https://.../v1` |
| `EMBEDDING_MODEL` | 嵌入模型名称 | `text-embedding-3-small` |
| `MYSQL_ROOT_PASSWORD` | 树洞 MySQL 密码 | 请使用强密码 |
| `AI_POSTGRES_PASSWORD` | AI 服务 PostgreSQL 密码 | 请使用强密码 |
| `RABBITMQ_PASSWORD` | RabbitMQ 密码 | 请使用强密码 |
| `ADMIN_API_KEY` | 知识库管理接口密钥 | 请使用随机值 |
| `CORS_ORIGINS` | AI API 允许的来源 | `http://localhost,http://127.0.0.1` |
| `WEB_PORT` | Web 容器宿主机端口 | `8088` |

未配置 Embedding 服务时，问答服务可以回退到词法检索；需要导入大规模知识文档时，建议配置稳定的 OpenAI 兼容 Embedding 服务。

## 常用命令

```bash
# 本地开发
npm run dev

# 构建生产静态资源
npm run build

# 校验页面与资源引用
npm run lint

# 运行项目测试
npm test

# 启动树洞 Go 服务
npm run server:tree-hole

# 校验服装模型清单
npm run validate:costumes
```

## 目录结构

```text
.
├── index.html                 # 首页
├── pages/                     # 时间线、知识库、服装、助手、树洞页面
├── scripts/                   # 页面逻辑、共享导航和静态数据
├── styles/                   # 全局与页面样式
├── src/costumes/              # 服装 3D 展示模块
├── assets/                    # 图片、插画和生成资源
├── app/                       # FastAPI、AI 持久化、检索和限流
├── assistant_core/            # 与领域无关的助手框架
├── domains/solar_terms/       # 二十四节气助手领域实现
├── worker/                    # Celery 知识库导入任务
├── server/                    # Go 树洞 API 和 MySQL schema
├── database/                  # PostgreSQL/pgvector 初始化脚本
├── docs/                      # 架构与部署相关文档
├── tests/                     # Python 服务测试
├── compose.yaml               # 完整服务编排
└── DEPLOY.md                  # 部署和升级说明
```

## 贡献指南

欢迎提交内容校订、交互优化、无障碍改进、性能优化和新领域适配。

1. Fork 本仓库并创建功能分支：`git checkout -b feat/your-feature`。
2. 保持提交聚焦，使用清晰的 Conventional Commits 风格提交信息，例如 `feat: add solar term card`。
3. 提交前运行 `npm run build`、`npm run lint` 和相关测试。
4. 修改 API、数据库或部署配置时，请同步更新文档和示例配置。
5. 发起 Pull Request，并说明变更背景、测试结果和必要的截图。

涉及传统文化内容时，请尽量注明资料来源，区分历史记载、地域习俗和现代解读，避免把单一地区经验表述为普遍结论。

## 许可证

当前仓库尚未附带正式的 `LICENSE` 文件。代码公开使用前，请由项目维护者补充明确的开源许可证，并同步说明图片、字体、模型和第三方数据的授权范围。

## 致谢

感谢所有记录、传承和重新讲述中国节气文化的人，也感谢开源社区提供的前端、后端、AI 与 3D 工具链。

---

<p align="center">让时间有迹可循，让四时重新抵达人。</p>
