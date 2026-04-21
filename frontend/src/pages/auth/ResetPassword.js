import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth';
import '../../styles/ResetPassword.css';

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
            setTimeout(() => navigate('/login'), 2000);
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
        <div className="reset-page">
            <div className="reset-card">
                <h2 className="reset-title">Nueva Contraseña</h2>
                <p className="reset-subtitle">Define tu nueva clave de acceso.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        className="reset-input"
                        type="password"
                        placeholder="Nueva contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        className="reset-input"
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            fontSize: '12px',
                            marginBottom: '15px',
                            textAlign: 'left',
                            border: '1px solid #fca5a5',
                            lineHeight: '1.4'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && <p className="reset-msg">{success}</p>}

                    <button type="submit" className="reset-btn">Guardar Cambios</button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
