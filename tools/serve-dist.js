const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "dist");
const port = 5510;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
  ".mp4": "video/mp4"
};

function sendFile(filePath, response) {
  const ext = path.extname(filePath).toLowerCase();
  const stream = fs.createReadStream(filePath);

  response.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream"
  });

  stream.pipe(response);
  stream.on("error", function () {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  });
}

const server = http.createServer(function (request, response) {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.resolve(rootDir, "." + normalizedPath);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, function (error, stats) {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    if (stats.isDirectory()) {
      sendFile(path.join(filePath, "index.html"), response);
      return;
    }

    sendFile(filePath, response);
  });
});

server.listen(port, "127.0.0.1", function () {
  console.log("Dist server running at http://127.0.0.1:" + port + "/");
});
