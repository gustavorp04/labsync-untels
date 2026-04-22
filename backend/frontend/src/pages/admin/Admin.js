import { useNavigate } from "react-router-dom";
import "../../styles/Placeholder.css";

function Admin() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="placeholder-page">
      <h1>Hola, Administrador</h1>
      <button onClick={handleLogout}>
        ← Cerrar sesión
      </button>
    </div>
  );
}

export default Admin;