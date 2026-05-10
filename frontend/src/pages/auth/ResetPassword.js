import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth';
import AuthLayout from './components/AuthLayout';
import PasswordInput from './components/PasswordInput';
import bgImage from '../../assets/fondo.jpg';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            await authService.resetPassword(token, password);
            setSuccess("Contraseña actualizada con éxito.");
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            const backendError = err.response?.data?.error;
            
            if (Array.isArray(backendError)) {
                setError(backendError.join(" / "));
            } else {
                setError(backendError || "Error al procesar el cambio.");
            }
        }
    };

    return (
        <AuthLayout portalName="Recuperación de Cuenta" bgImage={bgImage}>
            <div className="neo-auth-card">
                <div>
                    <h2 className="neo-auth-title">Nueva Contraseña</h2>
                    <p className="neo-auth-subtitle">Define tu nueva clave de acceso seguro.</p>
                </div>

                <form onSubmit={handleSubmit} className="neo-form-group" style={{ gap: '1.25rem' }}>
                    <div className="neo-form-group">
                        <label className="neo-label">Nueva Contraseña</label>
                        <PasswordInput 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div className="neo-form-group">
                        <label className="neo-label">Confirmar Contraseña</label>
                        <PasswordInput 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    {error && <div className="neo-error-msg">{error}</div>}
                    
                    {success && (
                        <div style={{
                            color: '#10B981', fontSize: '0.85rem', textAlign: 'center',
                            background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem',
                            borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            {success}
                        </div>
                    )}

                    <button type="submit" className="neo-btn-primary">
                        Guardar Cambios
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;
