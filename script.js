/* ===== BOLT · script.js — SOLO lógica e interacciones =====
   La estructura (formularios, tablas, menús, diálogos y plantillas)
   vive en index.html y dashboard.html. */

/* ---------- 1. UTILIDADES ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const SEED_USERS = [
  { nombre: 'María Vargas', correo: 'mvargas@sena.edu.co', rol: 'Instructor', estado: 'Activo', clave: 'Bolt2026' },
  { nombre: 'Michael Valderrama', correo: 'mvalderrama@sena.edu.co', rol: 'TIC', estado: 'Activo', clave: 'Bolt2026' },
  { nombre: 'Mateo López Ávila', correo: 'mlopez@sena.edu.co', rol: 'Administrador', estado: 'Activo', clave: 'Bolt2026' }
];
const getUsers = () => load('bolt_usuarios', SEED_USERS).map(u => ({ ...u, clave: u.clave || 'Bolt2026' }));

/* ---------- 2. VALIDACIÓN (usa los atributos HTML5 de cada campo) ---------- */
function mostrarError(el, msg) {
  const e = $('#error-' + el.id); if (e) e.textContent = msg;
  el.setAttribute('aria-invalid', !!msg); el.classList.toggle('invalid', !!msg);
  return !msg;
}
function validar(form) {
  let primero = null;
  $$('input, select, textarea', form).forEach(el => {
    const v = el.validity; let m = '';
    if (v.valueMissing || (el.required && !el.value.trim())) m = 'Este campo es obligatorio.';
    else if (v.typeMismatch || v.patternMismatch) m = el.dataset.msg || 'Formato no válido.';
    else if (v.tooShort) m = `Mínimo ${el.minLength} caracteres.`;
    else if (v.rangeUnderflow || v.rangeOverflow) m = `Ingrese un valor entre ${el.min} y ${el.max}.`;
    if (!mostrarError(el, m) && !primero) primero = el;
  });
  if (primero) { primero.focus(); return null; }
  return Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
}

/* ---------- 3. INICIO DE SESIÓN (index.html) ---------- */
const formLogin = $('#form-login');
if (formLogin) {
  formLogin.addEventListener('submit', e => {
    e.preventDefault();
    $('#login-error').textContent = '';
    const d = validar(formLogin); if (!d) return;
    const u = getUsers().find(x => x.correo.toLowerCase() === d.email.toLowerCase());
    if (!u || u.clave !== d.password || u.rol !== d.role || u.estado !== 'Activo') {
      $('#login-error').textContent = 'Credenciales o rol incorrectos, o usuario inactivo.'; return;
    }
    save('bolt_session', { user: u.nombre, email: u.correo, role: u.rol });
    location.href = 'dashboard.html';
  });
}

/* ---------- 4. PANEL PRINCIPAL (dashboard.html) ---------- */
if ($('#display-username')) iniciarPanel();

