import { Resend } from 'resend';

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
            discapacidad, tiene_cud, obra_social, otras_actividades, problemas_aprendizaje,
            motivo_eleccion, situacion_socioeconomica, observaciones_nivel, otros_datos, 
            contacto_entrevista_nombre, contacto_entrevista_medio, contacto_entrevista_dato,
            observaciones_generales, ciclo_lectivo
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `),
          ficha.apellido, ficha.nombre, ficha.dni_tipo, ficha.dni_nro, ficha.sexo, ficha.fecha_nac, ficha.lugar_nac,
          ficha.direccion, ficha.localidad, ficha.provincia, ficha.pais, ficha.cp, ficha.telefono_alumno, ficha.email_alumno,
          ficha.nivel_ingreso, ficha.grado_anio, ficha.repitente ? 1 : 0, ficha.salud_detalles, ficha.embarazo_parto,
          ficha.discapacidad, ficha.tiene_cud ? 1 : 0, ficha.obra_social, ficha.otras_actividades, ficha.problemas_aprendizaje,
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
              INSERT INTO padres_tutores (ficha_id, rol, apellido, nombre, dni_nro, estado_civil, fecha_nac, lugar_nac_datos, domicilio_datos, telefono_casa, celular, whatsapp_contacto, email, profesion_ocupacion, empresa_laboral, telefono_laboral, horarios_laborales)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `), fichaId, p.rol, p.apellido, p.nombre, p.dni_nro, p.estado_civil, p.fecha_nac, p.lugar_nac_datos, p.domicilio_datos, p.telefono_casa, p.celular, p.whatsapp_contacto ? 1 : 0, p.email, p.profesion_ocupacion, p.empresa_laboral, p.telefono_laboral, p.horarios_laborales));
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

        // Notificación vía Resend
        if (env.RESEND_API_KEY) {
          try {
            const resend = new Resend(env.RESEND_API_KEY);
            const { data: emailRes, error: emailErr } = await resend.emails.send({
              from: 'Inscripciones La Cecilia <onboarding@resend.dev>', // Usar dominio propio si se configura
              to: 'laceciliasecretaria@gmail.com',
              subject: `Nueva Solicitud de Ingreso: ${ficha.apellido}, ${ficha.nombre}`,
              text: `Se ha recibido una nueva solicitud de inscripción.\n\nAlumno: ${ficha.apellido}, ${ficha.nombre}\nNivel: ${ficha.nivel_ingreso} - ${ficha.grado_anio}\n\nPuede ver los detalles completos ingresando al panel administrativo: ${env.FRONTEND_URL}/admin`
            });
            
            if (emailErr) {
              console.error('Error de Resend:', emailErr);
            } else {
              console.log('Email enviado con éxito:', emailRes?.id);
            }
          } catch (err: any) {
            console.error('Error al enviar mail (excepción):', err.message);
          }
        } else {
          console.warn('RESEND_API_KEY no configurada. No se enviará notificación.');
        }

        return jsonResponse({ success: true, id: fichaId }, 201);
      }

      // --- ADMIN (Simulado con auth básico en header) ---
      const authHeader = request.headers.get('Authorization');
      const isAuthorized = authHeader === `Bearer ${env.ADMIN_PASSWORD}`;

      if (path.startsWith('/api/admin/')) {
        if (!isAuthorized) return jsonResponse({ error: 'No autorizado' }, 401);

        if (path === '/api/admin/login' && request.method === 'POST') {
          return jsonResponse({ success: true });
        }
        if (path === '/api/admin/fichas' && request.method === 'GET') {
          const { results } = await env.DB.prepare('SELECT * FROM fichas ORDER BY fecha_solicitud DESC').all();
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
            SELECT e.*, f.nombre as alumno_nombre, f.apellido as alumno_apellido, f.dni_nro as alumno_dni
            FROM entrevistas e JOIN fichas f ON e.ficha_id = f.id ORDER BY e.fecha_hora ASC
          `).all();
          return jsonResponse(results);
        }

        if (path.startsWith('/api/admin/fichas/') && request.method === 'PATCH') {
          const id = path.split('/').pop();
          const updates = await request.json() as any;
          
          const keys = Object.keys(updates).filter(k => k !== 'id');
          if (keys.length === 0) return jsonResponse({ success: true });

          // Si es una actualización masiva (no solo estado/decisión), marcar como editado por admin
          const isFullEdit = keys.some(k => !['estado', 'decision_final', 'observaciones_generales'].includes(k));
          if (isFullEdit) updates.modificado_admin = 1;

          const setClause = keys.map(k => `${k} = ?`).join(', ');
          const values = keys.map(k => updates[k]);
          
          await env.DB.prepare(`UPDATE fichas SET ${setClause} WHERE id = ?`)
            .bind(...values, id).run();
            
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/fichas/') && request.method === 'DELETE') {
          const id = path.split('/').pop();
          await env.DB.prepare('DELETE FROM fichas WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/entrevistas/') && request.method === 'PUT') {
          const id = path.split('/').pop();
          const { fecha_hora, notas, estado, respuesta } = await request.json() as any;
          
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

          await env.DB.prepare('UPDATE entrevistas SET fecha_hora = COALESCE(?, fecha_hora), notas = COALESCE(?, notas), estado = COALESCE(?, estado), respuesta = COALESCE(?, respuesta) WHERE id = ?')
            .bind(fecha_hora, notas, estado, respuesta, id).run();
          return jsonResponse({ success: true });
        }
        if (path.startsWith('/api/admin/entrevistas/') && request.method === 'DELETE') {
          const id = path.split('/').pop();
          await env.DB.prepare('DELETE FROM entrevistas WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true });
        }
      }

      return jsonResponse({ error: 'Ruta no encontrada' }, 404);

    } catch (e: any) {
      console.error('Error en API:', e.message, e.stack);
      if (e.message.includes('UNIQUE constraint failed: fichas.dni_nro')) {
        return jsonResponse({ error: 'El DNI ingresado ya se encuentra registrado en el sistema.' }, 400);
      }
      return jsonResponse({ error: `Error interno: ${e.message}` }, 500);
    }
  }
};
