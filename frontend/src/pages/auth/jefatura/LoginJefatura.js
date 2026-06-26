import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ForgotPasswordModal from '../../../components/ForgotPasswordModal';
import { loginUser } from '../../../services/auth';

import bgImage from '../../../assets/fondo.jpg';

const LoginJefatura = () => {
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
      const data = await loginUser(username, password, 'jefatura');
      
      localStorage.setItem('role', data.rol);
      localStorage.setItem('nombre', data.nombre);
      localStorage.setItem('id_usuario', data.id_usuario);

      navigate('/jefatura');
    } catch (err) {
      console.log('ERROR LOGIN JEFATURA:', err);
      const msg = err.response?.data?.error;
      setError(msg || 'Error de acceso. Credenciales inválidas.');
    }
  };

  return (
    <AuthLayout portalName="Portal de Jefatura" bgImage={bgImage}>
      <div className="neo-auth-card">
        <div>
          <h2 className="neo-auth-title">Acceso Jefatura</h2>
          <p className="neo-auth-subtitle">Panel de Control y Reportes</p>
        </div>

        <form onSubmit={handleSubmit} className="neo-form-group" style={{ gap: '1.25rem' }}>
          <div className="neo-form-group">
            <label className="neo-label" htmlFor="jef-codigo">Usuario / Correo</label>
            <input
              id="jef-codigo"
              className="neo-input"
              type="text"
              placeholder="jefatura@untels.edu.pe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="neo-form-group">
            <label className="neo-label" htmlFor="jef-password">Contraseña</label>
            <PasswordInput id="jef-password" value={password} onChange={(e) => setPassword(e.target.value)} />
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

        {/* Links removidos por seguridad */}
      </div>
      {showModal && <ForgotPasswordModal onClose={() => setShowModal(false)} />}
    </AuthLayout>
  );
};

export default LoginJefatura;
