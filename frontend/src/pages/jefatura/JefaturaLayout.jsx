import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, LineElement, PointElement,
} from 'chart.js';
import laboratorioService from '../../services/laboratorioService';
import { logoutUser } from '../../services/auth';
import ThemeToggle from '../../components/ThemeToggle';
import './Jefatura.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const Icon = {
  BarChart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/jefatura/dashboard', icon: Icon.BarChart },
  { id: 'reportes',  label: 'Reportes',  path: '/jefatura/reportes',  icon: Icon.Download },
];

function JefaturaLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [laboratorios, setLaboratorios] = useState([]);
  const [toast, setToast] = useState(null);

  const nombre = localStorage.getItem('nombre') || 'Jefatura';
  const codigo = localStorage.getItem('codigo_universitario') || '';

  const showToast = useCallback((tipo, texto) => {
    setToast({ tipo, texto });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    laboratorioService.getLaboratorios()
      .then(setLaboratorios)
      .catch(() => showToast('error', 'Error al cargar laboratorios'));
  }, [showToast]);

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path);
  const currentLabel = NAV_ITEMS.find(n => isActive(n.path))?.label ?? 'Panel Jefatura';

  return (
    <div className="jef-layout">
      {toast && (
        <div className={`jef-toast jef-toast--${toast.tipo}`}>
          {toast.tipo === 'ok' ? '✓' : '⚠'}
          <span>{toast.texto}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {sidebarOpen && <div className="jef-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`jef-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="jef-brand">
          <div className="jef-brand-logo">LS</div>
          <div>
            <div className="jef-brand-name">LabSync</div>
            <div className="jef-brand-role">Panel Jefatura</div>
          </div>
        </div>

        <div className="jef-user-card">
          <div className="jef-avatar">{nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div className="jef-user-name">{nombre}</div>
            <div className="jef-user-code">{codigo || 'Jefe de Laboratorio'}</div>
          </div>
        </div>

        <nav className="jef-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`jef-nav-btn ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="jef-theme-section">
          <span className="jef-theme-label">Apariencia</span>
          <ThemeToggle fixed={false} />
        </div>

        <button className="jef-logout" onClick={handleLogout}>
          <Icon.Logout />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      <main className="jef-main">
        <div className="jef-topbar">
          <button className="jef-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Icon.Menu />
          </button>
          <span className="jef-topbar-title">{currentLabel}</span>
        </div>

        <Outlet context={{ laboratorios, showToast }} />
      </main>
    </div>
  );
}

export default JefaturaLayout;
