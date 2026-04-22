import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/auth';
import '../../styles/ResetPassword.css';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
                    <div className="password-wrapper">
                        <input
                            className="reset-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button" 
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <div className="password-wrapper">
                        <input
                            className="reset-input"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button" 
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

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
