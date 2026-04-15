import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/ResetPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (!password || !confirm) {
      setMessage("Completa todos los campos");
      return;
    }

    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/reset-password/", {
        token,
        password,
      });

      setMessage("✓ Contraseña actualizada correctamente");

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      setMessage(err.response?.data?.error || "Error al cambiar contraseña");
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">

        <h2 className="reset-title">Restablecer contraseña</h2>

        <p className="reset-subtitle">
          Ingresa tu nueva contraseña para continuar
        </p>

        <input
          className="reset-input"
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="reset-input"
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button className="reset-btn" onClick={handleReset}>
          Guardar nueva contraseña
        </button>

        {message && <p className="reset-msg">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;