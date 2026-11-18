"""Servidor local del visor. Ejecutar: python3 visor/abrir_visor.py"""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os,json
ROOT=Path(__file__).resolve().parent
PROYECTO=ROOT.parent
CONFIG=PROYECTO/'simulacion'/'configuracion.json'
CAPTURA=PROYECTO/'docs'/'imagenes'/'vista_del_visor.png'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if self.path.split('?',1)[0]=='/configuracion.js':
            # En el servidor, el visor siempre lee la configuración física actual.
            body=('window.NC_CONFIG='+CONFIG.read_text()+';').encode()
            self.send_response(200);self.send_header('Content-Type','application/javascript; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
            return
        super().do_GET()
    def do_POST(self):
        if self.path not in ['/guardar-vista','/guardar-configuracion']:self.send_error(404);return
        origin=self.headers.get('Origin','')
        if origin and origin not in ['http://127.0.0.1:8766','http://localhost:8766']:self.send_error(403);return
        size=int(self.headers.get('Content-Length','0'))
        if size<=0 or size>12000000:self.send_error(413);return
        data=self.rfile.read(size)
        if self.path=='/guardar-configuracion':
            try:
                cfg=json.loads(data)
                if not all(k in cfg for k in ['viento','vehiculos','arboles','sensores','visual']):raise ValueError('Faltan secciones')
                CONFIG.write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
                (ROOT/'configuracion.js').write_text('window.NC_CONFIG='+json.dumps(cfg,ensure_ascii=False)+';')
                self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"ok":true}')
            except (ValueError,TypeError):self.send_error(400)
            return
        if not data.startswith(b'\x89PNG\r\n\x1a\n'):self.send_error(400);return
        CAPTURA.write_bytes(data)
        self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"ok":true}')
if __name__=='__main__':
    print('Abrir http://127.0.0.1:8766 en el navegador. Ctrl+C para cerrar.',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
