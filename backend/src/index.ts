import { Resend } from 'resend';

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
  AUTH_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

const generateSignature = async (text: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

const hashPassword = async (password: string, salt?: string) => {
  const encoder = new TextEncoder();
  const s = salt ? 
    new Uint8Array(atob(salt).split("").map(c => c.charCodeAt(0))) : 
    crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const buffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: s, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  
  const hash = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const saltStr = btoa(String.fromCharCode(...s));
  return `${saltStr}.${hash}`;
};

const verifyPassword = async (password: string, storedHash: string) => {
  if (!storedHash.includes('.')) return false; 
  const [salt] = storedHash.split('.');
  const newHash = await hashPassword(password, salt);
  return newHash === storedHash;
};

const getUserIdFromAuth = async (request: Request, env: Env) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  
  // Para compatibilidad con el password de admin anterior
  if (token === env.ADMIN_PASSWORD) {
    return { id: 1, usuario: 'admin', rol: 'superadmin' };
  }

  try {
    const parts = token.split('.');
    // Compatibilidad temporal con tokens antiguos (sin firma)
    if (parts.length === 1) {
      const [id, usuario, expires] = atob(token).split(':');
      if (parseInt(expires) < Date.now()) return null;
      return { id: parseInt(id), usuario, expires: parseInt(expires) };
    }
    
    if (parts.length !== 2) return null;
    const payload = parts[0];
    const signature = parts[1];

    const expectedSignature = await generateSignature(payload, env.AUTH_SECRET || 'default_fallback_secret');
    if (signature !== expectedSignature) return null;

    const [id, usuario, expires] = atob(payload).split(':');
    if (parseInt(expires) < Date.now()) return null;
    return { id: parseInt(id), usuario, expires: parseInt(expires) };
  } catch {
    return null;
  }
};

