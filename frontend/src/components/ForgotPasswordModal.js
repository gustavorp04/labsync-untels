import { useState } from "react";
import axios from "axios";
import "../styles/Modal.css";

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");

    if (!email || !email.includes("@")) {
      setError("Ingresa un correo válido");
      return;
    }

    try {
      console.log("📨 Enviando request al backend...");

      const res = await axios.post(
        "http://localhost:8000/api/forgot-password/",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("RESPUESTA BACKEND:", res.data);

      setSent(true);

      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err) {
      console.log("ERROR BACKEND:", err.response?.data);

      setError(
        err.response?.data?.error ||
        "Error enviando correo"
      );
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <h3 className="modal-title">Recuperar contraseña</h3>

        <p className="modal-text">
          Ingresa tu correo institucional para recuperar tu contraseña
        </p>

        {!sent ? (
          <>
            <div className="field-group">
              <label className="field-label">Correo institucional</label>

              <input
                className="field-input"
                type="email"
                placeholder="usuario@universidad.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ color: "red", marginTop: "10px" }}>
                {error}
              </p>
            )}

            <div className="modal-btns">
              <button className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>

              <button className="btn-send" onClick={handleSend}>
                Enviar correo
              </button>
            </div>
          </>
        ) : (
          <div className="success-msg">
            ✓ Correo enviado. Revisa tu bandeja de entrada
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;