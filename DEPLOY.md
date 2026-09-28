# Deployment

1. Copy `compose.env.example` to `compose.env` and fill the real secrets.
2. Set `WEB_BIND_HOST=127.0.0.1` and `WEB_PORT=8088` in `compose.env` when the host Nginx proxies the app from a path such as `/solar-terms/`.
   Use `WEB_BIND_HOST=0.0.0.0` and `WEB_PORT=80` only when the container should be reachable directly from the public network.
3. Run `docker compose --env-file compose.env up -d --build`.
4. By default the web container binds to `127.0.0.1:8088`; keep that for local preview or place Nginx/CDN in front of it.
5. Visit `http://<server-ip>/solar-terms/` after the containers are healthy and the host Nginx path proxy is reloaded.

Services:
- `web`: builds the Vite site and serves it with Nginx.
- `tree-hole`: Go API for `/api/tree-hole/*`.
- `agent`: Python API for `/api/agent`.
- `worker`: Celery consumer using LlamaIndex for knowledge document chunking and embedding jobs.
- `mysql`: stores tree-hole messages and initializes `server/schema.sql` on first boot.
- `redis`: caches the recent tree-hole feed, including its like totals and comment tree.
- `postgres`: AI conversations, feedback, audit records, knowledge metadata, and pgvector chunks.
- `rabbitmq`: RabbitMQ 4.3.6 durable queue broker for AI knowledge ingestion.

The first `ai-migrate` run applies `database/ai_schema.sql` before the API and
worker start. Set strong, distinct `AI_POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`,
and `ADMIN_API_KEY` values in `compose.env`. Knowledge management endpoints
require `X-Admin-Key`; public chat is rate-limited by Redis.
The `knowledge` queue is durable and routes rejected messages to
`knowledge.dlq`; inspect and replay dead-letter messages only after fixing the
underlying document or embedding-provider failure.

## Version policy

The AI worker uses Celery 5.6.3 and Kombu 5.6.2, pinned for RabbitMQ 4.3
compatibility, plus LlamaIndex Core 0.14.24 and its OpenAI-compatible embedding
adapter 0.4.0 for RAG ingestion and query embedding. The Python image is fixed to Python 3.12.14 on Debian Trixie;
MySQL 8.4 and Node 22 are their respective maintained/LTS release lines.
RabbitMQ and PostgreSQL do not publish an LTS designation, so this deployment
uses a supported, explicitly pinned RabbitMQ 4.3 patch release and PostgreSQL
17 release line instead of floating `latest` tags.

RabbitMQ 4.3 is assigned a separate `rabbitmq-data-v43` volume. Before a
production upgrade, drain the old broker and back up its definitions; do not
reuse a RabbitMQ 3.x data directory across the major-version change. The
knowledge documents and chunks remain in PostgreSQL and are unaffected.

RabbitMQ 4.3 disables legacy transient non-exclusive queues. The Celery worker
therefore disables remote-control pidbox, mingle, and event gossip, which are
not used by this ingestion workload. Its health check reflects readiness after
it has connected to the durable `knowledge` queue; no deprecated RabbitMQ
feature flag is enabled.

For an existing MySQL volume, apply the new `tree_hole_likes`,
`tree_hole_comments`, and `idx_tree_hole_like_visitor_message` statements from
`server/schema.sql` once before deploying; MySQL initialization scripts only
run automatically for a new volume.
