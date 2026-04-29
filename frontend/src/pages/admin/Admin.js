import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import reservaService from "../../services/reservaService";
import userService from "../../services/userService";
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
    id_rol: 2 // Por defecto docente
  });

  useEffect(() => {
    fetchReservas();
    fetchUsuarios();
  }, []);

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
              onClick={toggleInventario}
            >
              Inventario
            </button>

            {mostrarInventario && (
              <div className="submenu">

                <button onClick={() => setVista("sistemas")}>
                  Lab Sistemas
                </button>

                <button onClick={() => setVista("electronica")}>
                  Lab Electrónica
                </button>

                <button onClick={() => setVista("ambiental")}>
                  Lab Ambiental
                </button>

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
            <h1>Bienvenido Admin 👋</h1>
            <p>Panel principal de gestión LabSync UNTELS</p>
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
                  const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                  return r.fecha_reserva === hoyStr;
                }).map(r => (
                  <tr key={r.id_reserva}>
                    <td>Docente</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <div className="option-buttons">
                        <button className="edit-btn">Editar</button>
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
                  return r.fecha_reserva > hoyStr;
                }).map(r => (
                  <tr key={r.id_reserva}>
                    <td>Docente</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>
                      <div className="option-buttons">
                        <button className="edit-btn">Editar</button>
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

        {/* # VISTA HISTORIAL */}
        {vista === "historial" && (
          <div className="table-section">

            <h2>Historial de Reservas</h2>
            {/* ... buscador y fechas omitidos para brevedad ... */}

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
                {reservas.filter(r => r.estado !== 'Programada').map(r => (
                  <tr key={r.id_reserva}>
                    <td>Docente</td>
                    <td>{r.usuario_nombre}</td>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>{r.estado}</td>
                    <td>
                      <button className="view-btn">👁 Ver</button>
                    </td>
                  </tr>
                ))}
                {reservas.filter(r => r.estado !== 'Programada').length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center'}}>No hay historial de reservas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* # VISTA USUARIOS */}
        {vista === "usuarios" && (
          <div className="table-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>Gestión de Usuarios</h2>
              <button 
                className="action-buttons" 
                style={{background: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer'}}
                onClick={() => setMostrarFormUsuario(!mostrarFormUsuario)}
              >
                {mostrarFormUsuario ? "Cerrar" : "+ Nuevo Usuario"}
              </button>
            </div>

            {mostrarFormUsuario && (
              <form onSubmit={handleCreateUsuario} style={{background: '#111827', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'grid', gap: '15px'}}>
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

      </main>
    </div>
  );
}

export default Admin;