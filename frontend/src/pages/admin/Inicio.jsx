import { useNavigate, useOutletContext } from "react-router-dom";

const HOY = new Date().toISOString().slice(0, 10);

const QuickLinks = [
  {
    label: 'Reservas de Hoy',
    desc:  'Ver y gestionar reservas activas del día',
    path:  '/admin/reservas/hoy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Inventario',
    desc:  'Laboratorios y activos registrados',
    path:  '/admin/inventario',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    label: 'Usuarios',
    desc:  'Gestión de cuentas y roles',
    path:  '/admin/usuarios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Visualizador',
    desc:  'Calendario de disponibilidad de labs',
    path:  '/admin/visualizador',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
];

function AdminInicio() {
  const navigate = useNavigate();
  const { laboratorios, reservas } = useOutletContext();

  const nombre    = localStorage.getItem("nombre") || "Admin";
  const primerNombre = nombre.split(' ')[0];

  const hoy         = reservas.filter(r => r.fecha_reserva === HOY);
  const programadas = hoy.filter(r => r.estado === 'Programada').length;
  const pendientes  = hoy.filter(r => r.estado === 'Pendiente').length;
  const completadas = hoy.filter(r => r.estado === 'Completada').length;
  const noShows     = hoy.filter(r => r.estado === 'No-show').length;

  const labsHabilitados   = laboratorios.filter(l => l.habilitado).length;
  const labsInhabilitados = laboratorios.filter(l => !l.habilitado).length;

  const stats = [
    { label: 'Programadas hoy',  val: programadas,      color: '#3b82f6' },
    { label: 'Pendientes hoy',   val: pendientes,        color: '#f59e0b' },
    { label: 'Completadas hoy',  val: completadas,       color: '#10b981' },
    { label: 'No-shows hoy',     val: noShows,           color: '#ef4444' },
    { label: 'Labs habilitados', val: labsHabilitados,   color: '#10b981' },
    { label: 'Labs cerrados',    val: labsInhabilitados, color: '#94a3b8' },
  ];

  return (
    <div className="adm-inicio">
      <div className="adm-welcome-text">
        <h1>Bienvenido, {primerNombre}</h1>
        <p>Panel de administración de LabSync UNTELS</p>
      </div>

      <div className="adm-stat-grid">
        {stats.map(s => (
          <div key={s.label} className="adm-stat-card">
            <span className="adm-stat-val" style={{ color: s.color }}>{s.val}</span>
            <span className="adm-stat-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="adm-section-title">Acceso rápido</div>
      <div className="adm-quick-grid">
        {QuickLinks.map(l => (
          <button key={l.path} className="adm-quick-card" onClick={() => navigate(l.path)}>
            <div className="adm-quick-icon">{l.icon}</div>
            <div className="adm-quick-info">
              <div className="adm-quick-label">{l.label}</div>
              <div className="adm-quick-desc">{l.desc}</div>
            </div>
            <svg className="adm-quick-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminInicio;