const logAction = async (env: Env, userId: number, fichaId: number | null, action: string, details: any) => {
  try {
    await env.DB.prepare('INSERT INTO historial_cambios (usuario_id, ficha_id, accion, detalles) VALUES (?, ?, ?, ?)')
      .bind(userId, fichaId, action, JSON.stringify(details)).run();
  } catch (e) {
    console.error('Error logging action:', e);
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // --- PÚBLICO ---
      if (path === '/api/config' && request.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT clave, valor FROM configuracion').all();
        return jsonResponse(Object.fromEntries(results.map((r: any) => [r.clave, r.valor])));
      }

      if (path === '/api/fichas' && request.method === 'POST') {
        const body = await request.json() as any;
        const { ficha, escolaridad, padres, hermanos, convivientes } = body;
        
        const cleanBind = (stmt: any, ...args: any[]) => stmt.bind(...args.map(v => v === undefined ? null : v));

        const resFicha = await cleanBind(env.DB.prepare(`
          INSERT INTO fichas (
            apellido, nombre, dni_tipo, dni_nro, sexo, fecha_nac, lugar_nac,
            direccion, localidad, provincia, pais, cp, telefono_alumno, email_alumno,
            nivel_ingreso, grado_anio, repitente, salud_detalles, embarazo_parto,
            discapacidad, tiene_cud, obra_social, otras_actividades, tiene_problemas_aprendizaje,
            problemas_aprendizaje, tratamiento_profesional, tratamiento_detalles,
            motivo_eleccion, situacion_socioeconomica, observaciones_nivel, otros_datos, 
            contacto_entrevista_nombre, contacto_entrevista_medio, contacto_entrevista_dato,
            observaciones_generales, ciclo_lectivo
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `),
          ficha.apellido, ficha.nombre, ficha.dni_tipo, ficha.dni_nro, ficha.sexo, ficha.fecha_nac, ficha.lugar_nac,
          ficha.direccion, ficha.localidad, ficha.provincia, ficha.pais, ficha.cp, ficha.telefono_alumno, ficha.email_alumno,
          ficha.nivel_ingreso, ficha.grado_anio, ficha.repitente ? 1 : 0, ficha.salud_detalles, ficha.embarazo_parto,
          ficha.discapacidad, ficha.tiene_cud ? 1 : 0, ficha.obra_social, ficha.otras_actividades, ficha.tiene_problemas_aprendizaje ? 1 : 0,
          ficha.problemas_aprendizaje, ficha.tratamiento_profesional ? 1 : 0, ficha.tratamiento_detalles,
          ficha.motivo_eleccion, ficha.situacion_socioeconomica, ficha.observaciones_nivel, ficha.otros_datos, 
          ficha.contacto_entrevista_nombre, ficha.contacto_entrevista_medio, ficha.contacto_entrevista_dato,
          ficha.observaciones_generales, ficha.ciclo_lectivo
        ).run();

        const fichaId = resFicha.meta.last_row_id;
        const batch = [];
        if (escolaridad?.length) {
          for (const esc of escolaridad) {
            batch.push(cleanBind(env.DB.prepare('INSERT INTO escolaridad (ficha_id, nivel, anio_cursado, escuela, observaciones) VALUES (?,?,?,?,?)'),
              fichaId, esc.nivel, esc.anio_cursado, esc.escuela, esc.observaciones));
          }
        }
        if (padres?.length) {
          for (const p of padres) {
            batch.push(cleanBind(env.DB.prepare(`
              INSERT INTO padres_tutores (ficha_id, rol, apellido, nombre, dni_nro, estado_civil, fecha_nac, lugar_nac_datos, direccion, localidad, provincia, pais, cp, telefono_casa, celular, whatsapp_contacto, email, profesion_ocupacion, empresa_laboral, direccion_laboral, telefono_laboral, horarios_laborales)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `), fichaId, p.rol, p.apellido, p.nombre, p.dni_nro, p.estado_civil, p.fecha_nac, p.lugar_nac_datos, p.direccion, p.localidad, p.provincia, p.pais, p.cp, p.telefono_casa, p.celular, p.whatsapp_contacto ? 1 : 0, p.email, p.profesion_ocupacion, p.empresa_laboral, p.direccion_laboral, p.telefono_laboral, p.horarios_laborales));
          }
        }
        if (hermanos?.length) {
          for (const h of hermanos) {
            batch.push(cleanBind(env.DB.prepare('INSERT INTO hermanos (ficha_id, vinculo, nombre_apellido, dni_nro, fecha_nac, estado_civil, estudios_escuela, domicilio_ocupacion, ocupacion) VALUES (?,?,?,?,?,?,?,?,?)'),
              fichaId, h.vinculo, h.nombre_apellido, h.dni_nro, h.fecha_nac, h.estado_civil, h.estudios_escuela, h.domicilio_ocupacion, h.ocupacion));
          }
        }
        if (convivientes?.length) {
          for (const c of convivientes) {
            batch.push(cleanBind(env.DB.prepare('INSERT INTO convivientes (ficha_id, nombre_apellido, vinculo, edad, observaciones) VALUES (?,?,?,?,?)'),
              fichaId, c.nombre_apellido, c.vinculo, c.edad, c.observaciones));
          }
        }

        if (batch.length > 0) await env.DB.batch(batch);

        // Notificación vía Resend (Asincrónica si es posible)
        if (env.RESEND_API_KEY) {
          const sendResend = async () => {
            console.log('DEBUG_EMAIL: Iniciando envío Resend...');
            try {
              const resend = new Resend(env.RESEND_API_KEY);
              await resend.emails.send({
                from: 'Inscripciones La Cecilia <onboarding@resend.dev>',
                to: 'laceciliasecretaria@gmail.com',
                subject: `Nueva Solicitud: ${ficha.apellido}, ${ficha.nombre}`,
                text: `Nueva solicitud recibida.\nAlumno: ${ficha.apellido}, ${ficha.nombre}\nNivel: ${ficha.nivel_ingreso}\nLink: ${env.FRONTEND_URL}/admin`
              });
              console.log('DEBUG_EMAIL: Resend enviado con éxito.');
            } catch (err: any) { console.error('Error Resend:', err.message); }
          };
          
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(sendResend());
          } else {
            await sendResend();
          }
        }

        // Notificación vía Telegram (Asincrónica si es posible)
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const sendTelegram = async () => {
            const text = `<b>🔔 Nueva Solicitud de Ingreso</b>\n\n` +
                         `<b>Alumno:</b> ${ficha.apellido}, ${ficha.nombre}\n` +
                         `<b>DNI:</b> ${ficha.dni_nro}\n` +
                         `<b>Nivel:</b> ${ficha.nivel_ingreso} - ${ficha.grado_anio}\n\n` +
                         `<a href="${env.FRONTEND_URL}/admin">Ver en el Panel Administrativo</a>`;
            
            try {
              await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
              });
            } catch (e) { console.error('Error Telegram:', e); }
          };

          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(sendTelegram());
          } else {
            await sendTelegram();
          }
        }

        return jsonResponse({ success: true, id: fichaId }, 201);
      }

      // --- ADMIN (Auth basado en usuarios) ---
      if (path.startsWith('/api/admin/')) {
        if (path === '/api/admin/login' && request.method === 'POST') {
          const { usuario, password } = await request.json() as any;
          const user = await env.DB.prepare('SELECT * FROM usuarios WHERE usuario = ?')
            .bind(usuario).first() as any;
          
          if (!user) return jsonResponse({ error: 'Credenciales inválidas' }, 401);
          if (user.activo === 0) return jsonResponse({ error: 'Usuario inactivo' }, 403);

          const isValid = await verifyPassword(password, user.password);
          if (!isValid) {
            // Soporte temporal para migrar contraseñas de texto plano a hash en el primer login
            if (password === user.password) {
              const newHash = await hashPassword(password);
              await env.DB.prepare('UPDATE usuarios SET password = ? WHERE id = ?').bind(newHash, user.id).run();
            } else {
              return jsonResponse({ error: 'Credenciales inválidas' }, 401);
            }
          }
          
          // Generar un token firmado HMAC
          const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días
          const payload = btoa(`${user.id}:${user.usuario}:${expiry}`);
          const signature = await generateSignature(payload, env.AUTH_SECRET || 'default_fallback_secret');
          const token = `${payload}.${signature}`;
          
          return jsonResponse({ success: true, token, user: { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } });
        }

        const currentUser = await getUserIdFromAuth(request, env);
        if (!currentUser) return jsonResponse({ error: 'No autorizado' }, 401);
        if (path === '/api/admin/fichas' && request.method === 'GET') {
          const { results } = await env.DB.prepare(`
            SELECT f.*, 
              (SELECT MIN(fecha_hora) FROM entrevistas WHERE ficha_id = f.id AND estado != 'cancelada' AND fecha_hora >= CURRENT_TIMESTAMP) as proxima_entrevista
            FROM fichas f 
            ORDER BY f.fecha_solicitud DESC
          `).all();
          return jsonResponse(results);
        }
        if (path.startsWith('/api/admin/fichas/') && request.method === 'GET') {
          const id = path.split('/').pop();
          const ficha = await env.DB.prepare('SELECT * FROM fichas WHERE id = ?').bind(id).first();
          if (!ficha) return jsonResponse({ error: 'No encontrado' }, 404);
          const [escolaridad, padres, hermanos, convivientes, entrevistas] = await Promise.all([
            env.DB.prepare('SELECT * FROM escolaridad WHERE ficha_id = ?').bind(id).all().then(r => r.results),
            env.DB.prepare('SELECT * FROM padres_tutores WHERE ficha_id = ?').bind(id).all().then(r => r.results),
            env.DB.prepare('SELECT * FROM hermanos WHERE ficha_id = ?').bind(id).all().then(r => r.results),
            env.DB.prepare('SELECT * FROM convivientes WHERE ficha_id = ?').bind(id).all().then(r => r.results),
            env.DB.prepare('SELECT * FROM entrevistas WHERE ficha_id = ?').bind(id).all().then(r => r.results),
          ]);
          return jsonResponse({ ficha, escolaridad, padres, hermanos, convivientes, entrevistas });
        }
        if (path === '/api/admin/entrevistas' && request.method === 'POST') {
          const { ficha_id, fecha_hora, notas } = await request.json() as any;
          
          // Validar superposición de 1 hora
          const newTime = new Date(fecha_hora).getTime();
          const { results: existing } = await env.DB.prepare('SELECT fecha_hora FROM entrevistas WHERE estado != "cancelada"').all();
          const overlap = existing.some((e: any) => {
            const et = new Date(e.fecha_hora).getTime();
            return Math.abs(newTime - et) < 3600000; // 60 minutos
          });

          if (overlap) {
            return jsonResponse({ error: 'Existe otra entrevista programada en un horario cercano (franja de 1 hora).' }, 400);
          }

          await env.DB.batch([
            env.DB.prepare('INSERT INTO entrevistas (ficha_id, fecha_hora, notas) VALUES (?,?,?)').bind(ficha_id, fecha_hora, notas),
            env.DB.prepare("UPDATE fichas SET estado = 'entrevista_programada' WHERE id = ?").bind(ficha_id)
          ]);
          return jsonResponse({ success: true });
        }

        if (path === '/api/admin/agenda' && request.method === 'GET') {
          const { results } = await env.DB.prepare(`
            SELECT e.*,
              f.nombre as alumno_nombre, f.apellido as alumno_apellido, f.dni_nro as alumno_dni,
              f.contacto_entrevista_medio, f.contacto_entrevista_dato, f.contacto_entrevista_nombre
            FROM entrevistas e JOIN fichas f ON e.ficha_id = f.id ORDER BY e.fecha_hora ASC
          `).all();
          return jsonResponse(results);
        }

        if (path.startsWith('/api/admin/fichas/') && request.method === 'PATCH') {
          const id = path.split('/').pop();
          const body = await request.json() as any;
          
          const batch: any[] = [];

          // Caso 1: Actualización simple (solo campos de ficha)
          if (!body.ficha && !body.escolaridad) {
            const keys = Object.keys(body).filter(k => k !== 'id');
            if (keys.length > 0) {
              const isFullEdit = keys.some(k => !['estado', 'decision_final', 'observaciones_generales'].includes(k));
              if (isFullEdit) body.modificado_admin = 1;

              const setClause = keys.map(k => `${k} = ?`).join(', ');
              const values = keys.map(k => body[k]);
              batch.push(env.DB.prepare(`UPDATE fichas SET ${setClause} WHERE id = ?`).bind(...values, id));
            }
          } 
          // Caso 2: Actualización completa (objeto anidado)
          else {
            const { ficha, escolaridad, padres, hermanos, convivientes } = body;
            
            if (ficha) {
              const keys = Object.keys(ficha).filter(k => k !== 'id' && k !== 'id_str');
              const setClause = keys.map(k => `${k} = ?`).join(', ');
              const values = keys.map(k => ficha[k]);
              batch.push(env.DB.prepare(`UPDATE fichas SET ${setClause}, modificado_admin = 1 WHERE id = ?`).bind(...values, id));
            }

            if (escolaridad) {
              batch.push(env.DB.prepare('DELETE FROM escolaridad WHERE ficha_id = ?').bind(id));
              escolaridad.forEach((e: any) => {
                batch.push(env.DB.prepare('INSERT INTO escolaridad (ficha_id, nivel, anio_cursado, escuela, observaciones) VALUES (?,?,?,?,?)')
                  .bind(id, e.nivel, e.anio_cursado, e.escuela, e.observaciones));
              });
            }

            if (padres) {
              batch.push(env.DB.prepare('DELETE FROM padres_tutores WHERE ficha_id = ?').bind(id));
              padres.forEach((p: any) => {
                batch.push(env.DB.prepare('INSERT INTO padres_tutores (ficha_id, rol, apellido, nombre, dni_nro, estado_civil, fecha_nac, lugar_nac_datos, direccion, localidad, provincia, pais, cp, telefono_casa, celular, email, profesion_ocupacion, empresa_laboral, direccion_laboral, telefono_laboral, horarios_laborales) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
                  .bind(id, p.rol, p.apellido, p.nombre, p.dni_nro, p.estado_civil, p.fecha_nac, p.lugar_nac_datos, p.direccion, p.localidad, p.provincia, p.pais, p.cp, p.telefono_casa, p.celular, p.email, p.profesion_ocupacion, p.empresa_laboral, p.direccion_laboral, p.telefono_laboral, p.horarios_laborales));
              });
            }

            if (hermanos) {
              batch.push(env.DB.prepare('DELETE FROM hermanos WHERE ficha_id = ?').bind(id));
              hermanos.forEach((h: any) => {
                batch.push(env.DB.prepare('INSERT INTO hermanos (ficha_id, vinculo, nombre_apellido, dni_nro, fecha_nac, estado_civil, estudios_escuela, domicilio_ocupacion, ocupacion) VALUES (?,?,?,?,?,?,?,?,?)')
                  .bind(id, h.vinculo, h.nombre_apellido, h.dni_nro, h.fecha_nac, h.estado_civil, h.estudios_escuela, h.domicilio_ocupacion, h.ocupacion));
              });
            }

            if (convivientes) {
              batch.push(env.DB.prepare('DELETE FROM convivientes WHERE ficha_id = ?').bind(id));
              convivientes.forEach((c: any) => {
                batch.push(env.DB.prepare('INSERT INTO convivientes (ficha_id, nombre_apellido, vinculo, edad, observaciones) VALUES (?,?,?,?,?)')
                  .bind(id, c.nombre_apellido, c.vinculo, c.edad, c.observaciones));
              });
            }
          }



          if (batch.length > 0) await env.DB.batch(batch);
          
          await logAction(env, currentUser.id, parseInt(id!), 'edición', { 
            campos: Object.keys(body.ficha || body).filter(k => k !== 'id')
          });

          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/fichas/') && request.method === 'DELETE') {
          const id = path.split('/').pop();
          await env.DB.prepare('DELETE FROM fichas WHERE id = ?').bind(id).run();
          
          await logAction(env, currentUser.id, parseInt(id!), 'borrado', { id });
          
          return jsonResponse({ success: true });
        }
        
        if (path === '/api/admin/metrics' && request.method === 'GET') {
          const from = url.searchParams.get('from') || '2000-01-01';
          const to = url.searchParams.get('to') || '2100-01-01';

          const stats = await env.DB.prepare(`
            SELECT 
              nivel_ingreso,
              COUNT(*) as total,
              SUM(CASE WHEN decision_final = 'ingresa' THEN 1 ELSE 0 END) as concretados
            FROM fichas 
            WHERE fecha_solicitud >= ? AND fecha_solicitud <= ?
            GROUP BY nivel_ingreso
          `).bind(from, to).all();

          const history = await env.DB.prepare(`
            SELECT h.*, u.nombre as usuario_nombre, f.apellido || ', ' || f.nombre as ficha_nombre
            FROM historial_cambios h
            JOIN usuarios u ON h.usuario_id = u.id
            LEFT JOIN fichas f ON h.ficha_id = f.id
            ORDER BY h.fecha DESC LIMIT 100
          `).all();

          return jsonResponse({ stats: stats.results, history: history.results });
        }
        if (path.startsWith('/api/admin/entrevistas/') && request.method === 'PUT') {
          const id = path.split('/').filter(Boolean).pop();
          if (!id || isNaN(Number(id))) return jsonResponse({ error: 'ID inválido' }, 400);

          const { fecha_hora, notas, estado, respuesta, decision_final } = await request.json() as any;
          
          if (fecha_hora) {
            const newTime = new Date(fecha_hora).getTime();
            const { results: existing } = await env.DB.prepare('SELECT fecha_hora FROM entrevistas WHERE id != ? AND estado != "cancelada"').bind(id).all();
            const overlap = existing.some((e: any) => {
              const et = new Date(e.fecha_hora).getTime();
              return Math.abs(newTime - et) < 3600000;
            });
            if (overlap) {
              return jsonResponse({ error: 'Superposición con otra entrevista (franja de 1 hora).' }, 400);
            }
          }

          // Usar NULL para que COALESCE mantenga el valor actual si no se envía el nuevo
          const val = (v: any) => v === undefined ? null : v;
          const res = await env.DB.prepare('UPDATE entrevistas SET fecha_hora = COALESCE(?, fecha_hora), notas = COALESCE(?, notas), estado = COALESCE(?, estado), respuesta = COALESCE(?, respuesta) WHERE id = ?')
            .bind(val(fecha_hora), val(notas), val(estado), val(respuesta), id).run();
          
          // Si hay decisión final, actualizamos la ficha del alumno
          if (decision_final) {
            const ent = await env.DB.prepare('SELECT ficha_id FROM entrevistas WHERE id = ?').bind(id).first() as any;
            if (ent) {
              await env.DB.prepare('UPDATE fichas SET decision_final = ?, estado = ? WHERE id = ?')
                .bind(decision_final, decision_final === 'ingresa' ? 'finalizado' : 'contactado', ent.ficha_id).run();
            }
          }

          if (res.meta.changes === 0) return jsonResponse({ error: 'Entrevista no encontrada' }, 404);
          return jsonResponse({ success: true });
        }

        // --- GESTIÓN DE USUARIOS ---
        if (path === '/api/admin/usuarios' && request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios').all();
          return jsonResponse(results);
        }
        if (path === '/api/admin/usuarios' && request.method === 'POST') {
          const { usuario, password, nombre, rol } = await request.json() as any;
          if (!usuario || !password) return jsonResponse({ error: 'Usuario y contraseña requeridos' }, 400);
          
          const hashedPassword = await hashPassword(password);
          await env.DB.prepare('INSERT INTO usuarios (usuario, password, nombre, rol, activo) VALUES (?, ?, ?, ?, 1)')
            .bind(usuario, hashedPassword, nombre || usuario, rol || 'admin').run();
          
          await logAction(env, currentUser.id, null, 'creación_usuario', { usuario });
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/usuarios/') && request.method === 'PUT') {
          const id = path.split('/').pop();
          const { usuario, password, nombre, rol, activo } = await request.json() as any;
          
          const keys = [];
          const values = [];
          if (usuario !== undefined) { keys.push('usuario = ?'); values.push(usuario); }
          if (password !== undefined && password !== '') { 
            keys.push('password = ?'); 
            values.push(await hashPassword(password)); 
          }
          if (nombre !== undefined) { keys.push('nombre = ?'); values.push(nombre); }
          if (rol !== undefined) { keys.push('rol = ?'); values.push(rol); }
          if (activo !== undefined) { keys.push('activo = ?'); values.push(activo ? 1 : 0); }
          
          if (keys.length === 0) return jsonResponse({ error: 'Nada que actualizar' }, 400);
          
          await env.DB.prepare(`UPDATE usuarios SET ${keys.join(', ')} WHERE id = ?`)
            .bind(...values, id).run();
            
          await logAction(env, currentUser.id, null, 'edición_usuario', { id, campos: keys });
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/usuarios/') && request.method === 'DELETE') {
          const id = path.split('/').pop();
          if (parseInt(id!) === currentUser.id) return jsonResponse({ error: 'No puedes borrarte a ti mismo' }, 400);
          
          await env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
          await logAction(env, currentUser.id, null, 'borrado_usuario', { id });
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/entrevistas/') && request.method === 'DELETE') {
          const id = path.split('/').filter(Boolean).pop();
          if (!id || isNaN(Number(id))) return jsonResponse({ error: 'ID inválido' }, 400);

          const res = await env.DB.prepare('DELETE FROM entrevistas WHERE id = ?').bind(id).run();
          if (res.meta.changes === 0) return jsonResponse({ error: 'Entrevista no encontrada' }, 404);
          return jsonResponse({ success: true });
        }
      }

      return jsonResponse({ error: 'Ruta no encontrada' }, 404);

    } catch (e: any) {
      console.error('Error en API:', e.message, e.stack);
      if (e.message.includes('UNIQUE constraint failed: fichas.dni_nro')) {
        return jsonResponse({ error: 'El DNI ingresado ya se encuentra registrado en el sistema.', field: 'dni_nro' }, 400);
      }
      return jsonResponse({ error: `Error interno: ${e.message}` }, 500);
    }
  }
};
