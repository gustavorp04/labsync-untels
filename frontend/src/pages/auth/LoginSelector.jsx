import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import logo from '../../assets/logo.png';
import './LoginSelector.css';

const IcoEstudiante = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const IcoDocente = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);
const IcoAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcoJefatura = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const PORTALS = [
  {
    label: 'Estudiante',
    desc: 'Reserva laboratorios y gestiona tus equipos asignados',
    accent: '#10b981',
    path: '/login/estudiante',
    Icon: IcoEstudiante,
  },
  {
    label: 'Docente',
    desc: 'Administra tus clases y reserva laboratorios para sesiones académicas',
    accent: '#004A99',
    path: '/login/docente',
    Icon: IcoDocente,
  },
  {
    label: 'Administrador de Lab',
    desc: 'Control de inventario, asistencia y estado de equipos',
    accent: '#f59e0b',
    path: '/login/admin',
    Icon: IcoAdmin,
  },
  {
    label: 'Jefatura',
    desc: 'Reportes, métricas y supervisión general del sistema',
    accent: '#8b5cf6',
    path: '/login/jefatura',
    Icon: IcoJefatura,
  },
];

export default function LoginSelector() {
  const navigate = useNavigate();

  return (
    <div className="ls-layout">
      <ThemeToggle />

      <header className="ls-header">
        <div className="ls-brand">
          <img src={logo} alt="UNTELS" className="ls-logo" />
          <div>
            <div className="ls-brand-name">LabSync</div>
            <div className="ls-brand-sub">UNTELS — Sistema de Reservas</div>
          </div>
        </div>
        <p className="ls-headline">Selecciona tu portal de acceso</p>
      </header>

      <div className="ls-grid">
        {PORTALS.map(p => (
          <button
            key={p.path}
            className="ls-card"
            onClick={() => navigate(p.path)}
            style={{ '--accent': p.accent }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
          >
            <div className="ls-card-icon" style={{ color: p.accent }}>
              <p.Icon />
            </div>
            <div>
              <div className="ls-card-title">{p.label}</div>
              <div className="ls-card-desc">{p.desc}</div>
            </div>
            <div className="ls-card-footer">
              <span className="ls-card-cta" style={{ color: p.accent }}>Ingresar al portal</span>
              <span className="ls-card-arrow">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
