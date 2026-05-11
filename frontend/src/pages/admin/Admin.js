import { useState, useEffect, useCallback } from "react";
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
  const [mostrarFormUsuario, setMostrarFormUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    codigo_universitario: "",
    id_rol: 2
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [reservaEditando, setReservaEditando] = useState(null);
  const [showModalEdit, setShowModalEdit] = useState(false);

  // --- INVENTARIO STATE ---
  const [laboratorios, setLaboratorios] = useState([]);
  const [labSeleccionado, setLabSeleccionado] = useState(null);
  const [activos, setActivos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [activoModal, setActivoModal] = useState(null); // PC clickeada
  const [cambioEstado, setCambioEstado] = useState({ estado: '', motivo: '' });
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

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

  const toggleInventario = () => {
    setMostrarInventario(!mostrarInventario);
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

          {/* # INICIO */}
          <button
            className="menu-title"
            onClick={() => setVista("inicio")}
          >
            Inicio
          </button>

          {/* # RESERVAS */}
          <div className="menu-section">
            <button
              className="menu-title"
              onClick={toggleReservas}
            >
              Reservas
            </button>

            {mostrarReservas && (
              <div className="submenu">

                <button onClick={() => setVista("hoy")}>
                  Reservas de Hoy
                </button>

                <button onClick={() => setVista("programadas")}>
                  Programadas
                </button>

                <button onClick={() => setVista("historial")}>
                  Historial
                </button>

              </div>
            )}
          </div>

          {/* # INVENTARIO */}
          <div className="menu-section">
            <button
              className="menu-title"
              onClick={() => { setMostrarInventario(!mostrarInventario); setVista('inventario'); }}
            >
              Inventario
            </button>

            {mostrarInventario && (
              <div className="submenu">
                {laboratorios.map(lab => (
                  <button
                    key={lab.id_laboratorio}
                    onClick={() => { setVista('inventario'); seleccionarLab(lab); }}
                    style={{
                      borderLeft: labSeleccionado?.id_laboratorio === lab.id_laboratorio
                        ? '3px solid var(--untels-blue)' : '3px solid transparent'
                    }}
                  >
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: lab.habilitado ? '#10b981' : '#dc2626', marginRight: 8
                    }} />
                    {lab.codigo_patrimonio} — {lab.nombre.replace('Laboratorio de Cómputo de ', '').replace('Laboratorio de ', '')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* # USUARIOS */}
          <button
            className="menu-title"
            onClick={() => setVista("usuarios")}
          >
            Usuarios
          </button>

          {/* # BOTÓN CERRAR SESIÓN (Extra para funcionalidad) */}
          <button
            className="menu-title logout-btn"
            onClick={handleLogout}
            style={{marginTop: 'auto', background: '#dc2626'}}
          >
            Cerrar Sesión
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Gestión de Usuarios</h2>
              <button 
                className="action-buttons" 
                style={{background: 'var(--untels-blue)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 'var(--border-radius)', cursor: 'pointer'}}
                onClick={() => setMostrarFormUsuario(!mostrarFormUsuario)}
              >
                {mostrarFormUsuario ? "Cerrar" : "+ Nuevo Usuario"}
              </button>
            </div>

            {mostrarFormUsuario && (
              <form onSubmit={handleCreateUsuario} style={{background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'grid', gap: '15px'}}>
                <input 
                  type="text" placeholder="Nombre completo" className="search-input" style={{width: '100%'}}
                  value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} required
                />
                <input 
                  type="email" placeholder="Email institucional" className="search-input" style={{width: '100%'}}
                  value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} required
                />
                <input 
                  type="text" placeholder="Código Universitario" className="search-input" style={{width: '100%'}}
                  value={nuevoUsuario.codigo_universitario} onChange={(e) => setNuevoUsuario({...nuevoUsuario, codigo_universitario: e.target.value})} required
                />
                <select 
                  className="search-input" style={{width: '100%'}}
                  value={nuevoUsuario.id_rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, id_rol: parseInt(e.target.value)})}
                >
                  <option value="2">Docente</option>
                  <option value="1">Estudiante</option>
                  <option value="3">Administrador</option>
                </select>
                <button type="submit" className="btn-primary" style={{background: '#10b981', padding: '12px'}}>Guardar Usuario</button>
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
                {usuarios.map(u => (
                  <tr key={u.id_usuario}>
                    <td>{u.codigo_universitario}</td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol}</td>
                    <td>
                      <button className="delete-btn" style={{padding: '5px 10px'}}>X</button>
                    </td>
                  </tr>
                ))}
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