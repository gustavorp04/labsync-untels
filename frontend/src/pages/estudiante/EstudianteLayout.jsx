import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logoutUser } from "../../services/auth";
import ThemeToggle from "../../components/ThemeToggle";
import "./Estudiante.css";

const Icon = {
  Home:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Book:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  List:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function calcularConteo(fechaFin) {
  const diff = Math.max(0, new Date(fechaFin).getTime() - Date.now());
  return {
    dias:  Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000)  / 60000),
    segs:  Math.floor((diff % 60000)    / 1000),
    expirado: diff <= 0,
  };
}

function PenaltyScreen({ fechaFin, motivo, onLogout, onDismiss }) {
  const [conteo, setConteo] = useState(() => calcularConteo(fechaFin));
  const pad = (n) => String(n).padStart(2, '0');

  useEffect(() => {
    const id = setInterval(() => {
      const nuevo = calcularConteo(fechaFin);
      setConteo(nuevo);
      if (nuevo.expirado) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [fechaFin]);

  if (conteo.expirado) {
    localStorage.removeItem('penalizacion_fin');
    localStorage.removeItem('penalizacion_motivo');
    onDismiss();
    return null;
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'var(--bg-main,#0f172a)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center' }}>
      <div style={{ maxWidth:480,width:'100%',background:'var(--bg-card,#1e293b)',border:'1px solid #ef4444',borderRadius:20,padding:'40px 32px',boxShadow:'0 0 48px #ef444440' }}>
        <div style={{ fontSize:56,marginBottom:12 }}>🚫</div>
        <h2 style={{ color:'#ef4444',margin:'0 0 8px',fontSize:22 }}>Cuenta bloqueada</h2>
        <p style={{ color:'var(--text-muted,#94a3b8)',fontSize:14,margin:'0 0 28px',lineHeight:1.6 }}>
          {motivo || 'No se presentó a una reserva programada.'}<br />
          No puedes realizar nuevas reservas hasta que termine el período de penalización.
        </p>
        <div style={{ display:'flex',gap:12,justifyContent:'center',marginBottom:32 }}>
          {[{val:conteo.dias,label:'Días'},{val:conteo.horas,label:'Horas'},{val:conteo.mins,label:'Minutos'},{val:conteo.segs,label:'Segundos'}].map(({val,label}) => (
            <div key={label} style={{ background:'var(--bg-input,#0f172a)',border:'1px solid #ef4444',borderRadius:12,padding:'12px 16px',minWidth:70 }}>
              <div style={{ fontSize:32,fontWeight:700,color:'#ef4444',fontVariantNumeric:'tabular-nums' }}>{pad(val)}</div>
              <div style={{ fontSize:11,color:'var(--text-muted,#64748b)',marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12,color:'var(--text-muted,#64748b)',marginBottom:24 }}>
          Penalización activa hasta:{' '}
          <strong style={{ color:'var(--text-main,#e2e8f0)' }}>
            {new Date(fechaFin).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
          </strong>
        </p>
        <button onClick={onLogout} style={{ background:'transparent',border:'1px solid #ef4444',color:'#ef4444',borderRadius:10,padding:'10px 28px',cursor:'pointer',fontSize:14,fontWeight:600 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function EstudianteLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [penalizacionFin, setPenalizacionFin] = useState(() => localStorage.getItem('penalizacion_fin') || null);

  const nombre  = localStorage.getItem("nombre")  || localStorage.getItem("username") || "Estudiante";
  const carrera = localStorage.getItem("carrera") || "";
  const ciclo   = localStorage.getItem("ciclo")   || "";

  const showToast = useCallback((tipo, texto, dur = 5000) => {
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

  if (penalizacionFin && new Date(penalizacionFin) > new Date()) {
    return (
      <PenaltyScreen
        fechaFin={penalizacionFin}
        motivo={localStorage.getItem('penalizacion_motivo') || ''}
        onLogout={handleLogout}
        onDismiss={() => setPenalizacionFin(null)}
      />
    );
  }

  return (
    <div className="est-layout">
      {toast && <div className={`est-toast est-toast--${toast.tipo}`}>{toast.texto}</div>}

      <aside className="est-sidebar">
        <div className="est-brand">
          <div className="est-brand-logo">LS</div>
          <div><div className="est-brand-name">LabSync</div><div className="est-brand-role">Estudiante</div></div>
        </div>
        <div className="est-user-card">
          <div className="est-avatar">{nombre[0]}</div>
          <div>
            <div className="est-user-name">{nombre}</div>
            <div className="est-user-meta">{carrera} · {ciclo}° Ciclo</div>
          </div>
        </div>
        <nav className="est-nav">
          <button className={`est-nav-btn ${isActive('/estudiante/inicio') ? 'active' : ''}`} onClick={() => navigate('/estudiante/inicio')}>
            <Icon.Home /><span>Inicio</span>
          </button>
          <button className={`est-nav-btn ${isActive('/estudiante/reservar') ? 'active' : ''}`} onClick={() => navigate('/estudiante/reservar')}>
            <Icon.Book /><span>Reservar</span>
          </button>
          <button className={`est-nav-btn ${isActive('/estudiante/mis-reservas') ? 'active' : ''}`} onClick={() => navigate('/estudiante/mis-reservas')}>
            <Icon.List /><span>Mis Reservas</span>
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ padding: '10px 20px' }}>
            <span style={{ fontSize: 12, opacity: 0.6, display: 'block', marginBottom: 8 }}>Apariencia</span>
            <ThemeToggle fixed={false} />
          </div>
        </nav>
        <button className="est-logout" onClick={handleLogout}><Icon.Logout /><span>Cerrar Sesión</span></button>
      </aside>

      <main className="est-main">
        <Outlet context={{ showToast }} />
      </main>
    </div>
  );
}

export default EstudianteLayout;
