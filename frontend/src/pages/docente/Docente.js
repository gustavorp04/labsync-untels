import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import labService from "../../services/labService";
import reservaService from "../../services/reservaService";
import "./Docente.css";

function Docente() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [laboratorios, setLaboratorios] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  
  // Formulario de Reserva
  const [formData, setFormData] = useState({
    id_horario: "",
    cantidad_alumnos: "",
    acepto_declaracion_jurada: false
  });

  const [mensaje, setMensaje] = useState({ text: "", type: "" });

  useEffect(() => {
    if (vista === "nueva-reserva") {
      fetchHorarios();
    }
    if (vista === "mis-reservas") {
      fetchMisReservas();
    }
  }, [vista]);

  const fetchHorarios = async () => {
    try {
      const data = await labService.getHorariosDisponibles();
      setHorarios(data);
    } catch (error) {
      console.error("Error al cargar horarios", error);
    }
  };

  const fetchMisReservas = async () => {
    try {
      // Por ahora traemos todas, en un sistema real filtraríamos por el ID del usuario actual
      const data = await reservaService.getTodasLasReservas();
      setMisReservas(data);
    } catch (error) {
      console.error("Error al cargar mis reservas", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    setMensaje({ text: "Procesando...", type: "info" });

    try {
      const userId = localStorage.getItem("id_usuario") || 1; // Ajuste temporal
      const payload = {
        user_id: userId,
        ...formData
      };

      await reservaService.crearReserva(payload);
      setMensaje({ text: "¡Reserva creada con éxito!", type: "success" });
      setFormData({ id_horario: "", cantidad_alumnos: "", acepto_declaracion_jurada: false });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al crear la reserva";
      setMensaje({ text: errorMsg, type: "error" });
    }
  };

  return (
    <div className="admin-layout">
      {/* # SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <h2>LabSync</h2>
          <p>Panel Docente</p>
        </div>

        <nav className="menu">
          <button className="menu-title" onClick={() => setVista("inicio")}>
            Inicio
          </button>

          <button className="menu-title" onClick={() => setVista("nueva-reserva")}>
            Nueva Reserva
          </button>

          <button className="menu-title" onClick={() => setVista("mis-reservas")}>
            Mis Reservas
          </button>

          <button 
            className="menu-title" 
            onClick={handleLogout}
            style={{marginTop: 'auto', background: '#dc2626'}}
          >
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* # CONTENIDO PRINCIPAL */}
      <main className="main-content">
        
        {/* VISTA INICIO */}
        {vista === "inicio" && (
          <div className="welcome-center">
            <h1>Bienvenido, Docente 👋</h1>
            <p>Desde aquí puede gestionar sus reservas de laboratorio y equipos.</p>
          </div>
        )}

        {/* VISTA NUEVA RESERVA (PBI-03) */}
        {vista === "nueva-reserva" && (
          <div className="form-section">
            <h2>Crear Nueva Reserva</h2>
            <p style={{marginBottom: '20px', color: '#9ca3af', fontSize: '14px'}}>
              Recuerde: Las reservas deben realizarse con al menos 24 horas de anticipación.
            </p>

            {mensaje.text && (
              <div className={`alert ${mensaje.type}`} style={{
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                background: mensaje.type === 'success' ? '#065f46' : '#991b1b',
                color: 'white'
              }}>
                {mensaje.text}
              </div>
            )}

            <form onSubmit={handleSubmitReserva}>
              <div className="form-group">
                <label>Seleccionar Laboratorio y Horario</label>
                <select 
                  className="form-control"
                  value={formData.id_horario}
                  onChange={(e) => setFormData({...formData, id_horario: e.target.value})}
                  required
                >
                  <option value="">Seleccione un horario disponible...</option>
                  {horarios.map(h => (
                    <option key={h.id_horario} value={h.id_horario}>
                      {h.laboratorio_nombre} - {h.fecha} ({h.hora_inicio} - {h.hora_fin})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad de Alumnos</label>
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="Ej: 25"
                  value={formData.cantidad_alumnos}
                  onChange={(e) => setFormData({...formData, cantidad_alumnos: e.target.value})}
                  required
                />
              </div>

              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  checked={formData.acepto_declaracion_jurada}
                  onChange={(e) => setFormData({...formData, acepto_declaracion_jurada: e.target.checked})}
                  required
                />
                <label>Acepto la declaración jurada de responsabilidad de equipos.</label>
              </div>

              <button type="submit" className="btn-primary">
                Confirmar Reserva
              </button>
            </form>
          </div>
        )}

        {/* VISTA MIS RESERVAS */}
        {vista === "mis-reservas" && (
          <div className="table-section">
            <h2>Mis Reservas</h2>
            <table>
              <thead>
                <tr>
                  <th>Laboratorio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Alumnos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misReservas.map(r => (
                  <tr key={r.id_reserva}>
                    <td>{r.laboratorio_nombre}</td>
                    <td>{r.fecha_reserva}</td>
                    <td>{r.hora_inicio} - {r.hora_fin}</td>
                    <td>{r.cantidad_alumnos}</td>
                    <td><span className={`status-badge status-${r.estado.toLowerCase()}`}>{r.estado}</span></td>
                  </tr>
                ))}
                {misReservas.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center'}}>Aún no tienes reservas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}

export default Docente;