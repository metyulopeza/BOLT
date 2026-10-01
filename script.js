document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. LÓGICA DE INICIO DE SESIÓN (index.html)
  // =========================================================================
  const formLogin = document.getElementById('form-login');
  
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email').value.trim().toLowerCase();
      const passwordInput = document.getElementById('password').value.trim();
      const roleSelected = document.getElementById('role-select').value;

      const errorEmail = document.getElementById('error-email');
      const errorPassword = document.getElementById('error-password');

      if (errorEmail) errorEmail.textContent = '';
      if (errorPassword) errorPassword.textContent = '';

      let esValido = true;

      if (emailInput === '') {
        if (errorEmail) errorEmail.textContent = 'Por favor ingrese su correo o usuario.';
        esValido = false;
      }

      if (passwordInput === '') {
        if (errorPassword) errorPassword.textContent = 'Por favor ingrese su contraseña.';
        esValido = false;
      }

      if (!esValido) return;

      const esDev = (
        emailInput === 'admin' || 
        emailInput === 'dev' || 
        emailInput === 'admin@bolt.com' ||
        emailInput.includes('dev')
      );

      const userSession = {
        user: esDev ? 'Desarrollador (' + emailInput + ')' : emailInput.split('@')[0],
        email: emailInput,
        role: roleSelected,
        isDevMode: esDev
      };

      localStorage.setItem('bolt_session', JSON.stringify(userSession));

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 100);
    });
  }

  // =========================================================================
  // 2. LÓGICA DEL PANEL PRINCIPAL CON INTERACCIONES TOTALES (dashboard.html)
  // =========================================================================
  const displayUsername = document.getElementById('display-username');
  
  if (displayUsername) {
    const sessionData = localStorage.getItem('bolt_session');

    if (!sessionData) {
      alert('Debe iniciar sesión primero para acceder al dashboard.');
      window.location.href = 'index.html';
      return;
    }

    const session = JSON.parse(sessionData);

    displayUsername.textContent = session.user;
    document.getElementById('display-role').textContent = session.role;
    
    const avatarBox = document.getElementById('user-avatar');
    if (avatarBox) {
      avatarBox.textContent = session.isDevMode ? 'DEV' : session.user.substring(0, 2).toUpperCase();
    }

    // BASE DE DATOS SIMULADA EN MEMORIA (LOCALSTORAGE)
    let solicitudesData = JSON.parse(localStorage.getItem('bolt_solicitudes')) || [
      { id: '#108', ambiente: '401', servicio: 'TIC', estado: 'Asignada', prioridad: 'Alta', tiempo: '15m' },
      { id: '#107', ambiente: '305', servicio: 'Seguridad', estado: 'Resuelta', prioridad: 'Media', tiempo: '1h' },
      { id: '#106', ambiente: '401', servicio: 'TIC', estado: 'En Proceso', prioridad: 'Alta', tiempo: '30m' },
      { id: '#105', ambiente: '303', servicio: 'Seguridad', estado: 'Resuelta', prioridad: 'Baja', tiempo: '2h' }
    ];

    let ambientesData = JSON.parse(localStorage.getItem('bolt_ambientes')) || [
      { num: 'Ambiente 401', ubicacion: 'Piso 4 - Torre A', capacidad: '35 Aprendices', estado: 'Con Novedad' },
      { num: 'Ambiente 305', ubicacion: 'Piso 3 - Torre B', capacidad: '30 Aprendices', estado: 'Disponible' },
      { num: 'Ambiente 303', ubicacion: 'Piso 3 - Torre A', capacidad: '40 Aprendices', estado: 'Disponible' },
      { num: 'Ambiente 201', ubicacion: 'Piso 2 - Torre A', capacidad: '25 Aprendices', estado: 'Disponible' }
    ];

    let usuariosData = JSON.parse(localStorage.getItem('bolt_usuarios')) || [
      { nombre: 'María Vargas', correo: 'mvargas@sena.edu.co', rol: 'Instructor', estado: 'Activo' },
      { nombre: 'Michael Valderrama', correo: 'mvalderrama@sena.edu.co', rol: 'TIC', estado: 'Activo' },
      { nombre: 'Mateo López Ávila', correo: 'mlopez@sena.edu.co', rol: 'Administrador', estado: 'Activo' }
    ];

    function guardarDatos() {
      localStorage.setItem('bolt_solicitudes', JSON.stringify(solicitudesData));
      localStorage.setItem('bolt_ambientes', JSON.stringify(ambientesData));
      localStorage.setItem('bolt_usuarios', JSON.stringify(usuariosData));
    }

    // ELEMENTOS DE INTERFAZ
    const sidebarMenu = document.getElementById('sidebar-menu');
    const mainContentArea = document.querySelector('.main-content');
    const searchInput = document.querySelector('.search-bar input');
    const btnNotifications = document.querySelector('.icon-btn');

    // MENÚS SEGÚN EL ROL
    const roleConfig = {
      Instructor: [
        { id: 'dash', label: '🏠 Inicio / Dashboard', active: true },
        { id: 'ambientes', label: '🏫 Catálogo de Ambientes', active: false },
        { id: 'solicitudes', label: '🎫 Mis Solicitudes', active: false },
        { id: 'estadisticas', label: '📊 Mis Estadísticas', active: false },
        { id: 'ajustes', label: '⚙️ Ajustes', active: false }
      ],
      TIC: [
        { id: 'dash', label: '📥 Tickets Asignados', active: true },
        { id: 'novedades', label: '⚠️ Gestión de Novedades', active: false },
        { id: 'servicios', label: '🛠️ Catálogo de Servicios', active: false },
        { id: 'ajustes', label: '⚙️ Ajustes', active: false }
      ],
      Administrador: [
        { id: 'dash', label: '📊 Panel General', active: true },
        { id: 'usuarios', label: '👥 Gestión de Usuarios', active: false },
        { id: 'ambientes_admin', label: '🏫 Gestión de Ambientes', active: false },
        { id: 'reportes', label: '📈 Reportes de Gestión', active: false },
        { id: 'ajustes', label: '⚙️ Ajustes', active: false }
      ]
    };

    // RENDERIZAR BARRA LATERAL
    function renderSidebar() {
      const items = roleConfig[session.role] || roleConfig.Instructor;
      sidebarMenu.innerHTML = items.map(item => `
        <li class="${item.active ? 'active' : ''}">
          <a href="#" data-section="${item.id}">${item.label}</a>
        </li>
      `).join('');

      sidebarMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetSection = link.getAttribute('data-section');
          items.forEach(i => i.active = (i.id === targetSection));
          renderSidebar();
          loadSectionContent(targetSection, session.role);
        });
      });
    }

    // CARGAR CONTENIDO Y VINCULAR INTERACCIONES
    function loadSectionContent(sectionId, role, filterQuery = '') {
      let contentHTML = '';

      if (sectionId === 'dash') {
        if (role === 'Instructor') {
          contentHTML = `
            <section class="hero-actions">
              <button id="btn-open-modal" class="btn btn-urgent">🔴 Reportar Novedad Urgente <span class="tag">&lt; 3 clics</span></button>
              <button id="btn-apertura-asistencia" class="btn btn-primary">🔵 Solicitar Apertura / Asistencia <span class="tag">&lt; 3 clics</span></button>
            </section>
            <section class="metrics-grid">
              <article class="metric-card"><h3>Solicitudes Activas</h3><p class="metric-value">${solicitudesData.filter(s => s.estado !== 'Resuelta').length}</p></article>
              <article class="metric-card"><h3>Solicitudes Resueltas</h3><p class="metric-value">${solicitudesData.filter(s => s.estado === 'Resuelta').length} <small>este mes</small></p></article>
              <article class="metric-card"><h3>🏫 Ambiente Actual</h3><p>Ambiente 401: <span class="status-badge">Novedad Registrada</span></p></article>
            </section>
            ${getSolicitudesTableHTML(filterQuery)}
          `;
        } else if (role === 'TIC') {
          contentHTML = `
            <h2>Atención de Novedades y Solicitudes TIC / Seguridad</h2>
            <section class="metrics-grid">
              <article class="metric-card"><h3>Atención Inmediata (Alta)</h3><p class="metric-value">${solicitudesData.filter(s => s.prioridad === 'Alta').length}</p></article>
              <article class="metric-card"><h3>En Atención</h3><p class="metric-value">${solicitudesData.filter(s => s.estado === 'Asignada' || s.estado === 'En Proceso').length}</p></article>
              <article class="metric-card"><h3>Resueltas Hoy</h3><p class="metric-value">${solicitudesData.filter(s => s.estado === 'Resuelta').length}</p></article>
            </section>
            ${getSolicitudesTableHTML(filterQuery, true)}
          `;
        } else if (role === 'Administrador') {
          contentHTML = `
            <h2>Panel General de Control Institucional</h2>
            <section class="metrics-grid">
              <article class="metric-card"><h3>Total Solicitudes</h3><p class="metric-value">${solicitudesData.length}</p></article>
              <article class="metric-card"><h3>Tiempo Promedio Respuesta</h3><p class="metric-value">18 min</p></article>
              <article class="metric-card"><h3>Novedades Pendientes</h3><p class="metric-value">${solicitudesData.filter(s => s.estado !== 'Resuelta').length}</p></article>
            </section>
            ${getSolicitudesTableHTML(filterQuery, true)}
          `;
        }
      } else if (sectionId === 'ambientes' || sectionId === 'ambientes_admin') {
        contentHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2>🏫 Catálogo y Disponibilidad de Ambientes</h2>
            ${role === 'Administrador' ? '<button id="btn-crear-ambiente" class="btn btn-primary">+ Agregar Ambiente</button>' : ''}
          </div>
          <div class="table-section">
            <table class="data-table">
              <thead><tr><th>Ambiente</th><th>Ubicación</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${getAmbientesRows(filterQuery)}
              </tbody>
            </table>
          </div>
        `;
      } else if (sectionId === 'solicitudes' || sectionId === 'novedades') {
        contentHTML = `
          <h2>🎫 Historial Completo de Solicitudes y Novedades</h2>
          ${getSolicitudesTableHTML(filterQuery, role !== 'Instructor')}
        `;
      } else if (sectionId === 'usuarios') {
        contentHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2>👥 Gestión de Cuentas y Usuarios (RBAC)</h2>
            <button id="btn-crear-usuario" class="btn btn-primary">+ Crear Nuevo Usuario</button>
          </div>
          <div class="table-section">
            <table class="data-table">
              <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${getUsuariosRows(filterQuery)}
              </tbody>
            </table>
          </div>
        `;
      } else if (sectionId === 'reportes' || sectionId === 'estadisticas') {
        contentHTML = `
          <h2>📊 Reportes de Gestión y Rendimiento</h2>
          <div class="table-section" style="margin-top:16px;">
            <p style="margin-bottom:16px;">Resumen estadístico de atención en el Centro de Servicios Financieros:</p>
            <div class="metrics-grid">
              <article class="metric-card"><h3>Mantenimientos TIC</h3><p class="metric-value">42 este mes</p></article>
              <article class="metric-card"><h3>Asistencias Seguridad</h3><p class="metric-value">18 este mes</p></article>
              <article class="metric-card"><h3>Satisfacción</h3><p class="metric-value">4.8 / 5.0 ★</p></article>
            </div>
            <button id="btn-exportar-reporte" class="btn btn-primary" style="margin-top:16px;">📥 Descargar Reporte Consolidado (PDF/Excel)</button>
          </div>
        `;
      } else if (sectionId === 'ajustes' || sectionId === 'servicios') {
        contentHTML = `
          <h2>⚙️ Ajustes y Configuración del Sistema</h2>
          <div class="table-section" style="margin-top:16px; max-width:500px;">
            <form id="form-ajustes">
              <div class="form-group"><label>Usuario Activo</label><input type="text" value="${session.user}" readonly></div>
              <div class="form-group"><label>Rol Asignado</label><input type="text" value="${session.role}" readonly></div>
              <div class="form-group">
                <label>Notificaciones por Correo</label>
                <select id="select-notif"><option value="1">Activadas (Inmediatas)</option><option value="0">Desactivadas</option></select>
              </div>
              <button type="submit" class="btn btn-primary">Guardar Configuración</button>
            </form>
          </div>
        `;
      }

      mainContentArea.innerHTML = contentHTML;
      bindDynamicInteractions(sectionId);
    }

    // GENERADORES DE TABLAS HTML
    function getSolicitudesTableHTML(filter = '', isTechOrAdmin = false) {
      let filtered = solicitudesData;
      if (filter) {
        filtered = solicitudesData.filter(s => 
          s.id.toLowerCase().includes(filter) || 
          s.ambiente.toLowerCase().includes(filter) || 
          s.servicio.toLowerCase().includes(filter) ||
          s.estado.toLowerCase().includes(filter)
        );
      }

      if (filtered.length === 0) {
        return `<div class="table-section"><p style="color:#888;">No se encontraron solicitudes que coincidan con "${filter}".</p></div>`;
      }

      return `
        <section class="table-section">
          <h2>Solicitudes Recientes</h2>
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>Ambiente</th><th>Servicio</th><th>Estado</th><th>Prioridad</th><th>Tiempo</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              ${filtered.map(s => `
                <tr>
                  <td><b>${s.id}</b></td>
                  <td>${s.ambiente}</td>
                  <td>${s.servicio}</td>
                  <td>
                    <span class="badge-status ${s.estado === 'Resuelta' ? 'bg-success' : 'bg-warning'}">
                      ${s.estado}
                    </span>
                  </td>
                  <td>
                    <span class="badge-status ${s.prioridad === 'Alta' ? 'bg-danger' : 'bg-warning'}">
                      ${s.prioridad}
                    </span>
                  </td>
                  <td>${s.tiempo}</td>
                  <td>
                    ${isTechOrAdmin ? 
                      `<button class="btn-sm btn-action btn-atender" data-id="${s.id}">${s.estado === 'Resuelta' ? 'Ver Detalle' : 'Atender Ticket'}</button>` : 
                      `<button class="btn-sm btn-action btn-calificar" data-id="${s.id}">${s.estado === 'Resuelta' ? 'Calificar ★' : 'Seguimiento'}</button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    function getAmbientesRows(filter = '') {
      let filtered = ambientesData;
      if (filter) {
        filtered = ambientesData.filter(a => a.num.toLowerCase().includes(filter) || a.ubicacion.toLowerCase().includes(filter));
      }
      return filtered.map(a => `
        <tr>
          <td><b>${a.num}</b></td>
          <td>${a.ubicacion}</td>
          <td>${a.capacidad}</td>
          <td><span class="badge-status ${a.estado === 'Disponible' ? 'bg-success' : 'bg-danger'}">${a.estado}</span></td>
          <td>
            <button class="btn-sm btn-action btn-ver-ambiente" data-num="${a.num}">Ver Detalle</button>
            ${a.estado === 'Disponible' ? `<button class="btn-sm btn-primary btn-reservar" data-num="${a.num}">Reservar</button>` : ''}
          </td>
        </tr>
      `).join('');
    }

    function getUsuariosRows(filter = '') {
      let filtered = usuariosData;
      if (filter) {
        filtered = usuariosData.filter(u => u.nombre.toLowerCase().includes(filter) || u.correo.toLowerCase().includes(filter) || u.rol.toLowerCase().includes(filter));
      }
      return filtered.map(u => `
        <tr>
          <td><b>${u.nombre}</b></td>
          <td>${u.correo}</td>
          <td>${u.rol}</td>
          <td><span class="badge-status bg-success">${u.estado}</span></td>
          <td><button class="btn-sm btn-action btn-editar-usuario" data-correo="${u.correo}">Editar Rol</button></td>
        </tr>
      `).join('');
    }

    // BINDING DE EVENTOS A ELEMENTOS DINÁMICOS
    function bindDynamicInteractions(sectionId) {
      const btnOpenModal = document.getElementById('btn-open-modal');
      const modalReporte = document.getElementById('modal-reporte');
      if (btnOpenModal && modalReporte) {
        btnOpenModal.onclick = () => modalReporte.classList.remove('hidden');
      }

      const btnApertura = document.getElementById('btn-apertura-asistencia');
      if (btnApertura) {
        btnApertura.onclick = () => {
          const amb = prompt('Indique el número de ambiente que requiere apertura o asistencia de Seguridad:', '401');
          if (amb) {
            solicitudesData.unshift({
              id: '#' + Math.floor(100 + Math.random() * 900),
              ambiente: amb,
              servicio: 'Seguridad',
              estado: 'Asignada',
              prioridad: 'Alta',
              tiempo: '1m'
            });
            guardarDatos();
            alert(`¡Solicitud enviada al personal de Seguridad para el Ambiente ${amb}!`);
            loadSectionContent(sectionId, session.role);
          }
        };
      }

      document.querySelectorAll('.btn-calificar').forEach(btn => {
        btn.onclick = () => {
          const ticketId = btn.getAttribute('data-id');
          const ticket = solicitudesData.find(s => s.id === ticketId);
          if (ticket.estado === 'Resuelta') {
            const calif = prompt(`Califique la atención recibida para la solicitud ${ticketId} (1 a 5 estrellas):`, '5');
            if (calif) alert(`¡Gracias por calificar la atención con ${calif} estrellas!`);
          } else {
            alert(`Solicitud ${ticketId} en progreso: Asignada al área de ${ticket.servicio}. Tiempo transcurrido: ${ticket.tiempo}.`);
          }
        };
      });

      document.querySelectorAll('.btn-atender').forEach(btn => {
        btn.onclick = () => {
          const ticketId = btn.getAttribute('data-id');
          const ticket = solicitudesData.find(s => s.id === ticketId);
          if (ticket.estado !== 'Resuelta') {
            if (confirm(`¿Desea cambiar el estado del ticket ${ticketId} a "Resuelta"?`)) {
              ticket.estado = 'Resuelta';
              guardarDatos();
              alert(`¡El ticket ${ticketId} ha sido marcado como Resuelto!`);
              loadSectionContent(sectionId, session.role);
            }
          } else {
            alert(`Ticket ${ticketId} resuelto con éxito.`);
          }
        };
      });

      document.querySelectorAll('.btn-reservar').forEach(btn => {
        btn.onclick = () => {
          const num = btn.getAttribute('data-num');
          alert(`¡Reserva confirmada para el ${num}! Se envió notificación a Coordinación.`);
        };
      });

      document.querySelectorAll('.btn-ver-ambiente').forEach(btn => {
        btn.onclick = () => {
          const num = btn.getAttribute('data-num');
          const amb = ambientesData.find(a => a.num === num);
          alert(`Detalles de ${amb.num}:\nUbicación: ${amb.ubicacion}\nCapacidad: ${amb.capacidad}\nEstado actual: ${amb.estado}`);
        };
      });

      const btnCrearUsuario = document.getElementById('btn-crear-usuario');
      if (btnCrearUsuario) {
        btnCrearUsuario.onclick = () => {
          const nombre = prompt('Ingrese el nombre del nuevo usuario:');
          const correo = prompt('Ingrese el correo institucional:');
          const rol = prompt('Ingrese el rol (Instructor / TIC / Administrador):', 'Instructor');
          if (nombre && correo) {
            usuariosData.push({ nombre, correo, rol: rol || 'Instructor', estado: 'Activo' });
            guardarDatos();
            alert(`Usuario ${nombre} creado exitosamente.`);
            loadSectionContent(sectionId, session.role);
          }
        };
      }

      const btnCrearAmbiente = document.getElementById('btn-crear-ambiente');
      if (btnCrearAmbiente) {
        btnCrearAmbiente.onclick = () => {
          const num = prompt('Número de ambiente (ej. Ambiente 501):');
          const ubicacion = prompt('Ubicación (ej. Piso 5 - Torre B):');
          if (num && ubicacion) {
            ambientesData.push({ num, ubicacion, capacidad: '30 Aprendices', estado: 'Disponible' });
            guardarDatos();
            alert(`${num} creado e integrado al catálogo.`);
            loadSectionContent(sectionId, session.role);
          }
        };
      }

      const btnExportar = document.getElementById('btn-exportar-reporte');
      if (btnExportar) {
        btnExportar.onclick = () => {
          alert('Generando y descargando el reporte consolidado de gestión en formato PDF...');
        };
      }

      const formAjustes = document.getElementById('form-ajustes');
      if (formAjustes) {
        formAjustes.onsubmit = (e) => {
          e.preventDefault();
          alert('¡Configuración del perfil guardada con éxito!');
        };
      }
    }

    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.trim().toLowerCase();
        const activeItem = (roleConfig[session.role] || []).find(i => i.active);
        const currentSection = activeItem ? activeItem.id : 'dash';
        loadSectionContent(currentSection, session.role, query);
      };
    }

    if (btnNotifications) {
      btnNotifications.onclick = () => {
        alert('🔔 Notificaciones del Centro:\n1. Novedad asignada en Ambiente 401.\n2. Solicitud #107 resuelta por Seguridad.\n3. Mantenimiento programado el viernes.');
      };
    }

    renderSidebar();
    loadSectionContent('dash', session.role);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.onclick = () => {
        localStorage.removeItem('bolt_session');
        window.location.href = 'index.html';
      };
    }
  }

});