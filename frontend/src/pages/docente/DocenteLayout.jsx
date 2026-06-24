import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logoutUser } from "../../services/auth";
import ThemeToggle from "../../components/ThemeToggle";
import "./Docente.css";

const Icon = {
  Home:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Plus:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  List:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
};

const NAV_ITEMS = [
  { path: '/docente/inicio',       label: 'Inicio',        Icon: Icon.Home },
  { path: '/docente/reservar',     label: 'Nueva Reserva', Icon: Icon.Plus },
  { path: '/docente/mis-reservas', label: 'Mis Reservas',  Icon: Icon.List },
];

function DocenteLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const toastTimerRef = useRef(null);

  const [toast, setToast] = useState(null);

  const nombre = localStorage.getItem("nombre") || "Docente";
  const depto  = localStorage.getItem("departamento") || "";

  const showToast = useCallback((tipo, texto, dur = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ tipo, texto });
    toastTimerRef.current = setTimeout(() => setToast(null), dur);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="doc-layout">
      {toast && (
        <div className={`doc-toast doc-toast--${toast.tipo}`}>
          {toast.tipo === 'ok' ? <Icon.Check /> : '⚠'}
          <span>{toast.texto}</span>
        </div>
      )}

      <aside className="doc-sidebar">
        <div className="doc-brand">
          <div className="doc-brand-logo">LS</div>
          <div><div className="doc-brand-name">LabSync</div><div className="doc-brand-role">Panel Docente</div></div>
        </div>

        <div className="doc-user-card">
          <div className="doc-avatar">{nombre.charAt(0).toUpperCase()}</div>
          <div>
            <div className="doc-user-name">{nombre}</div>
            <div className="doc-user-dept">{depto || 'Docente'}</div>
          </div>
        </div>

        <nav className="doc-nav">
          {NAV_ITEMS.map(({ path, label, Icon: NavIcon }) => (
            <button
              key={path}
              className={`doc-nav-btn ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <NavIcon /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="doc-theme-section" style={{ padding: '0 20px', marginBottom: '20px' }}>
          <span style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>Apariencia</span>
          <ThemeToggle fixed={false} />
        </div>

        <button className="doc-logout" onClick={handleLogout}><Icon.Logout /><span>Cerrar Sesión</span></button>
      </aside>

      <main className="doc-main">
        <Outlet context={{ showToast }} />
      </main>
    </div>
  );
}

export default DocenteLayout;
