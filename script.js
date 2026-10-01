document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Utilidades ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const EMAIL = /^[^\s@]+@sena\.edu\.co$/i, PASS = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  const passMsg = v => PASS.test(v) ? '' : 'Mínimo 8 caracteres, con letras y números.';
  function setErr(el, msg) {
    const e = $('#error-' + el.id); if (e) e.textContent = msg;
    el.setAttribute('aria-invalid', !!msg); el.classList.toggle('invalid', !!msg); return !msg;
  }
  const SEED_USERS = [
    { nombre: 'María Vargas', correo: 'mvargas@sena.edu.co', rol: 'Instructor', estado: 'Activo', clave: 'Bolt2026' },
    { nombre: 'Michael Valderrama', correo: 'mvalderrama@sena.edu.co', rol: 'TIC', estado: 'Activo', clave: 'Bolt2026' },
    { nombre: 'Mateo López Ávila', correo: 'mlopez@sena.edu.co', rol: 'Administrador', estado: 'Activo', clave: 'Bolt2026' }
  ];
  const getUsers = () => load('bolt_usuarios', SEED_USERS).map(u => ({ ...u, clave: u.clave || 'Bolt2026' }));

  /* ---------- 1. Inicio de sesión ---------- */
  const fl = $('#form-login');
  if (fl) {
    fl.addEventListener('submit', e => {
      e.preventDefault();
      const em = $('#email'), pw = $('#password'), rl = $('#role-select'), v = em.value.trim();
      const a = setErr(em, !v ? 'Ingrese su correo institucional.' : !EMAIL.test(v) ? 'Use un correo @sena.edu.co válido.' : '');
      const b = setErr(pw, !pw.value ? 'Ingrese su contraseña.' : passMsg(pw.value));
      $('#login-error').textContent = '';
      if (!a || !b) return (a ? pw : em).focus();
      const u = getUsers().find(x => x.correo.toLowerCase() === v.toLowerCase());
      if (!u || u.clave !== pw.value || u.rol !== rl.value || u.estado !== 'Activo') {
        $('#login-error').textContent = 'Credenciales o rol incorrectos, o usuario inactivo.'; return;
      }
      save('bolt_session', { user: u.nombre, email: u.correo, role: u.rol });
      location.href = 'dashboard.html';
    });
  }

  /* ---------- 2. Dashboard ---------- */
  if (!$('#display-username')) return;
  const session = load('bolt_session', null);
  if (!session) { location.replace('index.html'); return; }
  const role = session.role, main = $('#contenido'), dlg = $('#dlg');
  $('#display-username').textContent = session.user;
  $('#display-role').textContent = role;
  $('#user-avatar').textContent = session.user.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  let S = load('bolt_solicitudes', [
    { id: '#108', ambiente: '401', servicio: 'TIC', estado: 'Asignada', prioridad: 'Alta', tiempo: '15m' },
    { id: '#107', ambiente: '305', servicio: 'Seguridad', estado: 'Resuelta', prioridad: 'Media', tiempo: '1h' },
    { id: '#106', ambiente: '401', servicio: 'TIC', estado: 'En Proceso', prioridad: 'Alta', tiempo: '30m' },
    { id: '#105', ambiente: '303', servicio: 'Seguridad', estado: 'Resuelta', prioridad: 'Baja', tiempo: '2h' }]);
  let A = load('bolt_ambientes', [
    { num: 'Ambiente 401', ubicacion: 'Piso 4 - Torre A', capacidad: '35 Aprendices', estado: 'Con Novedad' },
    { num: 'Ambiente 305', ubicacion: 'Piso 3 - Torre B', capacidad: '30 Aprendices', estado: 'Disponible' },
    { num: 'Ambiente 303', ubicacion: 'Piso 3 - Torre A', capacidad: '40 Aprendices', estado: 'Disponible' },
    { num: 'Ambiente 201', ubicacion: 'Piso 2 - Torre A', capacidad: '25 Aprendices', estado: 'Disponible' }]);
  let U = getUsers();
  let N = load('bolt_notifs', [{ t: 'Novedad asignada en Ambiente 401.', r: 0 }, { t: 'Solicitud #107 resuelta por Seguridad.', r: 0 }, { t: 'Mantenimiento programado el viernes.', r: 0 }]);
  const persist = () => { save('bolt_solicitudes', S); save('bolt_ambientes', A); save('bolt_usuarios', U); save('bolt_notifs', N); };
  let sec = 'dash', q = '';

  const MENU = {
    Instructor: [['dash', '🏠 Inicio / Dashboard'], ['ambientes', '🏫 Catálogo de Ambientes'], ['solicitudes', '🎫 Mis Solicitudes'], ['reportes', '📊 Mis Estadísticas'], ['ajustes', '⚙️ Ajustes']],
    TIC: [['dash', '📥 Tickets Asignados'], ['solicitudes', '⚠️ Gestión de Novedades'], ['ambientes', '🏫 Ambientes'], ['ajustes', '⚙️ Ajustes']],
    Administrador: [['dash', '📊 Panel General'], ['usuarios', '👥 Gestión de Usuarios'], ['ambientes', '🏫 Gestión de Ambientes'], ['reportes', '📈 Reportes de Gestión'], ['ajustes', '⚙️ Ajustes']]
  };

  /* ---------- Componentes reutilizables ---------- */
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3500); };
  const notify = t => { N.unshift({ t, r: 0 }); persist(); renderBadge(); };
  const renderBadge = () => { const n = N.filter(x => !x.r).length; const b = $('#notif-count'); b.textContent = n; b.hidden = !n; };
  const badge = t => `<span class="badge-status ${['Resuelta', 'Disponible', 'Activo', 'Baja'].includes(t) ? 'bg-success' : ['Alta', 'Con Novedad', 'Cerrado', 'Inactivo'].includes(t) ? 'bg-danger' : 'bg-warning'}">${esc(t)}</span>`;
  const match = arr => !q || arr.join(' ').toLowerCase().includes(q);
  const tbl = (cap, heads, rows) => rows.length
    ? `<section class="table-section"><div class="table-wrap"><table class="data-table"><caption>${cap}</caption><thead><tr>${heads.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`
    : `<p class="table-section">No hay resultados${q ? ` para «${esc(q)}»` : ''}.</p>`;
  const kpi = (t, v) => `<article class="metric-card"><h3>${t}</h3><p class="metric-value">${v}</p></article>`;

  function field(f) {
    const ctl = f.type === 'select'
      ? `<select id="${f.id}"><option value="">-- Seleccione --</option>${f.opts.map(o => { const [v, l = v] = [].concat(o); return `<option value="${esc(v)}">${esc(l)}</option>`; }).join('')}</select>`
      : f.type === 'textarea' ? `<textarea id="${f.id}" rows="3"></textarea>`
      : `<input id="${f.id}" type="${f.type || 'text'}">`;
    return `<div class="form-group"><label for="${f.id}">${f.label}${f.req ? ' *' : ''}</label>${ctl}<span class="error-message" id="error-${f.id}" role="alert"></span></div>`;
  }
  /* Diálogo con formulario validado. ok(valores) puede devolver {id,msg} para mantenerlo abierto. */
  function dialog(title, fields, ok, label = 'Guardar') {
    dlg.innerHTML = `<h2 id="dlg-title">${title}</h2><form novalidate>${fields.map(field).join('')}<div class="modal-actions"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button type="submit" class="btn btn-primary">${label}</button></div></form>`;
    fields.forEach(f => { if (f.val) $('#' + f.id, dlg).value = f.val; });
    $('[data-close]', dlg).onclick = () => dlg.close();
    $('form', dlg).onsubmit = e => {
      e.preventDefault(); let first = null; const v = {};
      fields.forEach(f => {
        const el = $('#' + f.id, dlg), val = el.value.trim(); v[f.id] = val;
        const m = !val && f.req ? 'Este campo es obligatorio.' : val && f.check ? f.check(val) : '';
        if (!setErr(el, m) && !first) first = el;
      });
      if (first) return first.focus();
      const r = ok(v);
      if (r) { const el = $('#' + r.id, dlg); setErr(el, r.msg); return el.focus(); }
      dlg.close();
    };
    dlg.showModal();
  }
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  const ambOpts = () => A.map(a => { const n = a.num.replace('Ambiente ', ''); return [n, a.num]; });
  const min = (n, m) => v => v.length < n ? m : '';

  function nueva(amb, serv, prio, desc) {
    const id = '#' + (Math.max(0, ...S.map(s => parseInt(s.id.slice(1)))) + 1);
    S.unshift({ id, ambiente: amb, servicio: serv, estado: 'Asignada', prioridad: prio, tiempo: '1m', detalle: desc });
    const a = A.find(x => x.num === 'Ambiente ' + amb); if (a && prio === 'Alta' && desc) a.estado = 'Con Novedad';
    notify(`Solicitud ${id} registrada para el Ambiente ${amb}.`); toast(`Solicitud ${id} enviada a ${serv}.`); render();
  }

  /* ---------- Vistas ---------- */
  function rowsSol(tech) {
    return S.filter(s => match([s.id, s.ambiente, s.servicio, s.estado])).map(s => `<tr><td><b>${s.id}</b></td><td>${esc(s.ambiente)}</td><td>${s.servicio}</td><td>${badge(s.estado)}</td><td>${badge(s.prioridad)}</td><td>${s.tiempo}</td><td>${tech
      ? `<button class="btn-sm btn-action" data-act="atender" data-id="${s.id}">${s.estado === 'Resuelta' ? 'Editar' : 'Atender'}</button>`
      : `<button class="btn-sm btn-action" data-act="calificar" data-id="${s.id}">${s.estado === 'Resuelta' ? 'Calificar ★' : 'Seguimiento'}</button>`}</td></tr>`);
  }
  const tSol = tech => tbl('Solicitudes recientes', ['ID', 'Ambiente', 'Servicio', 'Estado', 'Prioridad', 'Tiempo', 'Acciones'], rowsSol(tech));
  const head = (h, btn = '') => `<div class="page-head"><h2>${h}</h2>${btn}</div>`;

  function view() {
    const act = S.filter(s => s.estado !== 'Resuelta').length, res = S.length - act, tech = role !== 'Instructor';
    if (sec === 'dash') {
      if (role === 'Instructor') return `<section class="hero-actions"><button class="btn btn-urgent" data-act="novedad">🔴 Reportar Novedad Urgente <span class="tag">&lt; 3 clics</span></button><button class="btn btn-primary" data-act="apertura">🔵 Solicitar Apertura / Asistencia <span class="tag">&lt; 3 clics</span></button></section><section class="metrics-grid">${kpi('Solicitudes Activas', act)}${kpi('Solicitudes Resueltas', res)}${kpi('🏫 Ambientes con novedad', A.filter(a => a.estado === 'Con Novedad').length)}</section>${tSol(false)}`;
      if (role === 'TIC') return `<h2>Atención de Novedades y Solicitudes</h2><section class="metrics-grid">${kpi('Atención Inmediata (Alta)', S.filter(s => s.prioridad === 'Alta' && s.estado !== 'Resuelta').length)}${kpi('En Atención', act)}${kpi('Resueltas', res)}</section>${tSol(true)}`;
      return `<h2>Panel General de Control</h2><section class="metrics-grid">${kpi('Total Solicitudes', S.length)}${kpi('Pendientes', act)}${kpi('Usuarios activos', U.filter(u => u.estado === 'Activo').length)}</section>${tSol(true)}`;
    }
    if (sec === 'ambientes') return head('🏫 Catálogo y Disponibilidad de Ambientes', role === 'Administrador' ? '<button class="btn btn-primary" data-act="crearAmb">+ Agregar Ambiente</button>' : '')
      + tbl('Ambientes', ['Ambiente', 'Ubicación', 'Capacidad', 'Estado', 'Acciones'], A.filter(a => match([a.num, a.ubicacion, a.estado])).map(a => `<tr><td><b>${esc(a.num)}</b></td><td>${esc(a.ubicacion)}</td><td>${esc(a.capacidad)}</td><td>${badge(a.estado)}</td><td>${role === 'Administrador' ? `<button class="btn-sm btn-action" data-act="estadoAmb" data-n="${esc(a.num)}">Cambiar estado</button>` : a.estado === 'Disponible' ? `<button class="btn-sm btn-primary" data-act="apertura" data-n="${esc(a.num.replace('Ambiente ', ''))}">Solicitar apertura</button>` : ''}</td></tr>`));
    if (sec === 'solicitudes') return `<h2>🎫 Historial de Solicitudes y Novedades</h2>${tSol(tech)}`;
    if (sec === 'usuarios') return head('👥 Gestión de Usuarios', '<button class="btn btn-primary" data-act="crearUsr">+ Crear Usuario</button>')
      + tbl('Usuarios', ['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'], U.filter(u => match([u.nombre, u.correo, u.rol])).map(u => `<tr><td><b>${esc(u.nombre)}</b></td><td>${esc(u.correo)}</td><td>${u.rol}</td><td>${badge(u.estado)}</td><td><button class="btn-sm btn-action" data-act="editUsr" data-c="${esc(u.correo)}">Editar</button></td></tr>`));
    if (sec === 'reportes') {
      const c = S.filter(s => s.calif), prom = c.length ? (c.reduce((t, s) => t + +s.calif, 0) / c.length).toFixed(1) + ' / 5 ★' : 'Sin calificaciones';
      return `<h2>📊 Reportes de Gestión</h2><section class="metrics-grid">${kpi('Solicitudes TIC', S.filter(s => s.servicio === 'TIC').length)}${kpi('Solicitudes Seguridad', S.filter(s => s.servicio === 'Seguridad').length)}${kpi('Satisfacción', prom)}</section><button class="btn btn-primary" data-act="exportar">📥 Descargar reporte (CSV)</button>`;
    }
    return `<h2>⚙️ Ajustes</h2><section class="table-section"><dl class="info-list"><dt>Usuario</dt><dd>${esc(session.user)}</dd><dt>Correo</dt><dd>${esc(session.email)}</dd><dt>Rol</dt><dd>${role}</dd></dl><button class="btn btn-primary" data-act="clave">Cambiar contraseña</button></section>`;
  }

  function render() {
    $('#sidebar-menu').innerHTML = MENU[role].map(([id, l]) => `<li class="${id === sec ? 'active' : ''}"><a href="#" data-sec="${id}"${id === sec ? ' aria-current="page"' : ''}>${l}</a></li>`).join('');
    main.innerHTML = view();
    $('#resultados').textContent = q ? `${main.querySelectorAll('tbody tr').length} resultados` : '';
  }

  /* ---------- Acciones ---------- */
  const ACT = {
    novedad: () => dialog('Reportar novedad urgente', [{ id: 'amb', label: 'Ambiente de formación', type: 'select', opts: ambOpts(), req: 1 }, { id: 'serv', label: 'Área responsable', type: 'select', opts: ['TIC', 'Seguridad'], req: 1 }, { id: 'desc', label: 'Descripción de la novedad', type: 'textarea', req: 1, check: min(10, 'Describa la novedad (mínimo 10 caracteres).') }], v => nueva(v.amb, v.serv, 'Alta', v.desc), 'Enviar novedad'),
    apertura: b => dialog('Solicitar apertura / asistencia', [{ id: 'amb', label: 'Ambiente', type: 'select', opts: ambOpts(), req: 1, val: b.dataset.n }, { id: 'hora', label: 'Hora requerida', type: 'time', req: 1 }], v => nueva(v.amb, 'Seguridad', 'Media', ''), 'Solicitar'),
    calificar: b => {
      const s = S.find(x => x.id === b.dataset.id);
      if (s.estado !== 'Resuelta') return toast(`Solicitud ${s.id}: ${s.estado} en ${s.servicio}. Tiempo: ${s.tiempo}.`);
      dialog(`Calificar atención ${s.id}`, [{ id: 'nota', label: 'Calificación', type: 'select', opts: [['5', '5 ★ Excelente'], ['4', '4 ★'], ['3', '3 ★'], ['2', '2 ★'], ['1', '1 ★ Deficiente']], req: 1, val: s.calif }, { id: 'obs', label: 'Comentario' , type: 'textarea' }], v => { s.calif = v.nota; persist(); toast('¡Gracias por calificar!'); }, 'Enviar');
    },
    atender: b => {
      const s = S.find(x => x.id === b.dataset.id);
      dialog(`Atender solicitud ${s.id}`, [{ id: 'estado', label: 'Estado', type: 'select', opts: ['Asignada', 'En Proceso', 'Resuelta'], req: 1, val: s.estado }, { id: 'obs', label: 'Observaciones', type: 'textarea', req: 1, check: min(5, 'Escriba una observación (mínimo 5 caracteres).') }], v => { s.estado = v.estado; s.obs = v.obs; persist(); notify(`Solicitud ${s.id} actualizada a ${v.estado}.`); toast('Solicitud actualizada.'); render(); });
    },
    crearAmb: () => dialog('Agregar ambiente', [{ id: 'num', label: 'Nombre', req: 1, check: v => A.some(a => a.num.toLowerCase() === v.toLowerCase()) ? 'Ese ambiente ya existe.' : '' }, { id: 'ubi', label: 'Ubicación', req: 1 }, { id: 'cap', label: 'Capacidad (aprendices)', type: 'number', req: 1, check: v => v < 1 || v > 100 ? 'Ingrese un valor entre 1 y 100.' : '' }], v => { A.push({ num: v.num, ubicacion: v.ubi, capacidad: v.cap + ' Aprendices', estado: 'Disponible' }); persist(); toast('Ambiente agregado.'); render(); }),
    estadoAmb: b => { const a = A.find(x => x.num === b.dataset.n); dialog(`Estado de ${esc(a.num)}`, [{ id: 'e', label: 'Estado', type: 'select', opts: ['Disponible', 'Con Novedad', 'Cerrado'], req: 1, val: a.estado }], v => { a.estado = v.e; persist(); toast('Estado actualizado.'); render(); }); },
    crearUsr: () => dialog('Crear usuario', [{ id: 'nom', label: 'Nombre completo', req: 1, check: min(3, 'Mínimo 3 caracteres.') }, { id: 'cor', label: 'Correo institucional', type: 'email', req: 1, check: v => !EMAIL.test(v) ? 'Use un correo @sena.edu.co válido.' : U.some(u => u.correo.toLowerCase() === v.toLowerCase()) ? 'Ese correo ya está registrado.' : '' }, { id: 'rol', label: 'Rol', type: 'select', opts: ['Instructor', 'TIC', 'Administrador'], req: 1 }, { id: 'cla', label: 'Contraseña temporal', type: 'password', req: 1, check: passMsg }], v => { U.push({ nombre: v.nom, correo: v.cor, rol: v.rol, estado: 'Activo', clave: v.cla }); persist(); toast('Usuario creado.'); render(); }),
    editUsr: b => { const u = U.find(x => x.correo === b.dataset.c); dialog(`Editar ${esc(u.nombre)}`, [{ id: 'rol', label: 'Rol', type: 'select', opts: ['Instructor', 'TIC', 'Administrador'], req: 1, val: u.rol }, { id: 'est', label: 'Estado', type: 'select', opts: ['Activo', 'Inactivo'], req: 1, val: u.estado }], v => { u.rol = v.rol; u.estado = v.est; persist(); toast('Usuario actualizado.'); render(); }); },
    clave: () => dialog('Cambiar contraseña', [{ id: 'act', label: 'Contraseña actual', type: 'password', req: 1 }, { id: 'nue', label: 'Nueva contraseña', type: 'password', req: 1, check: passMsg }, { id: 'rep', label: 'Confirmar nueva contraseña', type: 'password', req: 1 }], v => {
      const u = U.find(x => x.correo === session.email);
      if (u.clave !== v.act) return { id: 'act', msg: 'La contraseña actual es incorrecta.' };
      if (v.nue !== v.rep) return { id: 'rep', msg: 'Las contraseñas no coinciden.' };
      u.clave = v.nue; persist(); toast('Contraseña actualizada.');
    }),
    exportar: () => {
      const csv = ['ID,Ambiente,Servicio,Estado,Prioridad,Tiempo', ...S.map(s => [s.id, s.ambiente, s.servicio, s.estado, s.prioridad, s.tiempo].join(','))].join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = 'reporte_bolt.csv'; a.click(); toast('Reporte descargado.');
    }
  };

  /* ---------- Eventos ---------- */
  main.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) ACT[b.dataset.act](b); });
  $('#sidebar-menu').addEventListener('click', e => { const a = e.target.closest('[data-sec]'); if (!a) return; e.preventDefault(); sec = a.dataset.sec; q = ''; $('#buscar').value = ''; render(); main.focus(); });
  $('#buscar').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  $('.search-bar').addEventListener('submit', e => e.preventDefault());
  $('#btn-notif').addEventListener('click', () => {
    dlg.innerHTML = `<h2 id="dlg-title">🔔 Notificaciones</h2><ul class="note-list">${N.length ? N.map(n => `<li class="${n.r ? '' : 'new'}">${esc(n.t)}</li>`).join('') : '<li>Sin notificaciones.</li>'}</ul><div class="modal-actions"><button type="button" class="btn btn-secondary" data-close>Cerrar</button></div>`;
    $('[data-close]', dlg).onclick = () => dlg.close(); dlg.showModal();
    N.forEach(n => n.r = 1); persist(); renderBadge();
  });
  $('#btn-logout').addEventListener('click', () => { localStorage.removeItem('bolt_session'); location.href = 'index.html'; });

  renderBadge(); render();
});
