"""Servidor local com recarga automatica.

Uso:  python servidor.py
Depois abra http://127.0.0.1:8765 no navegador. Sempre que voce salvar um
.js, .html, .css ou .json desta pasta, a pagina recarrega sozinha.
"""
import http.server
import os
import socketserver
import time

PORTA = 8765
PASTA = os.path.dirname(os.path.abspath(__file__))
EXTENSOES = (".js", ".html", ".css", ".json")


def ultima_mudanca():
    maior = 0
    for raiz, _, arquivos in os.walk(PASTA):
        for nome in arquivos:
            if nome.endswith(EXTENSOES):
                maior = max(maior, os.path.getmtime(os.path.join(raiz, nome)))
    return maior


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PASTA, **kwargs)

    def end_headers(self):
        # sem cache: o navegador sempre pega a versao recem-salva
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__recarregar":
            # a pagina pergunta a cada segundo; responde com o horario da ultima mudanca
            corpo = str(ultima_mudanca()).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(corpo)
            return
        super().do_GET()

    def log_message(self, *args):
        pass  # silencia o log de cada requisicao


class Servidor(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with Servidor(("127.0.0.1", PORTA), Handler) as s:
        print(f"Abra http://localhost:{PORTA}  (Ctrl+C para parar)")
        s.serve_forever()
