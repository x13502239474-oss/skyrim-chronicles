"""Build-on-demand static server with SPA fallback for the Skyrim Chronicles site."""
import http.server
import os
import socketserver
import subprocess
import sys
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "3000"))
BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(BASE, "dist")
INDEX = os.path.join(ROOT, "index.html")

# The deploy sandbox uploads source (dist may be excluded as build output).
# Build it here if it is missing.
if not os.path.isfile(INDEX):
    print("[serve] dist not found, building with npm...", flush=True)
    try:
        subprocess.run([sys.executable, "-c", "pass"], check=False)
        subprocess.run("npm install --no-audit --no-fund", shell=True, cwd=BASE, check=True)
        subprocess.run("npm run build", shell=True, cwd=BASE, check=True)
        print("[serve] build finished.", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[serve] build failed: {exc}", flush=True)


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _resolve(self):
        path = urlparse(self.path).path
        rel = path.lstrip("/")
        candidate = os.path.normpath(os.path.join(ROOT, rel))
        if not candidate.startswith(ROOT):
            return INDEX
        if rel and os.path.isfile(candidate):
            return candidate
        return INDEX

    def do_GET(self):
        target = self._resolve()
        self.path = "/" + os.path.relpath(target, ROOT).replace("\\", "/")
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(("0.0.0.0", PORT), SPAHandler) as httpd:
    print(f"[serve] listening on 0.0.0.0:{PORT}, root={ROOT}", flush=True)
    httpd.serve_forever()
