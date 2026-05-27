import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ForgotPasswordModal from '../../../components/ForgotPasswordModal';
import { loginUser } from '../../../services/auth';

import bgEstudiante from '../../../assets/fondo.jpg';

const LoginEstudiante = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Evita que el usuario vea el login si ya está logueado (Fix botón atrás)
  // C-2: usamos id_usuario como indicador de sesión activa (ya no hay token en localStorage)
  React.useEffect(() => {
    if (localStorage.getItem('id_usuario') && localStorage.getItem('role') === 'estudiante') {
      navigate('/estudiante', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    try {
      // Using the specific role for the API call (or we can update the API later)
      const data = await loginUser(username, password, 'estudiante');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.rol || 'estudiante');
      localStorage.setItem('nombre', data.nombre || 'Estudiante');
      localStorage.setItem('id_usuario', data.id_usuario || '');
      localStorage.setItem('carrera', data.carrera || '');
      localStorage.setItem('ciclo', data.ciclo || '');

      navigate('/estudiante');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Login error:', err);
      const msg = err.response?.data?.error;
      setError(msg || 'Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <AuthLayout portalName="Portal del Estudiante" bgImage={bgEstudiante}>
      <div className="neo-auth-card">
        <div>
          <h2 className="neo-auth-title">Bienvenido</h2>
          <p className="neo-auth-subtitle">Ingresa para gestionar tus laboratorios</p>
        </div>

        <form onSubmit={handleSubmit} className="neo-form-group" style={{ gap: '1.25rem' }}>
          <div className="neo-form-group">
            <label className="neo-label">Código de Alumno</label>
            <input
              className="neo-input"
              type="text"
              placeholder="Ej. 20234567"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="neo-form-group">
            <label className="neo-label">Contraseña</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && <div className="neo-error-msg">{error}</div>}

          <button type="submit" className="neo-btn-primary">
            Ingresar
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ¿No eres estudiante? <Link to="/login/docente" style={{ color: 'var(--untels-blue)', textDecoration: 'none', fontWeight: 600 }}>Portal Docente</Link>
        </div>
      </div>
      {showModal && <ForgotPasswordModal onClose={() => setShowModal(false)} />}
    </AuthLayout>
  );
};

export default LoginEstudiante;
