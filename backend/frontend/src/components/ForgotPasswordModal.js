import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import "../styles/Modal.css";

function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendEmail = async () => {
    setError("");
    try {
      await authService.forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError("El correo institucional no está registrado.");
    }
  };

  const handleVerifyCode = async (currentOtp = otp) => {
    const finalToken = currentOtp.join("");
    if (finalToken.length < 6) {
      setError("Ingresa los 6 dígitos.");
      return;
    }

    setError("");
    try {
      await authService.verifyToken(finalToken);
      setTimeout(() => {
        onClose();
        navigate(`/reset-password?token=${finalToken}`);
      }, 400);
    } catch (err) {
      setError("El código ingresado es incorrecto.");
    }
  };

  const handleChangeOtp = (element, index) => {
    const value = element.value.toUpperCase();
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && element.nextSibling) {
      element.nextSibling.focus();
    }

    if (index === 5 && value !== "") {
      handleVerifyCode(newOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">
          {step === 1 ? "Recuperar cuenta" : "Verificar Identidad"}
        </h3>
        <p className="modal-text">
          {step === 1 
            ? "Ingresa tu correo para recibir un código de acceso." 
            : `Confirma el código enviado a tu correo.`}
        </p>

        {step === 1 ? (
          <div className="field-group">
            <label className="field-label">Correo institucional</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@universidad.edu"
            />
          </div>
        ) : (
          <div className="otp-modal-container">
            {otp.map((data, index) => (
              <input
                className="otp-modal-input"
                type="text"
                maxLength="1"
                key={index}
                value={data}
                onChange={e => handleChangeOtp(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                required
              />
            ))}
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cerrar</button>
          <button className="btn-send" onClick={step === 1 ? handleSendEmail : () => handleVerifyCode()}>
            {step === 1 ? "Enviar" : "Verificar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
