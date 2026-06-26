import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import ForgotPasswordModal from '../../../components/ForgotPasswordModal';
import { loginUser } from '../../../services/auth';

import bgImage from '../../../assets/fondo.jpg';

const LoginAdmin = () => {
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
      const data = await loginUser(username, password, 'admin');
      
      localStorage.setItem('role', data.rol);
      localStorage.setItem('nombre', data.nombre);
      localStorage.setItem('id_usuario', data.id_usuario);

      navigate('/admin');
    } catch (err) {
      console.log('ERROR LOGIN ADMIN:', err);
      const msg = err.response?.data?.error;
      setError(msg || 'Error de acceso administrativo.');
    }
  };

  return (
    <AuthLayout portalName="Administración de Laboratorios" bgImage={bgImage}>
      <div className="neo-auth-card">
        <div>
          <h2 className="neo-auth-title">Acceso Admin</h2>
          <p className="neo-auth-subtitle">Sistema de Control LabSync</p>
        </div>

        <form onSubmit={handleSubmit} className="neo-form-group" style={{ gap: '1.25rem' }}>
          <div className="neo-form-group">
            <label className="neo-label" htmlFor="adm-codigo">Usuario Admin</label>
            <input
              id="adm-codigo"
              className="neo-input"
              type="text"
              placeholder="admin_xyz"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="neo-form-group">
            <label className="neo-label" htmlFor="adm-password">Clave de Seguridad</label>
            <PasswordInput id="adm-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
              ¿Problemas de acceso?
            </button>
          </div>

          {error && <div className="neo-error-msg">{error}</div>}

          <button type="submit" className="neo-btn-primary">
            Ingresar al Sistema
          </button>
        </form>

        {/* Links removidos por seguridad */}
      </div>
      {showModal && <ForgotPasswordModal onClose={() => setShowModal(false)} />}
    </AuthLayout>
  );
};

export default LoginAdmin;
