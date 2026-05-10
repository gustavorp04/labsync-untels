import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import labService from "../../services/labService";
import reservaService from "../../services/reservaService";
import "./Docente.css";

function Docente() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [horarios, setHorarios] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  
  // Formulario de Reserva
  const [formData, setFormData] = useState({
    id_horario: "",
    cantidad_alumnos: "",
    acepto_declaracion_jurada: false
  });

  const [mensaje] = useState({ text: "", type: "" });
  const [modalInfo, setModalInfo] = useState({ show: false, type: 'success', title: '', text: '' });
  
  // UI de Pasos
  const [paso, setPaso] = useState(1);
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [labSel, setLabSel] = useState(null);

  // Iconos SVG
  const MonitorIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="category-icon">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
  const BoltIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="category-icon">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  );
  const LeafIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="category-icon">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8.5C18 13 13.5 14 11 20z"/><path d="M11 20c-1-3-6-3-7-3"/><path d="M11 20c2-1 1.33-4.33 3-6"/>
    </svg>
  );
  const AtomIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="category-icon">
      <circle cx="12" cy="12" r="3"/><path d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/><path d="M2.5 12h19"/><path d="M12 2.5v19"/>
    </svg>
  );

  const categorias = [
    { nombre: 'Cómputo', icono: MonitorIcon },
    { nombre: 'Electrónica', icono: BoltIcon },
    { nombre: 'Ambiental', icono: LeafIcon },
    { nombre: 'Física', icono: AtomIcon }
  ];

  // Mapeo de departamento -> categorías permitidas (Física es común para todos)
  const deptoMapping = {
    'Ingeniería de Sistemas': ['Cómputo', 'Física'],
    'Ingeniería Ambiental': ['Ambiental', 'Física'],
    'Ingeniería Electrónica': ['Electrónica', 'Física']
  };

  const deptoUsuario = localStorage.getItem("departamento") || "";
  const categoriasPermitidas = categorias.filter(cat => {
    const permitidas = deptoMapping[deptoUsuario];
    if (!permitidas) return true; // Si no hay departamento definido, mostrar todas
    return permitidas.includes(cat.nombre);
  });

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

    if (parseInt(formData.cantidad_alumnos) < 10) {
      setModalInfo({
        show: true,
        type: 'error',
        title: 'Mínimo no alcanzado',
        text: 'El mínimo de estudiantes para una reserva es 10.'
      });
      return;
    }

    try {
      const userId = localStorage.getItem("id_usuario") || 1;
      const payload = {
        user_id: userId,
        ...formData
      };

      await reservaService.crearReserva(payload);
      
      setModalInfo({
        show: true,
        type: 'success',
        title: '¡Reserva Exitosa!',
        text: 'Tu laboratorio ha sido reservado correctamente. Puedes revisarlo en "Mis Reservas".'
      });

      // Limpiar y resetear
      setFormData({ id_horario: "", cantidad_alumnos: "", acepto_declaracion_jurada: false });
      setPaso(1);
      setCategoriaSel(null);
      setLabSel(null);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al crear la reserva";
      setModalInfo({
        show: true,
        type: 'error',
        title: 'Error en la Reserva',
        text: errorMsg
      });
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
          <div className="reservation-flow">
            <div className="step-header">
              {paso > 1 && <button className="back-btn" onClick={() => setPaso(paso - 1)}>← Volver</button>}
              <div>
                <h2>{paso === 1 ? "Seleccione Categoría" : paso === 2 ? `Laboratorios de ${categoriaSel}` : "Detalles de Reserva"}</h2>
                <p style={{color: '#9ca3af', fontSize: '14px'}}>Paso {paso} de 3</p>
              </div>
            </div>

            {mensaje.text && (
              <div className={`alert ${mensaje.type}`} style={{
                padding: '12px', borderRadius: '8px', marginBottom: '20px',
                background: mensaje.type === 'success' ? '#065f46' : '#991b1b', color: 'white'
              }}>
                {mensaje.text}
              </div>
            )}

            {/* PASO 1: CATEGORÍAS */}
            {paso === 1 && (
              <div className="stepper-container">
                {categoriasPermitidas.map(cat => {
                  const classId = cat.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return (
                    <div key={cat.nombre} className={`category-card card-${classId}`} onClick={() => {
                      setCategoriaSel(cat.nombre);
                      setPaso(2);
                    }}>
                      <cat.icono />
                      <h3>{cat.nombre}</h3>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PASO 2: LABORATORIOS */}
            {paso === 2 && (
              <div className="lab-grid">
                {[...new Set(horarios
                  .filter(h => h.tipo_nombre === categoriaSel)
                  .map(h => h.laboratorio_nombre))]
                  .map(labName => {
                    const labInfo = horarios.find(h => h.laboratorio_nombre === labName);
                    return (
                      <div key={labName} className="lab-card" onClick={() => {
                        setLabSel(labName);
                        setPaso(3);
                      }}>
                        <h4>{labName}</h4>
                        <div className="lab-info">
                          <span>Aforo: 10 - {labInfo?.aforo_maximo || 30}</span>
                          <span style={{color: '#10b981'}}>Disponible</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* PASO 3: FORMULARIO FINAL */}
            {paso === 3 && (
              <div className="form-section" style={{margin: '0'}}>
                <h3>{labSel}</h3>
                <p style={{marginBottom: '20px', color: '#9ca3af', fontSize: '14px'}}>
                  Las reservas deben realizarse con al menos 24 horas de anticipación.
                </p>

                <form onSubmit={handleSubmitReserva}>
                  <div className="form-group">
                    <label>Seleccionar Horario Disponible</label>
                    <div className="slots-grid">
                      {horarios
                        .filter(h => h.laboratorio_nombre === labSel)
                        .map(h => (
                        <div 
                          key={h.id_horario} 
                          className={`slot-btn ${formData.id_horario === String(h.id_horario) ? 'active' : ''}`}
                          onClick={() => setFormData({...formData, id_horario: String(h.id_horario)})}
                        >
                          <div className="slot-date">{h.fecha}</div>
                          <div className="slot-time">{h.hora_inicio} - {h.hora_fin}</div>
                        </div>
                      ))}
                      {horarios.filter(h => h.laboratorio_nombre === labSel).length === 0 && (
                        <p style={{color: '#ef4444', fontSize: '14px'}}>No hay horarios disponibles para este laboratorio.</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cantidad de Alumnos (Mínimo 10)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Ej: 25"
                      value={formData.cantidad_alumnos}
                      onChange={(e) => setFormData({...formData, cantidad_alumnos: e.target.value})}
                      required
                      min="10"
                    />
                  </div>

                  <div className="checkbox-group">
                    <input 
                      type="checkbox" 
                      checked={formData.acepto_declaracion_jurada}
                      onChange={(e) => setFormData({...formData, acepto_declaracion_jurada: e.target.checked})}
                      required
                    />
                    <label>Acepto la declaración jurada de responsabilidad.</label>
                  </div>

                  <button type="submit" className="btn-primary">
                    Confirmar Reserva
                  </button>
                </form>
              </div>
            )}
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

        {/* MODAL DE INFORMACIÓN (ÉXITO/ERROR) */}
        {modalInfo.show && (
          <div className="modal-overlay">
            <div className={`modal-content ${modalInfo.type}`}>
              <div className="modal-icon">
                {modalInfo.type === 'success' ? '✅' : '❌'}
              </div>
              <h2>{modalInfo.title}</h2>
              <p>{modalInfo.text}</p>
              <button 
                className="modal-btn-accept" 
                onClick={() => setModalInfo({...modalInfo, show: false})}
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default Docente;