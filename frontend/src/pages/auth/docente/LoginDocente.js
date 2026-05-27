import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ForgotPasswordModal from '../../../components/ForgotPasswordModal';
import { loginUser } from '../../../services/auth';

import bgImage from '../../../assets/fondo.jpg';

const LoginDocente = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    try {
      const data = await loginUser(username, password, 'docente');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.rol);
      localStorage.setItem('nombre', data.nombre);
      localStorage.setItem('id_usuario', data.id_usuario);
      localStorage.setItem('departamento', data.departamento || '');

      navigate('/docente');
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Login error:', err);
      const msg = err.response?.data?.error;
      setError(msg || 'Error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <AuthLayout portalName="Portal del Docente" bgImage={bgImage}>
      <div className="neo-auth-card">
        <div>
          <h2 className="neo-auth-title">Acceso Docente</h2>
          <p className="neo-auth-subtitle">Gestión de reservas y laboratorios</p>
        </div>

        <form onSubmit={handleSubmit} className="neo-form-group" style={{ gap: '1.25rem' }}>
          <div className="neo-form-group">
            <label className="neo-label">Correo Institucional / DNI</label>
            <input
              className="neo-input"
              type="text"
              placeholder="Ej. ddocente@untels.edu.pe"
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
            Ingresar al Portal
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
          <Link to="/login/estudiante" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Volver a Portal Estudiante</Link>
        </div>
      </div>
      {showModal && <ForgotPasswordModal onClose={() => setShowModal(false)} />}
    </AuthLayout>
  );
};

export default LoginDocente;
