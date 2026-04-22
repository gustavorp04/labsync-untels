import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelector from "../../components/RoleSelector";
import ForgotPasswordModal from "../../components/ForgotPasswordModal";
import "../../styles/Login.css";
import logo from "../../assets/logo.png";
import { loginUser } from "../../services/auth"; 

const ROLES = ["estudiante", "docente", "admin", "jefatura"];

const ROUTES = {
  estudiante: "/estudiante",
  docente: "/docente",
  admin: "/admin",
  jefatura: "/jefatura",
};

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("estudiante");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  

  const handleSubmit = async () => {
    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setError("");

    try {
      const data = await loginUser(username, password, role);

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("role", data.rol);
      localStorage.setItem("username", data.nombre);

      navigate(ROUTES[data.rol]);

  } catch (err) {
    console.log("ERROR LOGIN:", err);

    const msg = err.response?.data?.error;

    if (msg === "Rol incorrecto") {
      setError("El rol seleccionado no coincide con tu usuario");
    } else if (msg === "Usuario no existe") {
      setError("Usuario no encontrado");
    } else if (msg === "Contraseña incorrecta") {
      setError("Contraseña incorrecta");
    } else {
      setError("Error al iniciar sesión");
    }
  }
  };

  return (
    <div className="login-page">

      <div className="login-left">
        <div className="logo">
          <div className="logo-icon">
            <img src={logo} alt="LabSync logo" />
          </div>
          <span className="logo-text">LabSync</span>
        </div>

        <div>
          <h1 className="hero-title">
            Optimiza la gestión de laboratorios universitarios
          </h1>
          <p className="hero-sub">
            Administra horarios, equipos y reservas de manera eficiente
            en toda la universidad.
          </p>
        </div>

        <div className="feature-boxes">
          <div className="feature-card">
            <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" width="24" />
            <p className="feature-title">Gestión de horarios</p>
            <p className="feature-text">Evita conflictos en reservas</p>
          </div>

          <div className="feature-card">
            <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="20" />
            <p className="feature-title">Control de equipos</p>
            <p className="feature-text">Inventario en tiempo real</p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="form-card">
          <h2 className="form-title">Ingresa a tu cuenta</h2>
          <p className="form-subtitle">Selecciona tu rol para continuar</p>

          <RoleSelector roles={ROLES} selected={role} onChange={setRole} />

          <div className="field-group">
            <label className="field-label">Código de usuario</label>
            <input
              className="field-input"
              type="text"
              placeholder="Ej. 20234567"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Contraseña</label>
            <div className="pw-wrap">
              <input
                className="field-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👀" : "👁"}
              </button>
            </div>
          </div>

          <div className="form-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordarme
            </label>
            <button type="button" className="forgot-btn" onClick={() => setShowModal(true)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-login" onClick={handleSubmit}>
            Ingresar
          </button>

          <div className="secure-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1" fill="#9ca3af" />
              <path d="M4 5V4a2 2 0 014 0v1" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
            </svg>
            Secure login
          </div>
        </div>
      </div>

      {showModal && <ForgotPasswordModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default Login;