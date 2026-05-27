import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  // C-1 + C-2: el token ya no está en localStorage (viaja en cookie httpOnly).
  // Usamos id_usuario como indicador de sesión activa: se guarda en login y
  // se borra en logout o cuando el interceptor de axios recibe un 401.
  const isLoggedIn = !!localStorage.getItem("id_usuario");
  const role = localStorage.getItem("role");

  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;