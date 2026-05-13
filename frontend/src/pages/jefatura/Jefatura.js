import { useNavigate } from "react-router-dom";
import "../../styles/Placeholder.css";
import ThemeToggle from "../../components/ThemeToggle";

function Jefatura() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
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