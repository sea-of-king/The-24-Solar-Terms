"""HTTP bridge for SolarTermAgent — zero-dependency, stdlib only.

Usage:
    python agent_server.py          # starts on 127.0.0.1:8765
    curl -X POST 127.0.0.1:8765/api/agent -d '{"query":"立春习俗"}'
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from solar_term_agent import SolarTermAgent


def _load_env(path=".env"):
    """Load KEY=VALUE pairs from a file into os.environ."""
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


_load_env()

AGENT = SolarTermAgent(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
)


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self._cors_headers()
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/agent":
            self.send_response(404)
            self._cors_headers()
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        body = json.loads(raw.decode("utf-8", errors="replace"))

        query = body.get("query", "").strip()
        if not query:
            self._json(400, {"error": "missing query field"})
            return

        response = AGENT.process(query)
        term = AGENT._extract_term(query)
        intent = AGENT._classify_intent(query)
        self._json(200, {"response": response, "intent": intent,
                         "term": term or ""})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors_headers()
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # quiet


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Agent server on http://127.0.0.1:{port}/api/agent")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        print("\nShut down.")