function iniciarPanel() {
  const session = load('bolt_session', null);
  if (!session) { location.replace('index.html'); return; }
  const role = session.role, main = $('#contenido'), prefKey = 'bolt_pref_' + session.email;
  let sec = 'dash', q = '';

  $('#display-username').textContent = session.user;
  $('#display-role').textContent = role;
  $('#user-avatar').textContent = session.user.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* Datos (se guardan en el navegador) */
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

  /* Avisos y notificaciones */
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3500); };
  const renderBadge = () => { const n = N.filter(x => !x.r).length, b = $('#notif-count'); b.textContent = n; b.hidden = !n; };
  const notify = t => { N.unshift({ t, r: 0 }); persist(); renderBadge(); };

  /* Indicadores */
  const pend = s => s.estado !== 'Resuelta', cuenta = f => S.filter(f).length;
  const KPI = {
    activas: () => cuenta(pend), resueltas: () => cuenta(s => !pend(s)), total: () => S.length,
    novedad: () => A.filter(a => a.estado === 'Con Novedad').length,
    alta: () => cuenta(s => s.prioridad === 'Alta' && pend(s)),
    usuarios: () => U.filter(u => u.estado === 'Activo').length,
    tic: () => cuenta(s => s.servicio === 'TIC'), seguridad: () => cuenta(s => s.servicio === 'Seguridad'),
    satisfaccion: () => { const c = S.filter(s => s.calif); return c.length ? (c.reduce((t, s) => t + +s.calif, 0) / c.length).toFixed(1) + ' / 5 ★' : 'Sin calificaciones'; }
  };

  /* Tablas: se copia la plantilla del HTML y se rellenan sus campos */
  const campos = (f, o) => Object.entries(o).forEach(([k, v]) => { const e = $(`[data-f="${k}"]`, f); if (e) e.textContent = v; });
  const insignia = (el, t) => el.classList.add(['Resuelta', 'Disponible', 'Activo', 'Baja'].includes(t) ? 'bg-success' : ['Alta', 'Con Novedad', 'Cerrado', 'Inactivo'].includes(t) ? 'bg-danger' : 'bg-warning');
  const match = arr => !q || arr.join(' ').toLowerCase().includes(q);
  function llenar(tbody, tpl, items, fila, cols) {
    const t = $(tbody); t.replaceChildren();
    if (!items.length) {
      const f = $('#tpl-vacio').content.cloneNode(true);
      $('td', f).colSpan = cols; $('.msg', f).textContent = 'No hay resultados' + (q ? ` para «${q}»` : '.'); t.append(f); return;
    }
    items.forEach(i => { const f = $(tpl).content.cloneNode(true); fila(f, i); t.append(f); });
  }
  const filaSol = (f, s) => {
    campos(f, s); insignia($('[data-f="estado"]', f), s.estado); insignia($('[data-f="prioridad"]', f), s.prioridad);
    const b = $('button', f), tech = role !== 'Instructor', ok = s.estado === 'Resuelta';
    b.dataset.id = s.id; b.dataset.act = tech ? 'atender' : 'calificar';
    b.textContent = tech ? (ok ? 'Editar' : 'Atender') : (ok ? 'Calificar ★' : 'Seguimiento');
  };
  const filaAmb = (f, a) => {
    campos(f, a); insignia($('[data-f="estado"]', f), a.estado);
    $$('button', f).forEach(b => { b.dataset.n = b.dataset.act === 'apertura' ? a.num.replace('Ambiente ', '') : a.num; if (b.dataset.act === 'apertura') b.hidden = a.estado !== 'Disponible'; });
  };
  const filaUsr = (f, u) => { campos(f, u); insignia($('[data-f="estado"]', f), u.estado); $$('button', f).forEach(b => { b.dataset.c = u.correo; }); };

  function render() {
    $$('#sidebar-menu a').forEach(a => {
      const on = a.dataset.sec === sec; a.parentElement.classList.toggle('active', on);
      a.title = $('.lbl', a).textContent; on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    $$('.vista').forEach(v => { v.hidden = v.id !== 'v-' + sec; });
    $$('[data-kpi]').forEach(k => { $('.kpi-value', k).textContent = KPI[k.dataset.kpi](); });
    llenar('#tb-sol-dash', '#tpl-sol', S.filter(s => match([s.id, s.ambiente, s.servicio, s.estado])), filaSol, 7);
    llenar('#tb-sol', '#tpl-sol', S.filter(s => match([s.id, s.ambiente, s.servicio, s.estado])), filaSol, 7);
    llenar('#tb-amb', '#tpl-amb', A.filter(a => match([a.num, a.ubicacion, a.estado])), filaAmb, 5);
    llenar('#tb-usr', '#tpl-usr', U.filter(u => match([u.nombre, u.correo, u.rol])), filaUsr, 5);
    $('#p-nombre').textContent = session.user; $('#p-correo').textContent = session.email;
    $('#p-rol').textContent = role; $('#p-notif').textContent = load(prefKey, 'Activadas');
    $$('[data-roles]').forEach(el => { if (!el.dataset.roles.split(' ').includes(role)) el.hidden = true; });
    $('#resultados').textContent = q ? `${$$('.vista:not([hidden]) tbody tr', main).length} resultados` : '';
  }

  /* Diálogos con formulario (el HTML está en dashboard.html) */
  function abrir(id, { ref = '', val = {}, ok } = {}) {
    const d = $('#' + id), f = $('form', d);
    if ($('.ref', d)) $('.ref', d).textContent = ref;
    f.reset();
    $$('.error-message', f).forEach(e => { e.textContent = ''; });
    $$('.invalid', f).forEach(e => { e.classList.remove('invalid'); e.removeAttribute('aria-invalid'); });
    $$('select[data-fuente="ambientes"]', f).forEach(s => { s.length = 1; A.forEach(a => s.add(new Option(a.num, a.num.replace('Ambiente ', '')))); });
    Object.entries(val).forEach(([k, v]) => { f.elements[k].value = v ?? ''; });
    f.onsubmit = e => {
      e.preventDefault();
      const v = validar(f); if (!v) return;
      const r = ok(v);
      if (r) { const el = f.elements[r.campo]; mostrarError(el, r.msg); el.focus(); return; }
      d.close();
    };
    d.showModal();
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]'); if (c) return c.closest('dialog').close();
    if (e.target.matches('dialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); }
  });

  function nueva(amb, servicio, prioridad, desc) {
    const id = '#' + (Math.max(0, ...S.map(s => parseInt(s.id.slice(1)))) + 1);
    S.unshift({ id, ambiente: amb, servicio, estado: 'Asignada', prioridad, tiempo: '1m', detalle: desc });
    const a = A.find(x => x.num === 'Ambiente ' + amb); if (a && prioridad === 'Alta') a.estado = 'Con Novedad';
    notify(`Solicitud ${id} registrada para el Ambiente ${amb}.`); toast(`Solicitud ${id} enviada a ${servicio}.`); render();
  }

  /* Acciones de los botones (data-act) */
  const ACT = {
    novedad: () => abrir('dlg-novedad', { ok: v => nueva(v.amb, v.serv, 'Alta', v.desc) }),
    apertura: b => abrir('dlg-apertura', { val: { amb: b.dataset.n }, ok: v => nueva(v.amb, 'Seguridad', 'Media', '') }),
    calificar: b => {
      const s = S.find(x => x.id === b.dataset.id);
      if (s.estado !== 'Resuelta') return toast(`Solicitud ${s.id}: ${s.estado} en ${s.servicio}. Tiempo: ${s.tiempo}.`);
      abrir('dlg-calificar', { ref: s.id, val: { nota: s.calif }, ok: v => { s.calif = v.nota; persist(); toast('¡Gracias por calificar!'); render(); } });
    },
    atender: b => {
      const s = S.find(x => x.id === b.dataset.id);
      abrir('dlg-atender', { ref: s.id, val: { estado: s.estado }, ok: v => { s.estado = v.estado; s.obs = v.obs; persist(); notify(`Solicitud ${s.id} actualizada a ${v.estado}.`); toast('Solicitud actualizada.'); render(); } });
    },
    crearAmb: () => abrir('dlg-crearamb', { ok: v => {
      if (A.some(a => a.num.toLowerCase() === v.num.toLowerCase())) return { campo: 'num', msg: 'Ese ambiente ya existe.' };
      A.push({ num: v.num, ubicacion: v.ubi, capacidad: v.cap + ' Aprendices', estado: 'Disponible' }); persist(); toast('Ambiente agregado.'); render();
    } }),
    estadoAmb: b => { const a = A.find(x => x.num === b.dataset.n); abrir('dlg-estadoamb', { ref: a.num, val: { estado: a.estado }, ok: v => { a.estado = v.estado; persist(); toast('Estado actualizado.'); render(); } }); },
    crearUsr: () => abrir('dlg-crearusr', { ok: v => {
      if (U.some(u => u.correo.toLowerCase() === v.cor.toLowerCase())) return { campo: 'cor', msg: 'Ese correo ya está registrado.' };
      U.push({ nombre: v.nom, correo: v.cor, rol: v.rol, estado: 'Activo', clave: v.cla }); persist(); toast('Usuario creado.'); render();
    } }),
    editUsr: b => { const u = U.find(x => x.correo === b.dataset.c); abrir('dlg-editusr', { ref: u.nombre, val: { rol: u.rol, estado: u.estado }, ok: v => { u.rol = v.rol; u.estado = v.estado; persist(); toast('Usuario actualizado.'); render(); } }); },
    delUsr: b => {
      const u = U.find(x => x.correo === b.dataset.c);
      if (u.correo === session.email) return toast('No puede eliminar su propia cuenta.');
      if (u.rol === 'Administrador' && U.filter(x => x.rol === 'Administrador').length < 2) return toast('Debe quedar al menos un administrador.');
      abrir('dlg-eliminar', { ref: u.nombre, ok: () => { U = U.filter(x => x !== u); persist(); toast('Usuario eliminado.'); render(); } });
    },
    delAmb: b => {
      const a = A.find(x => x.num === b.dataset.n), n = a.num.replace('Ambiente ', '');
      if (S.some(s => pend(s) && (s.ambiente === n || s.ambiente === a.num))) return toast('No se puede eliminar: el ambiente tiene solicitudes pendientes.');
      abrir('dlg-eliminar', { ref: a.num, ok: () => { A = A.filter(x => x !== a); persist(); toast('Ambiente eliminado.'); render(); } });
    },
    clave: () => abrir('dlg-clave', { ok: v => {
      const u = U.find(x => x.correo === session.email);
      if (u.clave !== v.actual) return { campo: 'actual', msg: 'La contraseña actual es incorrecta.' };
      if (v.nueva !== v.repetir) return { campo: 'repetir', msg: 'Las contraseñas no coinciden.' };
      u.clave = v.nueva; persist(); toast('Contraseña actualizada.');
    } }),
    correo: () => abrir('dlg-correo', { val: { pref: load(prefKey, 'Activadas') }, ok: v => { save(prefKey, v.pref); toast(`Notificaciones ${v.pref.toLowerCase()}.`); render(); } }),
    reset: () => abrir('dlg-reset', { ok: () => { ['bolt_solicitudes', 'bolt_ambientes', 'bolt_notifs', 'bolt_usuarios'].forEach(k => localStorage.removeItem(k)); if (!SEED_USERS.some(u => u.correo === session.email)) localStorage.removeItem('bolt_session'); location.reload(); } }),
    exportar: () => {
      const csv = ['ID,Ambiente,Servicio,Estado,Prioridad,Tiempo', ...S.map(s => [s.id, s.ambiente, s.servicio, s.estado, s.prioridad, s.tiempo].join(','))].join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); a.download = 'reporte_bolt.csv'; a.click(); toast('Reporte descargado.');
    }
  };
  main.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) ACT[b.dataset.act](b); });

  /* Menú lateral: navegación y botón desplegar / contraer */
  $('#sidebar-menu').addEventListener('click', e => {
    const a = e.target.closest('[data-sec]'); if (!a) return;
    e.preventDefault(); sec = a.dataset.sec; q = ''; $('#buscar').value = ''; render(); main.focus();
  });
  const layout = $('.layout-container'), btnMenu = $('#btn-menu');
  const setSidebar = contraido => {
    layout.classList.toggle('sidebar-collapsed', contraido);
    btnMenu.setAttribute('aria-expanded', !contraido);
    btnMenu.setAttribute('aria-label', contraido ? 'Desplegar menú lateral' : 'Contraer menú lateral');
    localStorage.setItem('bolt_sidebar_collapsed', contraido ? '1' : '0');
  };
  btnMenu.addEventListener('click', () => setSidebar(!layout.classList.contains('sidebar-collapsed')));
  setSidebar(localStorage.getItem('bolt_sidebar_collapsed') === '1');

  /* Menú desplegable de configuración (encabezado) */
  const ITEMS = { perfil: () => { sec = 'perfil'; q = ''; render(); main.focus(); }, clave: ACT.clave, correo: ACT.correo, reset: ACT.reset };
  const btnU = $('#btn-user'), menuU = $('#menu-ajustes');
  const botones = () => $$('button', menuU).filter(b => !b.closest('[hidden]'));
  const setMenu = (abierto, volver) => {
    menuU.hidden = !abierto; btnU.setAttribute('aria-expanded', abierto);
    if (abierto) botones()[0].focus(); else if (volver) btnU.focus();
  };
  btnU.addEventListener('click', () => setMenu(menuU.hidden));
  menuU.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { setMenu(false); ITEMS[b.dataset.k](); } });
  document.addEventListener('click', e => { if (!e.target.closest('.user-menu')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (menuU.hidden) return;
    if (e.key === 'Escape') return setMenu(false, true);
    const bs = botones(), i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    if (e.key === 'Tab') setMenu(false);
  });

  /* Búsqueda, notificaciones y salida */
  $('#buscar').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  $('.search-bar').addEventListener('submit', e => e.preventDefault());
  $('#btn-notif').addEventListener('click', () => {
    const ul = $('#lista-notif'); ul.replaceChildren();
    (N.length ? N : [{ t: 'Sin notificaciones.', r: 1 }]).forEach(n => {
      const f = $('#tpl-notif').content.cloneNode(true), li = $('li', f);
      li.textContent = n.t; li.classList.toggle('new', !n.r); ul.append(f);
    });
    $('#dlg-notif').showModal(); N.forEach(n => { n.r = 1; }); persist(); renderBadge();
  });
  $('#btn-logout').addEventListener('click', () => { localStorage.removeItem('bolt_session'); location.href = 'index.html'; });

  renderBadge(); render();
}
