import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const isAuth = localStorage.getItem("isAuthenticated");
  const role = localStorage.getItem("role");

  // No está logueado
  if (!isAuth) {
    return <Navigate to="/" />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;