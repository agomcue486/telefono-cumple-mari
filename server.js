/**
 * Servidor Local para 'Teléfono Virtual de Cumpleaños'
 * Sirve los archivos estáticos y proporciona la API /api/contactos
 * que conecta con Supabase directamente desde el servidor.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const SUPABASE_URL = 'https://muvmznfpmarbijnswqdg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_z9kYwSOOEYFW20Pfnoeeig_9IvWw7Ej';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

const server = http.createServer(async (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  // ==========================================================================
  // ENDPOINT: /api/contactos
  // El servidor consulta Supabase y entrega los contactos a cualquier dispositivo
  // ==========================================================================
  if (pathname === '/api/contactos') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/contactos?select=*&order=id.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Error respuesta Supabase contactos:', errorText);
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(errorText);
        return;
      }

      const data = await response.json();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(JSON.stringify(data));
      return;
    } catch (err) {
      console.error('Error al consultar contactos de Supabase:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // ==========================================================================
  // ENDPOINT: /api/configuracion
  // Consulta la tabla configuracion en Supabase
  // ==========================================================================
  if (pathname === '/api/configuracion') {
    if (req.method === 'GET') {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/configuracion?select=*`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });

        if (!response.ok) {
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(await response.text());
          return;
        }

        const data = await response.json();
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(JSON.stringify(data));
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }
  }

  // ==========================================================================
  // ARCHIVOS ESTÁTICOS
  // ==========================================================================
  let filePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  filePath = path.join(__dirname, filePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎉 Servidor activo en http://localhost:${PORT}`);
  console.log(`📱 Servidor en red local: http://192.168.0.35:${PORT}`);
  console.log(`🔌 API de contactos activa en /api/contactos`);
  console.log(`======================================================\n`);
});
