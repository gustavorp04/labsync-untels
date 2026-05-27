import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  // C-1: Verificar token real, no el string "isAuthenticated" (manipulable desde DevTools)
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No está logueado (token ausente o vacío)
  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;