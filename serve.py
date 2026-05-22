#!/usr/bin/env python3
"""로컬 미리보기 서버 — 캐시를 끄기 때문에 그냥 새로고침(Cmd+R)만 해도 항상 최신이 보입니다.
사용:  python3 serve.py        (기본 8137 포트)
       python3 serve.py 9000   (포트 지정)
"""
import sys
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"http://localhost:{PORT}/  (캐시 끔 — 그냥 새로고침하면 최신)")
    httpd.serve_forever()
