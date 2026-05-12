import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import reservaService from "../../services/reservaService";
import userService from "../../services/userService";
import laboratorioService from "../../services/laboratorioService";
import LabMap from "../../components/LabMap";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [mostrarReservas, setMostrarReservas] = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    codigo_universitario: "",
    id_rol: 2,
    carrera: "",
    departamento: "",
    ciclo: 1
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  
  // Icons for Sidebar
  const Icon = {
    Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="4"/></svg>,
    Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  };

  // --- INVENTARIO STATE ---
  const [laboratorios, setLaboratorios] = useState([]);
  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [activos, setActivos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [activoModal, setActivoModal] = useState(null); // PC clickeada
  const [cambioEstado, setCambioEstado] = useState({ estado: '', motivo: '' });
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [activoSel, setActivoSel]   = useState(() => JSON.parse(sessionStorage.getItem("est_activoSel")) || null);
  const [labSearchTerm, setLabSearchTerm] = useState("");
  const [horarios, setHorarios]         = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [feedback, setFeedback]         = useState(null);

  useEffect(() => {
    fetchReservas();
    fetchUsuarios();
    fetchLaboratorios();
  }, []);

  // Temporizador para mensajes (3 segundos)
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  const fetchReservas = async () => {
    try {
      const data = await reservaService.getTodasLasReservas();
      setReservas(data);
    } catch (error) {
      console.error("Error al cargar reservas", error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const data = await userService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios", error);
    }
  };

  const fetchLaboratorios = async () => {
    try {
      const data = await laboratorioService.getLaboratorios();
      setLaboratorios(data);
    } catch (error) {
      console.error("Error al cargar laboratorios", error);
    }
  };

  const seleccionarLab = async (lab) => {
    setLabSeleccionado(lab);
    setActivos([]);
    setHistorial([]);
    setLoadingActivos(true);
    try {
      const [activosData, historialData] = await Promise.all([
        laboratorioService.getActivosPorLab(lab.id_laboratorio),
        laboratorioService.getHistorialLab(lab.id_laboratorio),
      ]);
      setActivos(activosData);
      setHistorial(historialData);
    } catch (err) {
      console.error("Error al cargar activos", err);
    } finally {
      setLoadingActivos(false);
    }
  };

  const abrirModalActivo = (activo) => {
    setActivoModal(activo);
    if (activo) {
      setCambioEstado({ estado: activo.estado, motivo: '' });
    }
  };

  const guardarCambioEstado = async () => {
    if (!cambioEstado.motivo.trim()) {
      setFeedbackMsg({ tipo: 'error', texto: 'El motivo es obligatorio.' });
      return;
    }
    try {
      const adminId = localStorage.getItem('userId');
      await laboratorioService.actualizarEstadoActivo(
        activoModal.id_activo,
        cambioEstado.estado,
        cambioEstado.motivo,
        adminId
      );
      setFeedbackMsg({ tipo: 'ok', texto: `Equipo actualizado a "${cambioEstado.estado}" correctamente.` });
      setActivoModal(null);
      // Recargar activos e historial
      await seleccionarLab(labSeleccionado);
      await fetchLaboratorios();
    } catch (err) {
      setFeedbackMsg({ tipo: 'error', texto: 'Error al actualizar el equipo.' });
    }
  };

  const colorActivo = (estado) => {
    if (estado === 'Operativo') return '#10b981';
    if (estado === 'Mantenimiento') return '#f59e0b';
    return '#dc2626'; // Dado de baja
  };

  const handleEditClick = (reserva) => {
    setReservaEditando({
      ...reserva,
      nueva_fecha: reserva.fecha_reserva,
      nueva_hora: reserva.hora_inicio
    });
    setShowModalEdit(true);
  };

  const handleUpdateReserva = async () => {
    try {
      // Aquí llamaríamos al service para actualizar
      // Por ahora simulamos el éxito y refrescamos
      alert("Reserva actualizada correctamente");
      setShowModalEdit(false);
      fetchReservas();
    } catch (error) {
      alert("Error al actualizar");
    }
  };

  const handleDeleteReserva = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta reserva?")) {
      try {
        // Necesitaremos implementar esto en el service
        await reservaService.eliminarReserva(id);
        fetchReservas();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const handleCreateUsuario = async (e) => {
    e.preventDefault();
    try {
      await userService.crearUsuario(nuevoUsuario);
      setMostrarFormUsuario(false);
      setNuevoUsuario({ nombre: "", email: "", codigo_universitario: "", id_rol: 2 });
      fetchUsuarios();
    } catch (error) {
      alert("Error al crear usuario. Verifica los datos.");
    }
  };

  const toggleReservas = () => {
    setMostrarReservas(!mostrarReservas);
  };

  const handleDeleteUsuario = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await userService.eliminarUsuario(id);
        fetchUsuarios();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-layout">

      {/* # SIDEBAR */}
      <aside className="sidebar">

        {/* # LOGO */}
        <div className="logo">
          <h2>LabSync</h2>
          <p>UNTELS</p>
        </div>

        <nav className="menu">
          <button className={`menu-title ${vista === 'inicio' ? 'active' : ''}`} onClick={() => setVista("inicio")}>
            <Icon.Home /> <span>Inicio</span>
          </button>

          <div className="menu-section">
            <button className={`menu-title ${['hoy', 'programadas', 'historial'].includes(vista) ? 'active' : ''}`} onClick={toggleReservas}>
              <Icon.Calendar /> <span>Reservas</span>
            </button>
            {mostrarReservas && (
              <div className="submenu">
                <button className={vista === 'hoy' ? 'active' : ''} onClick={() => setVista("hoy")}>Hoy</button>
                <button className={vista === 'programadas' ? 'active' : ''} onClick={() => setVista("programadas")}>Programadas</button>
                <button className={vista === 'historial' ? 'active' : ''} onClick={() => setVista("historial")}>Historial</button>
              </div>
            )}
          </div>

          <div className="menu-section">
            <button className={`menu-title ${vista === 'inventario' ? 'active' : ''}`} onClick={() => { setMostrarInventario(!mostrarInventario); setVista('inventario'); }}>
              <Icon.Package /> <span>Inventario</span>
            </button>
            {mostrarInventario && (
              <div className="submenu">
                {laboratorios.map(lab => (
                  <button
                    key={lab.id_laboratorio}
                    onClick={() => { setVista('inventario'); seleccionarLab(lab); }}
                    className={labSeleccionado?.id_laboratorio === lab.id_laboratorio ? 'active-lab' : ''}
                  >
                    <span className={`dot ${lab.habilitado ? 'on' : 'off'}`} />
                    {lab.codigo_patrimonio}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={`menu-title ${vista === 'usuarios' ? 'active' : ''}`} onClick={() => setVista("usuarios")}>
            <Icon.Users /> <span>Usuarios</span>
          </button>

          <button className="menu-title logout-btn" onClick={handleLogout}>
            <Icon.Logout /> <span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {/* # CONTENIDO PRINCIPAL */}
      <main className="main-content">

        {/* # VISTA INICIO */}
        {vista === "inicio" && (
          <div className="welcome-center">
            <h1>Bienvenido Admin</h1>
            <p>Panel principal de gestión LabSync UNTELS</p>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 30 }}>
              {[
                { label: 'Laboratorios Habilitados', val: laboratorios.filter(l => l.habilitado).length, color: '#10b981' },
                { label: 'En Mantenimiento', val: laboratorios.filter(l => !l.habilitado).length, color: '#f59e0b' },
                { label: 'Total Laboratorios', val: laboratorios.length, color: 'var(--untels-blue)' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: 12, padding: '20px 30px', textAlign: 'center', minWidth: 160
                }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: card.color }}>{card.val}</div>
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* # VISTA RESERVAS DE HOY */}
        {vista === "hoy" && (
          <div className="table-section">

            <h2>Reservas de Hoy</h2>

            {/* # BUSCADOR + BOTONES */}
            <div className="top-actions">
              <input
                type="text"
                placeholder="Buscar reserva..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="action-buttons">
                <button onClick={fetchReservas}>Actualizar</button>
                <button>Exportar PDF</button>
              </div>
            </div>

            {/* # TABLA */}
            <table>
              <thead>
                <tr>
                  <th>Tipo Usuario</th>
                  <th>Usuario</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Opciones</th>
                </tr>
              </thead>

              <tbody>
                {reservas.filter(r => {
                  const hoyStr = new Date().toLocaleDateString('en-CA');
                  const matchesSearch = r.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        r.laboratorio_nombre.toLowerCase().includes(searchTerm.toLowerCase());
                  return r.fecha_reserva === hoyStr && matchesSearch;
                }).map(r => (
                  <tr key={r.id_reserva}>
                    <td>Docente</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <div className="option-buttons">
                        <button className="edit-btn" onClick={() => handleEditClick(r)}>Editar</button>
                        <button className="delete-btn" onClick={() => handleDeleteReserva(r.id_reserva)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center'}}>No hay reservas para hoy.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* # PAGINACIÓN */}
            <div className="pagination">
              <button>1</button>
              <button>2</button>
              <button>3</button>
            </div>

          </div>
        )}

        {/* # VISTA PROGRAMADAS */}
        {vista === "programadas" && (
          <div className="table-section">

            <h2>Reservas Programadas</h2>

            {/* # BUSCADOR + BOTONES */}
            <div className="top-actions">
              <input
                type="text"
                placeholder="Buscar reserva programada..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="action-buttons">
                <button onClick={fetchReservas}>Actualizar</button>
                <button>Exportar PDF</button>
              </div>
            </div>

            {/* # FECHA INICIO + FECHA FIN */}
            <div className="date-range">

              <div>
                <label>Fecha Inicio</label>
                <input
                  type="date"
                  className="search-input"
                />
              </div>

              <div>
                <label>Fecha Fin</label>
                <input
                  type="date"
                  className="search-input"
                />
              </div>

            </div>

            {/* # TABLA */}
            <table>
              <thead>
                <tr>
                  <th>Tipo Usuario</th>
                  <th>Usuario</th>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Opciones</th>
                </tr>
              </thead>

              <tbody>
                {reservas.filter(r => {
                  const hoyStr = new Date().toLocaleDateString('en-CA');
                  const matchesSearch = r.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        r.laboratorio_nombre.toLowerCase().includes(searchTerm.toLowerCase());
                  return r.fecha_reserva > hoyStr && matchesSearch;
                }).map(r => (
                  <tr key={r.id_reserva}>
                    <td>{r.usuario_rol || 'Usuario'}</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <div className="option-buttons">
                        <button className="edit-btn" onClick={() => handleEditClick(r)}>Editar</button>
                        <button className="delete-btn" onClick={() => handleDeleteReserva(r.id_reserva)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* # PAGINACIÓN */}
            <div className="pagination">
              <button>1</button>
              <button>2</button>
              <button>3</button>
            </div>

          </div>
        )}

        {/* # VISTA INVENTARIO (MAPA DE EQUIPOS) */}
        {vista === "inventario" && (
          <div className="table-section">
            <h2>Mapa de Inventario</h2>

            {feedbackMsg && (
              <div style={{
                padding: '12px 20px', borderRadius: 8, marginBottom: 20,
                background: feedbackMsg.tipo === 'ok' ? '#d1fae5' : '#fee2e2',
                color: feedbackMsg.tipo === 'ok' ? '#065f46' : '#7f1d1d',
                border: `1px solid ${feedbackMsg.tipo === 'ok' ? '#6ee7b7' : '#fca5a5'}`
              }}>
                {feedbackMsg.texto}
                <button onClick={() => setFeedbackMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            )}

            {!labSeleccionado ? (
              <p style={{ opacity: 0.6 }}>Selecciona un laboratorio del menú izquierdo para ver su mapa de equipos.</p>
            ) : (
              <>
                {/* CABECERA DEL LAB */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{
                    background: labSeleccionado.habilitado ? '#d1fae5' : '#fee2e2',
                    color: labSeleccionado.habilitado ? '#065f46' : '#7f1d1d',
                    border: `1px solid ${labSeleccionado.habilitado ? '#6ee7b7' : '#fca5a5'}`,
                    borderRadius: 20, padding: '6px 16px', fontWeight: 600, fontSize: 13
                  }}>
                    {labSeleccionado.habilitado ? 'HABILITADO' : 'INHABILITADO'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{labSeleccionado.nombre}</strong>
                    <span style={{ opacity: 0.6, fontSize: 13, marginLeft: 10 }}>
                      {labSeleccionado.codigo_patrimonio} · Aforo: {labSeleccionado.aforo_maximo} · Tipo: {labSeleccionado.tipo_nombre}
                    </span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Equipos Operativos: <strong style={{ color: '#10b981' }}>
                      {activos.filter(a => (a.tipo_activo_nombre === 'CPU' || a.tipo_activo_nombre === 'Mesa') && a.estado === 'Operativo').length}
                    </strong>
                    {' / '}{labSeleccionado.aforo_maximo}
                  </div>
                </div>

                {/* LEYENDA ANTIGUA REMOVIDA - LabMap usa su propia leyenda */}

                {loadingActivos ? (
                  <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>Cargando equipos...</div>
                ) : (
                  <div style={{ marginBottom: 32 }}>
                    {activos.length > 0 ? (
                      <LabMap 
                        activos={activos} 
                        activoSel={activoModal} 
                        onSelect={abrirModalActivo} 
                        columnas={6} 
                      />
                    ) : (
                      <p style={{ opacity: 0.6 }}>No hay equipos registrados.</p>
                    )}
                  </div>
                )}

                {/* HISTORIAL */}
                {historial.length > 0 && (
                  <>
                    <h3 style={{ marginBottom: 12 }}>Historial de Mantenimiento</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Equipo</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Fecha</th><th>Registrado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.slice(0, 15).map(h => (
                          <tr key={h.id_historial}>
                            <td>{h.activo_serie}</td>
                            <td><span style={{ color: colorActivo(h.estado_anterior), fontWeight: 600 }}>{h.estado_anterior}</span></td>
                            <td><span style={{ color: colorActivo(h.estado_nuevo), fontWeight: 600 }}>{h.estado_nuevo}</span></td>
                            <td>{h.motivo || '—'}</td>
                            <td>{new Date(h.fecha_cambio).toLocaleString('es-PE')}</td>
                            <td>{h.registrado_por_nombre}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* # VISTA USUARIOS */}
        {vista === "usuarios" && (
          <div className="table-section">
            <div className="top-actions">
              <div className="search-group">
                <Icon.Search />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o código..." 
                  className="search-input"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <select className="filter-select" value={filterRol} onChange={e => setFilterRol(e.target.value)}>
                <option value="todos">Todos los roles</option>
                <option value="docente">Docentes</option>
                <option value="estudiante">Estudiantes</option>
                <option value="admin_lab">Administradores</option>
              </select>
              <button 
                className="btn-new-user" 
                onClick={() => setMostrarFormUsuario(!mostrarFormUsuario)}
              >
                {mostrarFormUsuario ? "Cerrar" : "+ Nuevo Usuario"}
              </button>
            </div>

            {mostrarFormUsuario && (
              <form onSubmit={handleCreateUsuario} className="user-form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" placeholder="Ej: Juan Pérez" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email Institucional</label>
                  <input type="email" placeholder="email@untels.edu.pe" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Código Universitario</label>
                  <input type="text" placeholder="2024100XXX" value={nuevoUsuario.codigo_universitario} onChange={(e) => setNuevoUsuario({...nuevoUsuario, codigo_universitario: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Rol de Usuario</label>
                  <select value={nuevoUsuario.id_rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, id_rol: parseInt(e.target.value)})}>
                    <option value="1">Estudiante</option>
                    <option value="2">Docente</option>
                    <option value="3">Administrador</option>
                  </select>
                </div>

                {/* Campos dinámicos según el ROL */}
                {nuevoUsuario.id_rol === 1 && (
                  <>
                    <div className="form-group">
                      <label>Carrera</label>
                      <select value={nuevoUsuario.carrera} onChange={e => setNuevoUsuario({...nuevoUsuario, carrera: e.target.value})} required>
                        <option value="">Seleccionar carrera...</option>
                        <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                        <option value="Ingeniería Electrónica">Ingeniería Electrónica</option>
                        <option value="Ingeniería Ambiental">Ingeniería Ambiental</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ciclo Actual</label>
                      <input type="number" min="1" max="10" value={nuevoUsuario.ciclo} onChange={e => setNuevoUsuario({...nuevoUsuario, ciclo: e.target.value})} />
                    </div>
                  </>
                )}

                {nuevoUsuario.id_rol === 2 && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Departamento Académico</label>
                    <input type="text" placeholder="Ej: Ingeniería y Gestión" value={nuevoUsuario.departamento} onChange={e => setNuevoUsuario({...nuevoUsuario, departamento: e.target.value})} required />
                  </div>
                )}

                <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
                  <button type="submit" className="btn-save-user">
                    <Icon.Plus /> Crear Usuario Ahora
                  </button>
                </div>
              </form>
            )}

            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Opciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.filter(u => {
                  const matchesSearch = u.nombre.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                        u.codigo_universitario.toLowerCase().includes(userSearchTerm.toLowerCase());
                  const matchesRol = filterRol === "todos" || u.rol.toLowerCase() === filterRol;
                  return matchesSearch && matchesRol;
                }).slice(0, 20).map(u => (
                  <tr key={u.id_usuario}>
                    <td><strong>{u.codigo_universitario}</strong></td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge-rol ${u.rol.toLowerCase()}`}>{u.rol}</span></td>
                    <td>
                      <div className="option-buttons">
                        <button className="delete-btn" onClick={() => handleDeleteUsuario(u.id_usuario)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', opacity: 0.5}}>No hay usuarios cargados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* # VISTA USUARIOS ... */}
        
        {/* MODAL EDITAR RESERVA */}
        {showModalEdit && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Editar Reserva</h2>
              <p>Modificando reserva de <strong>{reservaEditando.usuario_nombre}</strong></p>
              
              <div className="form-group">
                <label>Nueva Fecha</label>
                <input 
                  type="date" 
                  value={reservaEditando.nueva_fecha} 
                  onChange={(e) => setReservaEditando({...reservaEditando, nueva_fecha: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Nuevo Horario</label>
                <input 
                  type="time" 
                  value={reservaEditando.nueva_hora} 
                  onChange={(e) => setReservaEditando({...reservaEditando, nueva_hora: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowModalEdit(false)}>Cancelar</button>
                <button className="save-btn" onClick={handleUpdateReserva}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CAMBIAR ESTADO EQUIPO (PBI-02) */}
        {activoModal && (
          <div className="modal-overlay" onClick={() => setActivoModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
              <h2 style={{ marginBottom: 4 }}>Cambiar Estado de Equipo</h2>
              <p style={{ opacity: 0.6, marginBottom: 20, fontSize: 13 }}>
                Serie: <strong>{activoModal.num_serie}</strong> &mdash; Patrimonio: <strong>{activoModal.codigo_patrimonio}</strong>
              </p>

              <div className="form-group">
                <label>Nuevo Estado</label>
                <select
                  className="search-input"
                  style={{ width: '100%' }}
                  value={cambioEstado.estado}
                  onChange={e => setCambioEstado({ ...cambioEstado, estado: e.target.value })}
                >
                  <option value="Operativo">Operativo</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Dado de baja">Dado de baja</option>
                </select>
              </div>

              <div className="form-group">
                <label>Motivo <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  placeholder="Describe el motivo del cambio de estado..."
                  value={cambioEstado.motivo}
                  onChange={e => setCambioEstado({ ...cambioEstado, motivo: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setActivoModal(null)}>Cancelar</button>
                <button
                  className="save-btn"
                  onClick={guardarCambioEstado}
                  style={{ background: colorActivo(cambioEstado.estado) }}
                >
                  Guardar Cambio
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default Admin;