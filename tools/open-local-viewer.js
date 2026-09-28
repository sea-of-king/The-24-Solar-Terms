const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const preferredPort = Number(process.env.LOCAL_VIEWER_PORT || 5500);
const targetPath = normalizeUrlPath(process.argv.slice(2).find((arg) => !arg.startsWith("--")) || "/pages/costumes.html");
const shouldOpenBrowser = !process.argv.includes("--no-open");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wasm": "application/wasm",
  ".webp": "image/webp"
};

function normalizeUrlPath(value) {
  if (!value || value === "/") return "/index.html";
  return value.startsWith("/") ? value : "/" + value;
}

function isInsideRoot(filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function sendFile(filePath, response) {
  const ext = path.extname(filePath).toLowerCase();
  const stream = fs.createReadStream(filePath);

  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": mimeTypes[ext] || "application/octet-stream"
  });

  stream.pipe(response);
  stream.on("error", function () {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  });
}

function createServer() {
  return http.createServer(function (request, response) {
    const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
    const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
    const filePath = path.resolve(rootDir, "." + normalizedPath);

    if (!isInsideRoot(filePath)) {
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
}

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? { file: "cmd", args: ["/c", "start", "", url] }
      : process.platform === "darwin"
        ? { file: "open", args: [url] }
        : { file: "xdg-open", args: [url] };

  const child = spawn(command.file, command.args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

function listen(server, port, attemptsLeft) {
  server.once("error", function (error) {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(createServer(), port + 1, attemptsLeft - 1);
      return;
    }

    console.error(error.message);
    process.exitCode = 1;
  });

  server.listen(port, "127.0.0.1", function () {
    const url = "http://127.0.0.1:" + port + targetPath;
    console.log("Local 3D viewer running at " + url);
    console.log("Keep this window open while viewing the page. Press Ctrl+C to stop.");
    if (shouldOpenBrowser) openBrowser(url);
  });
}

listen(createServer(), preferredPort, 20);
