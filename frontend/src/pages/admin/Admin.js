import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import reservaService from "../../services/reservaService";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [mostrarReservas, setMostrarReservas] = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      const data = await reservaService.getTodasLasReservas();
      setReservas(data);
    } catch (error) {
      console.error("Error al cargar reservas", error);
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
                <button>Actualizar</button>
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
                  // Filtro simple para "hoy" (comparando fechas)
                  const hoyStr = new Date().toISOString().split('T')[0];
                  return r.created_at?.startsWith(hoyStr) || true; // Temporal para ver algo
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
                        <button className="delete-btn">Eliminar</button>
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
                <button>Actualizar</button>
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
                <tr>
                  <td>Docente</td>
                  <td>José Ramírez</td>
                  <td>C3-3</td>
                  <td>30/04/2026</td>
                  <td>09:00 AM - 09:50 AM</td>
                  <td>
                    <div className="option-buttons">
                      <button className="edit-btn">Editar</button>
                      <button className="delete-btn">Eliminar</button>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>Estudiante</td>
                  <td>Lucía Fernández</td>
                  <td>C2-1</td>
                  <td>02/05/2026</td>
                  <td>11:00 AM - 11:50 AM</td>
                  <td>
                    <div className="option-buttons">
                      <button className="edit-btn">Editar</button>
                      <button className="delete-btn">Eliminar</button>
                    </div>
                  </td>
                </tr>
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

            {/* # BUSCADOR + BOTONES */}
            <div className="top-actions">
              <input
                type="text"
                placeholder="Buscar en historial..."
                className="search-input"
              />

              <div className="action-buttons">
                <button>Actualizar</button>
                <button>Exportar PDF</button>
              </div>
            </div>

            {/* # FECHAS */}
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
                <tr>
                  <td>Docente</td>
                  <td>Daniel Rojas</td>
                  <td>C3-3</td>
                  <td>15/04/2026</td>
                  <td>10:00 AM - 10:50 AM</td>
                  <td>Completada</td>
                  <td>
                    <button className="view-btn">👁 Ver</button>
                  </td>
                </tr>

                <tr>
                  <td>Estudiante</td>
                  <td>Fernanda Ruiz</td>
                  <td>C2-1</td>
                  <td>12/04/2026</td>
                  <td>01:00 PM - 01:50 PM</td>
                  <td>Cancelada</td>
                  <td>
                    <button className="view-btn">👁 Ver</button>
                  </td>
                </tr>
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

        {/* # VISTA USUARIOS */}
        {vista === "usuarios" && (
          <div className="table-section">
            <h2>Gestión de Usuarios</h2>
          </div>
        )}

      </main>
    </div>
  );
}

export default Admin;