// ENDEL Estudios — Cloudflare Worker API
// Maneja: tickets, estados, archivos (R2), admin

const ADMIN_PASSWORD = 'endel47362512026';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ── GET /api/ticket/:code — cliente consulta su ticket
    if (method === 'GET' && path.startsWith('/api/ticket/')) {
      const code = path.split('/')[3];
      if (!code) return err('Codigo requerido');

      const ticket = await env.DB.prepare(
        'SELECT * FROM tickets WHERE code = ?'
      ).bind(code).first();

      if (!ticket) return err('Ticket no encontrado', 404);

      // No mostrar archivos ni codigo de entrega si no está entregado
      if (ticket.estado !== 'entregado') {
        return json({
          code: ticket.code,
          email: ticket.email,
          estado: ticket.estado,
          nota_publica: ticket.nota_publica,
          fecha: ticket.fecha,
        });
      }

      return json({
        code: ticket.code,
        email: ticket.email,
        estado: ticket.estado,
        nota_publica: ticket.nota_publica,
        fecha: ticket.fecha,
        tiene_entrega: true,
      });
    }

    // ── POST /api/ticket/desbloquear — cliente mete codigo de entrega
    if (method === 'POST' && path === '/api/ticket/desbloquear') {
      const body = await request.json();
      const { ticket_code, unlock_code } = body;

      const ticket = await env.DB.prepare(
        'SELECT * FROM tickets WHERE code = ? AND unlock_code = ?'
      ).bind(ticket_code, unlock_code).first();

      if (!ticket) return err('Codigo de entrega incorrecto', 403);

      // Obtener lista de archivos de R2
      const archivos = [];
      try {
        const lista = await env.STORAGE.list({ prefix: ticket_code + '/' });
        for (const obj of lista.objects) {
          archivos.push({
            nombre: obj.key.replace(ticket_code + '/', ''),
            key: obj.key,
            size: obj.size,
          });
        }
      } catch (e) {}

      return json({
        code: ticket.code,
        nota_entrega: ticket.nota_entrega,
        archivos,
      });
    }

    // ── GET /api/archivo/:key — descargar archivo
    if (method === 'GET' && path.startsWith('/api/archivo/')) {
      const key = decodeURIComponent(path.replace('/api/archivo/', ''));
      const auth = request.headers.get('Authorization');

      // Verificar que el codigo de desbloqueo sea valido
      const unlock = url.searchParams.get('unlock');
      const ticketCode = key.split('/')[0];

      const ticket = await env.DB.prepare(
        'SELECT unlock_code FROM tickets WHERE code = ?'
      ).bind(ticketCode).first();

      if (!ticket || ticket.unlock_code !== unlock) {
        return err('No autorizado', 403);
      }

      const obj = await env.STORAGE.get(key);
      if (!obj) return err('Archivo no encontrado', 404);

      const headers = {
        ...CORS,
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      };

      return new Response(obj.body, { headers });
    }

    // ══════════════════════════════════════════════
    // ADMIN — requiere password en Authorization
    // ══════════════════════════════════════════════
    const authHeader = request.headers.get('Authorization') || '';
    const isAdmin = authHeader === 'Bearer ' + ADMIN_PASSWORD;

    // ── GET /api/admin/tickets — listar todos los tickets
    if (method === 'GET' && path === '/api/admin/tickets') {
      if (!isAdmin) return err('No autorizado', 403);

      const { results } = await env.DB.prepare(
        'SELECT * FROM tickets ORDER BY fecha DESC'
      ).all();

      return json(results);
    }

    // ── PUT /api/admin/ticket/:code — actualizar estado, nota, unlock_code
    if (method === 'PUT' && path.startsWith('/api/admin/ticket/')) {
      if (!isAdmin) return err('No autorizado', 403);

      const code = path.split('/')[4];
      const body = await request.json();
      const { estado, nota_publica, nota_entrega, unlock_code } = body;

      await env.DB.prepare(
        `UPDATE tickets SET
          estado = COALESCE(?, estado),
          nota_publica = COALESCE(?, nota_publica),
          nota_entrega = COALESCE(?, nota_entrega),
          unlock_code = COALESCE(?, unlock_code)
        WHERE code = ?`
      ).bind(estado || null, nota_publica || null, nota_entrega || null, unlock_code || null, code).run();

      return json({ ok: true });
    }

    // ── DELETE /api/admin/ticket/:code — borrar ticket
    if (method === 'DELETE' && path.startsWith('/api/admin/ticket/')) {
      if (!isAdmin) return err('No autorizado', 403);

      const code = path.split('/')[4];

      // Borrar archivos de R2
      try {
        const lista = await env.STORAGE.list({ prefix: code + '/' });
        for (const obj of lista.objects) {
          await env.STORAGE.delete(obj.key);
        }
      } catch (e) {}

      await env.DB.prepare('DELETE FROM tickets WHERE code = ?').bind(code).run();
      return json({ ok: true });
    }

    // ── POST /api/admin/ticket — crear ticket desde admin (o llegada del form)
    if (method === 'POST' && path === '/api/admin/ticket') {
      const body = await request.json();
      const { code, email } = body;

      if (!code || !email) return err('code y email requeridos');

      // Verificar que no exista
      const exists = await env.DB.prepare(
        'SELECT code FROM tickets WHERE code = ?'
      ).bind(code).first();

      if (exists) return err('Ticket ya existe');

      await env.DB.prepare(
        `INSERT INTO tickets (code, email, estado, fecha)
         VALUES (?, ?, 'pendiente', datetime('now'))`
      ).bind(code, email).run();

      return json({ ok: true, code });
    }

    // ── POST /api/admin/upload/:code — subir archivo a R2
    if (method === 'POST' && path.startsWith('/api/admin/upload/')) {
      if (!isAdmin) return err('No autorizado', 403);

      const code = path.split('/')[4];
      const fileName = url.searchParams.get('filename');
      if (!fileName) return err('filename requerido');

      const key = code + '/' + fileName;
      const contentType = request.headers.get('Content-Type') || 'application/octet-stream';

      await env.STORAGE.put(key, request.body, {
        httpMetadata: { contentType },
      });

      return json({ ok: true, key });
    }

    // ── DELETE /api/admin/archivo — borrar archivo de R2
    if (method === 'DELETE' && path.startsWith('/api/admin/archivo/')) {
      if (!isAdmin) return err('No autorizado', 403);

      const key = decodeURIComponent(path.replace('/api/admin/archivo/', ''));
      await env.STORAGE.delete(key);
      return json({ ok: true });
    }

    return err('Ruta no encontrada', 404);
  },
};
