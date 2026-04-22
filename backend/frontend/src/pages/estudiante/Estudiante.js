import { useNavigate } from "react-router-dom";
import "../../styles/Placeholder.css";

function Estudiante() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="placeholder-page">
      <h1>Hola, Estudiante</h1>
      <p>Categoría: {localStorage.getItem("categoria")}</p>
      
      <button onClick={handleLogout}>
        ← Cerrar sesión
      </button>
    </div>
  );
}

export default Estudiante;