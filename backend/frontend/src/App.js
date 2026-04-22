import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";

import Estudiante from "./pages/estudiante/Estudiante";
import Docente from "./pages/docente/Docente";
import Admin from "./pages/admin/Admin";
import Jefatura from "./pages/jefatura/Jefatura";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/estudiante" element={
          <ProtectedRoute allowedRole="estudiante">
            <Estudiante />
          </ProtectedRoute>
        } />

        <Route path="/docente" element={
          <ProtectedRoute allowedRole="docente">
            <Docente />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <Admin />
          </ProtectedRoute>
        } />

        <Route path="/jefatura" element={
          <ProtectedRoute allowedRole="jefatura">
            <Jefatura />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;