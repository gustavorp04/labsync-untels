import { useNavigate } from "react-router-dom";
import "../../styles/Placeholder.css";
import ThemeToggle from "../../components/ThemeToggle";
import { logoutUser } from "../../services/auth";

function Jefatura() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    // C-2: invalidar sesión en BD y expirar la cookie httpOnly desde el servidor
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div className="placeholder-page">
      <h1>Hola, Jefatura</h1>
      <button onClick={handleLogout}>
        ← Cerrar sesión
      </button>
      <ThemeToggle />
    </div>
  );
}

export default Jefatura;