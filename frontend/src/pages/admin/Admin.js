import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import reservaService from "../../services/reservaService";
import userService from "../../services/userService";
import laboratorioService from "../../services/laboratorioService";
import { logoutUser } from "../../services/auth";
import LabMap from "../../components/LabMap";
import ThemeToggle from "../../components/ThemeToggle";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [mostrarReservas, setMostrarReservas] = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [historialReservas, setHistorialReservas] = useState([]);
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
  const [userPage, setUserPage] = useState(1);

  // Visual Detail Modal States
  const [reservaDetalleModal, setReservaDetalleModal] = useState(null);
  const [detalleMapActivos, setDetalleMapActivos] = useState([]);
  const [loadingDetalleMap, setLoadingDetalleMap] = useState(false);

  // Hourly Seat Occupancy Viewer States
  const [visLab, setVisLab] = useState(null);
  const [visFecha, setVisFecha] = useState(new Date().toLocaleDateString('en-CA'));
  const [visHorarios, setVisHorarios] = useState([]);
  const [visHorarioSel, setVisHorarioSel] = useState(null);
  const [visActivos, setVisActivos] = useState([]);
  const [loadingVisHorarios, setLoadingVisHorarios] = useState(false);
  const [loadingVisGrid, setLoadingVisGrid] = useState(false);
  
  // Icons for Sidebar
  const Icon = {
    Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="4"/></svg>,
    Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    // Iconos de activos
    CPU: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="1" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="20" y1="15" x2="23" y2="15"/></svg>,
    Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    Mesa: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="4" rx="1"/><line x1="5" y1="11" x2="5" y2="20"/><line x1="19" y1="11" x2="19" y2="20"/><line x1="12" y1="11" x2="12" y2="20"/></svg>,
    Silla: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3v10M18 3v10M4 13h16a1 1 0 0 1 1 1v1H3v-1a1 1 0 0 1 1-1z"/><line x1="8" y1="15" x2="8" y2="21"/><line x1="16" y1="15" x2="16" y2="21"/></svg>,
    Proyector: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="8" width="20" height="8" rx="2"/><circle cx="16" cy="12" r="2"/><path d="M6 12h4"/><path d="M8 6l-2 2"/><path d="M16 6l2 2"/></svg>,
    ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
    Default: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>,
  };

  // Helper: ícono según tipo de activo
  const getActivoIcon = (tipo) => {
    if (!tipo) return <Icon.Default />;
    const t = tipo.toLowerCase();
    if (t.includes('cpu') || t.includes('pc') || t.includes('computad')) return <Icon.CPU />;
    if (t.includes('monitor')) return <Icon.Monitor />;
    if (t.includes('mesa')) return <Icon.Mesa />;
    if (t.includes('silla') || t.includes('asiento')) return <Icon.Silla />;
    if (t.includes('proyector') || t.includes('proyecc')) return <Icon.Proyector />;
    return <Icon.Default />;
  };

  // --- INVENTARIO STATE ---
  const [laboratorios, setLaboratorios] = useState([]);
  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [activos, setActivos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [activoModal, setActivoModal] = useState(null); // PC clickeada
  const [cambioEstado, setCambioEstado] = useState({ estado: '', motivo: '' });
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [historialSearch, setHistorialSearch] = useState('');
  const [historialFiltro, setHistorialFiltro] = useState('todos');

  useEffect(() => {
    fetchReservas();
    fetchUsuarios();
    fetchLaboratorios();
    fetchHistorialReservas();
    
    const intervalId = setInterval(() => {
      fetchReservas();
      fetchHistorialReservas();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Cargar activos para el visualizador del mapa al abrir el detalle de reserva
  useEffect(() => {
    if (reservaDetalleModal) {
      const fetchDetalleActivos = async () => {
        setLoadingDetalleMap(true);
        try {
          const data = await laboratorioService.getActivosPorLab(
            reservaDetalleModal.id_laboratorio,
            reservaDetalleModal.id_horario
          );
          setDetalleMapActivos(data);
        } catch (err) {
          console.error("Error al cargar activos del detalle de la reserva", err);
        } finally {
          setLoadingDetalleMap(false);
        }
      };
      fetchDetalleActivos();
    } else {
      setDetalleMapActivos([]);
    }
  }, [reservaDetalleModal]);

  // Cargar horarios del visualizador de ocupación
  useEffect(() => {
    if (vista === 'visualizador' && visLab && visFecha) {
      const loadVisHorarios = async () => {
        setLoadingVisHorarios(true);
        setVisHorarios([]);
        setVisHorarioSel(null);
        setVisActivos([]);
        try {
          const data = await reservaService.getTodosLosHorariosPorLabYFecha(visLab.id_laboratorio, visFecha);
          setVisHorarios(data);
        } catch (err) {
          console.error("Error al cargar horarios del visualizador", err);
        } finally {
          setLoadingVisHorarios(false);
        }
      };
      loadVisHorarios();
    }
  }, [vista, visLab, visFecha]);

  // Cargar grilla física del visualizador de ocupación
  useEffect(() => {
    if (vista === 'visualizador' && visHorarioSel && visLab) {
      const loadVisGrid = async () => {
        setLoadingVisGrid(true);
        setVisActivos([]);
        try {
          const data = await laboratorioService.getActivosPorLab(visLab.id_laboratorio, visHorarioSel.id_horario);
          setVisActivos(data);
        } catch (err) {
          console.error("Error al cargar grilla del visualizador", err);
        } finally {
          setLoadingVisGrid(false);
        }
      };
      loadVisGrid();
    } else {
      setVisActivos([]);
    }
  }, [vista, visHorarioSel, visLab]);

  // Temporizador para mensajes (3 segundos)
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Resetear paginación de usuarios al filtrar o buscar
  useEffect(() => {
    setUserPage(1);
  }, [userSearchTerm, filterRol]);

  const fetchReservas = async () => {
    try {
      const data = await reservaService.getTodasLasReservas();
      setReservas(data);
    } catch (error) {
      console.error("Error al cargar reservas", error);
      // M-3: mostrar error al usuario, no solo en consola
      setFeedbackMsg({ tipo: 'error', texto: 'Error al cargar las reservas. Intente de nuevo.' });
    }
  };

  const fetchHistorialReservas = async () => {
    try {
      const data = await reservaService.getHistorialReservas();
      setHistorialReservas(data);
    } catch (error) {
      console.error("Error al cargar historial de reservas", error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const data = await userService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios", error);
      // M-3: mostrar error al usuario
      setFeedbackMsg({ tipo: 'error', texto: 'Error al cargar los usuarios. Intente de nuevo.' });
    }
  };

  const fetchLaboratorios = async () => {
    try {
      const data = await laboratorioService.getLaboratorios();
      setLaboratorios(data);
    } catch (error) {
      console.error("Error al cargar laboratorios", error);
      // M-3: mostrar error al usuario
      setFeedbackMsg({ tipo: 'error', texto: 'Error al cargar los laboratorios. Intente de nuevo.' });
    }
  };

  const seleccionarLab = async (lab) => {
    setLabSeleccionado(lab);
    setActivos([]);
    setHistorial([]);
    setActivoModal(null);
    setHistorialSearch('');
    setHistorialFiltro('todos');
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
      const adminId = localStorage.getItem('userId') || localStorage.getItem('id_usuario');
      await laboratorioService.actualizarEstadoActivo(
        labSeleccionado.id_laboratorio,
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


  const handleVisActivoSelect = async (activo) => {
    if (activo && activo.id_reserva) {
      const localRes = reservas.find(r => r.id_reserva === activo.id_reserva);
      if (localRes) {
        setReservaDetalleModal(localRes);
      } else {
        try {
          const detailData = await reservaService.getReservaById(activo.id_reserva);
          if (detailData) {
            setReservaDetalleModal(detailData);
          }
        } catch (err) {
          console.error("Error al cargar detalle de reserva por ID desde el visualizador", err);
          alert("No se pudo obtener la información de la reserva.");
        }
      }
    }
  };

  // N-3: cancelar reserva en lugar de eliminar (DELETE da 405; usa la ruta RESTful PATCH)
  const handleCancelarReservaAdmin = async (reserva) => {
    if (!window.confirm(`¿Cancelar la reserva de ${reserva.usuario_nombre}?`)) return;
    try {
      await reservaService.cancelarReserva(reserva.id_reserva, reserva.usuario_id);
      setFeedbackMsg({ tipo: 'ok', texto: 'Reserva cancelada correctamente.' });
      fetchReservas();
    } catch (error) {
      setFeedbackMsg({ tipo: 'error', texto: error.response?.data?.error || 'Error al cancelar la reserva.' });
    }
  };

  const handleAsistencia = async (id, asistio) => {
    try {
      await reservaService.marcarAsistencia(id, asistio);
      setFeedbackMsg({ tipo: 'ok', texto: `Reserva marcada como ${asistio ? 'Asistió' : 'No-Show'}` });
      fetchReservas();
    } catch (error) {
      console.error("Error al registrar asistencia", error);
      setFeedbackMsg({ tipo: 'error', texto: error.response?.data?.error || "Error al registrar asistencia." });
    }
  };

  const handleCreateUsuario = async (e) => {
    e.preventDefault();
    try {
      await userService.crearUsuario(nuevoUsuario);
      setMostrarFormUsuario(false);
      setNuevoUsuario({
        nombre: "",
        email: "",
        codigo_universitario: "",
        id_rol: 2,
        carrera: "",
        departamento: "",
        ciclo: 1
      });
      setFeedbackMsg({ tipo: 'ok', texto: 'Usuario creado exitosamente.' });
      fetchUsuarios();
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const labels = {
          email: 'Email',
          codigo_universitario: 'Código universitario',
          ciclo: 'Ciclo',
          nombre: 'Nombre',
          id_rol: 'Rol',
          non_field_errors: '',
        };
        const msgs = Object.entries(data).map(([field, errs]) => {
          const label = labels[field] ?? field;
          const msg = Array.isArray(errs) ? errs[0] : errs;
          return label ? `${label}: ${msg}` : String(msg);
        });
        setFeedbackMsg({ tipo: 'error', texto: msgs.join(' — ') });
      } else {
        setFeedbackMsg({ tipo: 'error', texto: "Error al crear usuario. Verifica los datos." });
      }
    }
  };

  const toggleReservas = () => {
    setMostrarReservas(!mostrarReservas);
  };

  const handleDeleteUsuario = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await userService.eliminarUsuario(id);
        setFeedbackMsg({ tipo: 'ok', texto: 'Usuario eliminado exitosamente.' });
        fetchUsuarios();
      } catch (error) {
        setFeedbackMsg({ tipo: 'error', texto: "Error al eliminar usuario." });
      }
    }
  };

  const handleLogout = async () => {
    // C-2: invalidar sesión en BD y expirar la cookie httpOnly desde el servidor
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
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
                <button 
                  className={!labSeleccionado ? 'active-lab' : ''} 
                  onClick={() => { setVista('inventario'); setLabSeleccionado(null); }}
                >
                  Vista General
                </button>
                {laboratorios.map(lab => (
                  <button
                    key={lab.id_laboratorio}
                    onClick={() => { setVista('inventario'); seleccionarLab(lab); }}
                    className={labSeleccionado?.id_laboratorio === lab.id_laboratorio ? 'active-lab' : ''}
                  >
                    <span className={`dot ${lab.habilitado ? 'on' : 'off'}`} />
                    {lab.codigo_patrimonio || lab.nombre || `Laboratorio ${lab.id_laboratorio}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={`menu-title ${vista === 'usuarios' ? 'active' : ''}`} onClick={() => setVista("usuarios")}>
            <Icon.Users /> <span>Usuarios</span>
          </button>

          <button className={`menu-title ${vista === 'visualizador' ? 'active' : ''}`} onClick={() => setVista("visualizador")}>
            <Icon.Calendar /> <span>Visualizador</span>
          </button>

          <div className="admin-theme-section" style={{ marginTop: 'auto', padding: '20px 0' }}>
            <span style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>Apariencia</span>
            <ThemeToggle fixed={false} />
          </div>

          <button className="menu-title logout-btn" onClick={handleLogout}>
            <Icon.Logout /> <span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      {/* # CONTENIDO PRINCIPAL */}
      <main className="main-content">

        {/* M-3: Feedback global — visible en cualquier vista, posición fija */}
        {feedbackMsg && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            padding: '12px 20px', borderRadius: 8, maxWidth: 380,
            background: feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: feedbackMsg.tipo === 'ok' ? '#10b981' : '#f87171',
            border: `1px solid ${feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {feedbackMsg.texto}
            <button onClick={() => setFeedbackMsg(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}>×</button>
          </div>
        )}

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
                  <th>Estado</th>
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
                    <td style={{ textTransform: 'capitalize' }}>
                      <span className={`badge-rol ${r.usuario_rol?.toLowerCase()}`}>
                        {r.usuario_rol || 'Usuario'}
                      </span>
                    </td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <span className={`status-pill ${r.estado.toLowerCase()}`}>{r.estado}</span>
                    </td>
                    <td>
                      <div className="option-buttons">
                        <button className="view-btn" onClick={() => setReservaDetalleModal(r)} style={{ background: 'var(--accent-color)', color: '#fff' }}>Ver</button>
                        {(r.estado === 'Programada' || r.estado === 'Pendiente') && (
                          <>
                            <button className="asistio-btn" onClick={() => handleAsistencia(r.id_reserva, true)}>Asistió</button>
                            <button className="noshow-btn" onClick={() => handleAsistencia(r.id_reserva, false)}>No-Show</button>
                            {/* N-3: cancelar en lugar de eliminar — DELETE da 405 */}
                            <button className="delete-btn" onClick={() => handleCancelarReservaAdmin(r)}>Cancelar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center'}}>No hay reservas para hoy.</td>
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
                  <th>Estado</th>
                  <th>Opciones</th>
                </tr>
              </thead>

              <tbody>
                {reservas.filter(r => {
                  const hoyStr = new Date().toLocaleDateString('en-CA');
                  const matchesSearch = r.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        r.laboratorio_nombre.toLowerCase().includes(searchTerm.toLowerCase());
                  return r.fecha_reserva >= hoyStr && matchesSearch && (r.estado === 'Programada' || r.estado === 'Pendiente');
                }).map(r => (
                  <tr key={r.id_reserva}>
                    <td>{r.usuario_rol || 'Usuario'}</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <span className={`status-pill ${r.estado.toLowerCase()}`}>{r.estado}</span>
                    </td>
                    <td>
                      <div className="option-buttons">
                        <button className="view-btn" onClick={() => setReservaDetalleModal(r)} style={{ background: 'var(--accent-color)', color: '#fff' }}>Ver</button>
                        {/* N-3: cancelar en lugar de eliminar — DELETE da 405 */}
                        {(r.estado === 'Programada' || r.estado === 'Pendiente') && (
                          <button className="delete-btn" onClick={() => handleCancelarReservaAdmin(r)}>Cancelar</button>
                        )}
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
                background: feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: feedbackMsg.tipo === 'ok' ? '#10b981' : '#f87171',
                border: `1px solid ${feedbackMsg.tipo === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                {feedbackMsg.texto}
                <button onClick={() => setFeedbackMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button>
              </div>
            )}

            {!labSeleccionado ? (
              <div className="lab-inventory-grid">
                <p style={{ width: '100%', opacity: 0.6, marginBottom: 20 }}>Selecciona un laboratorio para gestionar su inventario y mapa:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                  {laboratorios.map(lab => (
                    <div 
                      key={lab.id_laboratorio} 
                      className="lab-card-admin"
                      onClick={() => seleccionarLab(lab)}
                    >
                      <div className="lab-card-header">
                        <span className={`status-dot ${lab.habilitado ? 'on' : 'off'}`} />
                        <strong>{lab.codigo_patrimonio}</strong>
                      </div>
                      <div className="lab-card-body">
                        <h4>{lab.nombre}</h4>
                        <p>{lab.tipo_nombre}</p>
                      </div>
                      <div className="lab-card-footer">
                        <span>Aforo: {lab.aforo_maximo}</span>
                        <button className="btn-manage">Gestionar →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* CABECERA DEL LAB */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <button onClick={() => setLabSeleccionado(null)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: '0.2s' }}>
                    <Icon.ChevronLeft style={{ width: 16, height: 16 }} /> Volver
                  </button>
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
                        columnas={labSeleccionado?.codigo_patrimonio === 'C2-2B' ? 8 : 6}
                        gapAfterColumn={
                          labSeleccionado?.codigo_patrimonio === 'C2-2B' ? 4 : 
                          labSeleccionado?.codigo_patrimonio === 'C2-2A' ? 3 : null
                        }
                        adminMode={true}
                      />
                    ) : (
                      <p style={{ opacity: 0.6 }}>No hay equipos registrados.</p>
                    )}
                  </div>
                )}

                {/* HISTORIAL */}
                {historial.length > 0 && (() => {
                  // Estado local de búsqueda/filtro (inline con useState no funciona aquí,
                  // usamos variables derivadas de los estados ya existentes)
                  // Se usan historialSearch e historialFiltro del estado global del Admin
                  const filtrados = historial.filter(h => {
                    const q = (historialSearch || '').toLowerCase();
                    const matchSearch = !q || 
                      (h.activo_serie || '').toLowerCase().includes(q) ||
                      (h.activo_tipo  || '').toLowerCase().includes(q) ||
                      (h.motivo || '').toLowerCase().includes(q) ||
                      (h.registrado_por_nombre || '').toLowerCase().includes(q);
                    const matchFiltro = !historialFiltro || historialFiltro === 'todos' || h.estado_nuevo === historialFiltro;
                    return matchSearch && matchFiltro;
                  });

                  const rolColor = (rol) => {
                    if (!rol) return { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' };
                    const r = rol.toLowerCase();
                    if (r.includes('admin')) return { bg: 'rgba(37,99,235,0.15)', color: '#3b82f6' };
                    if (r.includes('docente')) return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
                    return { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' };
                  };

                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <h3 style={{ margin: 0 }}>
                          Historial de Mantenimiento
                          <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 400, marginLeft: 8 }}>
                            {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
                          </span>
                        </h3>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* BUSCADOR */}
                          <div className="search-group" style={{ width: 220 }}>
                            <Icon.Search />
                            <input
                              type="text"
                              placeholder="Buscar equipo, motivo..."
                              className="search-input"
                              value={historialSearch}
                              onChange={e => setHistorialSearch(e.target.value)}
                            />
                          </div>
                          {/* FILTRO ESTADO */}
                          <select
                            className="filter-select"
                            value={historialFiltro}
                            onChange={e => setHistorialFiltro(e.target.value)}
                          >
                            <option value="todos">Todos los estados</option>
                            <option value="Operativo">→ Operativo</option>
                            <option value="Mantenimiento">→ Mantenimiento</option>
                            <option value="Dado de baja">→ Dado de baja</option>
                          </select>
                        </div>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Tipo</th><th>Equipo (Serie)</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Fecha</th><th>Registrado por</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtrados.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', opacity: 0.5 }}>Sin resultados para esa búsqueda.</td></tr>
                          ) : filtrados.slice(0, 25).map(h => {
                            const rc = rolColor(h.registrado_por_rol);
                            return (
                              <tr key={h.id_historial}>
                                <td>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: colorActivo(h.estado_nuevo), flexShrink: 0 }}>
                                      {getActivoIcon(h.activo_tipo)}
                                    </span>
                                    <span style={{ fontSize: 12, opacity: 0.7 }}>{h.activo_tipo || '—'}</span>
                                  </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.activo_serie}</td>
                                <td><span style={{ color: colorActivo(h.estado_anterior), fontWeight: 600 }}>{h.estado_anterior}</span></td>
                                <td><span style={{ color: colorActivo(h.estado_nuevo), fontWeight: 600 }}>{h.estado_nuevo}</span></td>
                                <td style={{ maxWidth: 180, wordBreak: 'break-word', fontSize: 13 }}>{h.motivo || '—'}</td>
                                <td style={{ fontSize: 12, opacity: 0.8 }}>{new Date(h.fecha_cambio).toLocaleString('es-PE')}</td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <span style={{ fontSize: 13 }}>{h.registrado_por_nombre || '—'}</span>
                                    {h.registrado_por_rol && (
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: rc.bg, color: rc.color, textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'flex-start' }}>
                                        {h.registrado_por_rol}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filtrados.length > 25 && (
                        <p style={{ fontSize: 12, opacity: 0.5, marginTop: 8, textAlign: 'center' }}>
                          Mostrando 25 de {filtrados.length}. Usa el buscador para filtrar.
                        </p>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* # VISTA HISTORIAL DE RESERVAS */}
        {vista === "historial" && (
          <div className="table-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>Historial de Cambios en Reservas</h2>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Reserva ID</th>
                  <th>Laboratorio</th>
                  <th>Estado Anterior</th>
                  <th>Estado Nuevo</th>
                  <th>Fecha Cambio</th>
                  <th>Realizado por</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {historialReservas.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>No hay registros de cambios aún.</td></tr>
                ) : historialReservas.map(h => (
                  <tr key={h.id_historial}>
                    <td>
                      <button 
                        onClick={() => {
                          const resObj = reservas.find(r => r.id_reserva === h.reserva_id);
                          if (resObj) {
                            setReservaDetalleModal(resObj);
                          } else {
                            setReservaDetalleModal({
                              id_reserva: h.reserva_id,
                              usuario_nombre: h.usuario_nombre || 'Sistema',
                              usuario_rol: h.usuario_rol || 'Automático',
                              laboratorio_nombre: h.laboratorio,
                              estado: h.estado_nuevo,
                              fecha_reserva: new Date(h.fecha_cambio).toLocaleDateString('en-CA'),
                              hora_inicio: '—',
                              hora_fin: '—',
                              cantidad_alumnos: 0,
                              activos: [],
                              id_laboratorio: null,
                              id_horario: null
                            });
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-color)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          padding: 0,
                          textDecoration: 'underline',
                          fontFamily: 'inherit'
                        }}
                      >
                        #{h.reserva_id}
                      </button>
                    </td>
                    <td>{h.laboratorio}</td>
                    <td><span className="status-pill gray">{h.estado_anterior}</span></td>
                    <td><span className={`status-pill ${h.estado_nuevo === 'Completada' ? 'green' : h.estado_nuevo === 'No-show' ? 'red' : 'orange'}`}>{h.estado_nuevo}</span></td>
                    <td style={{ fontSize: 13 }}>{new Date(h.fecha_cambio).toLocaleString('es-PE')}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{h.usuario_nombre || 'Sistema'}</span>
                        <small style={{ opacity: 0.6, fontSize: 10 }}>{h.usuario_rol || 'Automático'}</small>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 200, wordBreak: 'break-word' }}>{h.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      <input type="number" min="1" max="12" value={nuevoUsuario.ciclo} onChange={e => setNuevoUsuario({...nuevoUsuario, ciclo: e.target.value})} required />
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

            {(() => {
              const filteredUsers = usuarios.filter(u => {
                const matchesSearch = u.nombre.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                                      u.codigo_universitario.toLowerCase().includes(userSearchTerm.toLowerCase());
                const matchesRol = filterRol === "todos" || u.rol.toLowerCase() === filterRol;
                return matchesSearch && matchesRol;
              });
              const usersPerPage = 5;
              const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
              const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

              return (
                <>
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
                      {paginatedUsers.map(u => (
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
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{textAlign: 'center', opacity: 0.5}}>No hay usuarios cargados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* CONTROL DE PAGINACIÓN DE USUARIOS */}
                  {filteredUsers.length > 0 && (
                    <div className="pagination" style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                      <button 
                        disabled={userPage === 1} 
                        onClick={() => setUserPage(userPage - 1)}
                        style={{
                          opacity: userPage === 1 ? 0.4 : 1,
                          cursor: userPage === 1 ? 'not-allowed' : 'pointer',
                          padding: '6px 12px',
                          fontSize: 13
                        }}
                      >
                        Anterior
                      </button>
                      <span style={{ fontSize: 13, opacity: 0.8, color: 'var(--text-main)', fontWeight: 600 }}>
                        Página {userPage} de {totalUserPages}
                      </span>
                      <button 
                        disabled={userPage === totalUserPages} 
                        onClick={() => setUserPage(userPage + 1)}
                        style={{
                          opacity: userPage === totalUserPages ? 0.4 : 1,
                          cursor: userPage === totalUserPages ? 'not-allowed' : 'pointer',
                          padding: '6px 12px',
                          fontSize: 13
                        }}
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* # VISTA VISUALIZADOR DE OCUPACIÓN HORA POR HORA */}
        {vista === "visualizador" && (
          <div className="table-section">
            <h2>Visualizador de Ocupación por Horarios</h2>
            <p style={{ opacity: 0.7, marginBottom: 20 }}>
              Consulta interactiva de puestos ocupados y disponibles en tiempo real seleccionando un laboratorio, fecha y horario.
            </p>

            {/* SELECCIÓN DE LAB Y FECHA */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Seleccionar Laboratorio</label>
                <select 
                  className="filter-select" 
                  style={{ width: '100%', padding: '10px 14px' }}
                  value={visLab ? visLab.id_laboratorio : ''} 
                  onChange={e => {
                    const lab = laboratorios.find(l => l.id_laboratorio === parseInt(e.target.value));
                    setVisLab(lab || null);
                  }}
                >
                  <option value="">Seleccione un laboratorio...</option>
                  {laboratorios.map(lab => (
                    <option key={lab.id_laboratorio} value={lab.id_laboratorio}>
                      {lab.nombre} ({lab.codigo_patrimonio})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: 180 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Fecha de Consulta</label>
                <input 
                  type="date" 
                  className="search-input" 
                  style={{ width: '100%', padding: '9px 12px' }}
                  value={visFecha} 
                  onChange={e => setVisFecha(e.target.value)} 
                />
              </div>
            </div>

            {/* LISTA DE HORARIOS / SLOTS */}
            {visLab && (
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 12 }}>Bloques de Horarios</h3>
                {loadingVisHorarios ? (
                  <div style={{ padding: 20, opacity: 0.6 }}>Cargando horarios...</div>
                ) : visHorarios.length > 0 ? (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {visHorarios.map(slot => {
                      const isSel = visHorarioSel?.id_horario === slot.id_horario;
                      const cap = slot.capacidad_total;
                      const ocu = slot.capacidad_ocupada || 0;
                      const libres = cap - ocu;
                      
                      return (
                        <button
                          key={slot.id_horario}
                          onClick={() => setVisHorarioSel(slot)}
                          style={{
                            padding: '12px 18px',
                            borderRadius: 10,
                            border: isSel ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                            background: isSel ? 'rgba(59,130,246,0.1)' : 'var(--bg-main)',
                            color: isSel ? 'var(--accent-color)' : 'inherit',
                            cursor: 'pointer',
                            textAlign: 'left',
                            minWidth: 150,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: 14 }}>{slot.hora_inicio.substring(0, 5)} - {slot.hora_fin.substring(0, 5)}</strong>
                          <span style={{ fontSize: 12, opacity: 0.7, marginTop: 4, display: 'block' }}>
                            {libres === 0 ? '🚫 Lleno' : `🟢 ${libres} libres`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: 13 }}>No hay horarios programados en el laboratorio para la fecha seleccionada.</p>
                )}
              </div>
            )}

            {/* GRILLA FÍSICA CORRESPONDIENTE */}
            {visHorarioSel && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Mapa del Laboratorio ({visHorarioSel.hora_inicio.substring(0,5)} - {visHorarioSel.hora_fin.substring(0,5)})</h3>
                  <div style={{ fontSize: 13, background: 'rgba(59,130,246,0.1)', color: 'var(--accent-color)', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                    Capacidad: {visHorarioSel.capacidad_total - (visHorarioSel.capacidad_ocupada || 0)} / {visHorarioSel.capacidad_total} Libres
                  </div>
                </div>

                {loadingVisGrid ? (
                  <div style={{ textAlign: 'center', padding: 50, opacity: 0.6 }}>Cargando grilla de puestos...</div>
                ) : visActivos.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, background: 'var(--bg-main)' }}>
                    <LabMap 
                      activos={visActivos} 
                      activoSel={null} 
                      onSelect={handleVisActivoSelect} 
                      columnas={6}
                      adminMode={false}
                    />
                  </div>
                ) : (
                  <p style={{ opacity: 0.6 }}>No hay equipos cargados.</p>
                )}
              </div>
            )}
            
            {!visLab && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px dashed var(--border-color)', marginTop: 20 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 64, height: 64, color: 'var(--accent-color)', opacity: 0.6, marginBottom: 16 }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <path d="M6 7h2v2H6V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zm-8 4h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                </svg>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-main)' }}>Visualizador Físico de Laboratorios</h3>
                <p style={{ margin: 0, opacity: 0.7, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', fontSize: 14 }}>
                  Seleccione un laboratorio, una fecha y el horario deseado en el panel superior para visualizar la distribución interactiva de los equipos y su estado de ocupación.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* MODAL DETALLE COMPLETO DE RESERVA CON GRILLA VISUAL */}
        {reservaDetalleModal && (
          <div className="modal-overlay" onClick={() => setReservaDetalleModal(null)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 20px' }}>
            <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                <h2 style={{ margin: 0 }}>Detalle de Reserva #{reservaDetalleModal.id_reserva}</h2>
                <button className="activo-drawer-close" onClick={() => setReservaDetalleModal(null)} style={{ position: 'static' }}>×</button>
              </div>

              <div className="reserva-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
                {/* FICHA INFORMATIVA */}
                <div className="reserva-detail-card" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, color: 'var(--accent-color)' }}>Información General</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                    <div><strong>Usuario:</strong> {reservaDetalleModal.usuario_nombre}</div>
                    <div>
                      <strong>Rol:</strong> <span className={`badge-rol ${reservaDetalleModal.usuario_rol?.toLowerCase()}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        {reservaDetalleModal.usuario_rol}
                      </span>
                    </div>
                    <div><strong>Laboratorio:</strong> {reservaDetalleModal.laboratorio_nombre}</div>
                    <div><strong>Fecha:</strong> {reservaDetalleModal.fecha_reserva}</div>
                    <div><strong>Horario:</strong> {reservaDetalleModal.hora_inicio} - {reservaDetalleModal.hora_fin}</div>
                    <div><strong>Asientos Reservados:</strong> {reservaDetalleModal.cantidad_alumnos}</div>
                    <div>
                      <strong>Estado:</strong> <span className={`status-pill ${reservaDetalleModal.estado.toLowerCase()}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                        {reservaDetalleModal.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EQUIPOS DETALLADOS */}
                <div className="reserva-detail-card" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, color: 'var(--accent-color)' }}>Equipos Reservados</h3>
                  {reservaDetalleModal.activos && reservaDetalleModal.activos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
                      {reservaDetalleModal.activos.map(act => (
                        <div key={act.id_activo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, fontSize: 13 }}>
                          <div>
                            <strong>{act.tipo_activo_nombre}:</strong> {act.codigo_patrimonio || 'Sin Código'}
                          </div>
                          <small style={{ opacity: 0.7 }}>Serie: {act.num_serie}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ opacity: 0.6, fontSize: 13 }}>No hay equipos específicos guardados para esta reserva.</p>
                  )}
                </div>
              </div>

              {/* HISTORIAL DE CAMBIOS Y LÍNEA DE TIEMPO */}
              {reservaDetalleModal.historial_cambios && reservaDetalleModal.historial_cambios.length > 0 && (
                <div className="reserva-detail-card" style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, color: 'var(--accent-color)' }}>Historial de Estados y Transiciones</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    {reservaDetalleModal.historial_cambios.map((log, index) => (
                      <div key={index} style={{ display: 'flex', gap: 12, fontSize: 13, borderLeft: '2px solid var(--accent-color)', paddingLeft: 12, position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: -6,
                          top: 4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: 'var(--accent-color)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>
                              {log.estado_anterior} ➔ <span className={`status-pill ${log.estado_nuevo.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>{log.estado_nuevo}</span>
                            </span>
                            <span style={{ opacity: 0.6, fontSize: 11 }}>{log.fecha_cambio}</span>
                          </div>
                          {log.observacion && (
                            <div style={{ marginTop: 4, opacity: 0.8, fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: 4 }}>
                              💬 {log.observacion}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAPA VISUAL */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>Mapa de Ubicación Física</h3>
                {loadingDetalleMap ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', opacity: 0.6, fontSize: 14 }}>Cargando ubicación en mapa...</div>
                ) : detalleMapActivos.length > 0 ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, background: 'var(--bg-main)' }}>
                    <LabMap
                      activos={detalleMapActivos}
                      activoSel={(reservaDetalleModal.activos || []).map(act => act.id_activo)}
                      onSelect={() => {}}
                      columnas={6}
                      adminMode={false}
                    />
                  </div>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No se pudo cargar la grilla física del aula.</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <button className="cancel-btn" onClick={() => setReservaDetalleModal(null)} style={{ margin: 0, padding: '8px 20px' }}>Cerrar Vista</button>
              </div>
            </div>
          </div>
        )}


        {/* PANEL LATERAL — GESTIÓN DE ACTIVO (PBI-02) */}
        {activoModal && (
          <div className="activo-drawer-overlay" onClick={() => setActivoModal(null)} />
        )}
        <aside className={`activo-drawer${activoModal ? ' activo-drawer--open' : ''}`}>
          {activoModal && (
            <>
              {/* ENCABEZADO */}
              <div className="activo-drawer-header">
                <div className="activo-drawer-icon-wrap" style={{ background: `${colorActivo(activoModal.estado)}22`, color: colorActivo(activoModal.estado) }}>
                  {getActivoIcon(activoModal.tipo_activo_nombre)}
                </div>
                <div className="activo-drawer-title">
                  <h3>{activoModal.tipo_activo_nombre || 'Equipo'}</h3>
                  <span className={`activo-drawer-badge activo-badge--${(activoModal.estado || '').toLowerCase().replace(/ /g, '-')}`}>
                    {activoModal.estado}
                  </span>
                </div>
                <button className="activo-drawer-close" onClick={() => setActivoModal(null)} title="Cerrar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* FICHA DE DATOS */}
              <div className="activo-drawer-body">
                <div className="activo-info-grid">
                  <div className="activo-info-item">
                    <span className="activo-info-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                      Código Patrimonio
                    </span>
                    <strong className="activo-info-val">{activoModal.codigo_patrimonio || '—'}</strong>
                  </div>
                  <div className="activo-info-item">
                    <span className="activo-info-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      N° de Serie
                    </span>
                    <strong className="activo-info-val">{activoModal.num_serie || '—'}</strong>
                  </div>
                  <div className="activo-info-item">
                    <span className="activo-info-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                      Categoría
                    </span>
                    <strong className="activo-info-val">{activoModal.categoria_nombre || '—'}</strong>
                  </div>
                  <div className="activo-info-item">
                    <span className="activo-info-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      Estado actual
                    </span>
                    <span style={{ color: colorActivo(activoModal.estado), fontWeight: 700 }}>
                      {activoModal.estado}
                    </span>
                  </div>
                </div>

                {/* PERIFÉRICOS DEL MISMO PUESTO */}
                {(() => {
                  const puestoNum = activoModal.num_serie?.split('-').slice(-1)[0];
                  if (!puestoNum) return null;
                  const hermanos = activos.filter(a =>
                    a.id_activo !== activoModal.id_activo &&
                    a.num_serie?.endsWith(`-${puestoNum}`)
                  );
                  if (hermanos.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div className="activo-drawer-divider" style={{ marginBottom: 10 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        Periféricos del Puesto #{puestoNum}
                      </div>
                      <div className="activo-perifericos-list">
                        {hermanos.map(h => (
                          <div key={h.id_activo} className="activo-periferico-row">
                            <div className="activo-periferico-icon" style={{ color: colorActivo(h.estado) }}>
                              {getActivoIcon(h.tipo_activo_nombre)}
                            </div>
                            <div className="activo-periferico-info">
                              <span className="activo-periferico-tipo">{h.tipo_activo_nombre}</span>
                              <span className="activo-periferico-serie">{h.num_serie}</span>
                            </div>
                            <span className="activo-periferico-estado" style={{ color: colorActivo(h.estado) }}>
                              <span style={{ width:7, height:7, borderRadius:'50%', background: colorActivo(h.estado), display:'inline-block', marginRight:5 }}/>
                              {h.estado}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div className="activo-drawer-divider">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Cambiar estado del equipo
                </div>

                {/* SELECTOR DE ESTADO */}
                <div className="activo-estado-btns">
                  {['Operativo', 'Mantenimiento', 'Dado de baja'].map(est => (
                    <button
                      key={est}
                      className={`activo-estado-btn${cambioEstado.estado === est ? ' activo-estado-btn--active' : ''}`}
                      style={cambioEstado.estado === est ? { background: colorActivo(est), color: '#fff', borderColor: colorActivo(est) } : {}}
                      onClick={() => setCambioEstado({ ...cambioEstado, estado: est })}
                    >
                      <span className="activo-estado-dot" style={{ background: colorActivo(est) }} />
                      {est}
                    </button>
                  ))}
                </div>

                {/* MOTIVO */}
                <div className="form-group" style={{ marginTop: 20 }}>
                  <label>Motivo del cambio <span style={{ color: '#dc2626' }}>*</span></label>
                  <textarea
                    className="search-input activo-motivo-txt"
                    placeholder="Describe el motivo del cambio de estado..."
                    value={cambioEstado.motivo}
                    onChange={e => setCambioEstado({ ...cambioEstado, motivo: e.target.value })}
                  />
                </div>

                {/* ACCIONES */}
                <div className="activo-drawer-actions">
                  <button className="cancel-btn" onClick={() => setActivoModal(null)}>Cancelar</button>
                  <button
                    className="save-btn"
                    onClick={guardarCambioEstado}
                    style={{ background: colorActivo(cambioEstado.estado) }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>
                    Guardar Cambio
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>

      </main>
    </div>
  );
}

export default Admin;