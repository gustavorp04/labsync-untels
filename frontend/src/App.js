import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import LoginEstudiante from "./pages/auth/estudiante/LoginEstudiante";
import LoginDocente from "./pages/auth/docente/LoginDocente";
import LoginAdmin from "./pages/auth/admin/LoginAdmin";
import LoginJefatura from "./pages/auth/jefatura/LoginJefatura";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard Pages
import Estudiante from "./pages/estudiante/Estudiante";
import Docente from "./pages/docente/Docente";
import Admin from "./pages/admin/Admin";
import Jefatura from "./pages/jefatura/Jefatura";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to student login */}
        <Route path="/" element={<Navigate to="/login/estudiante" />} />
        
        {/* Separated Auth Routes */}
        <Route path="/login/estudiante" element={<LoginEstudiante />} />
        <Route path="/login/docente" element={<LoginDocente />} />
        <Route path="/login/admin" element={<LoginAdmin />} />
        <Route path="/login/jefatura" element={<LoginJefatura />} />
        
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard Routes */}
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
          <ProtectedRoute allowedRole="admin_lab">
            <Admin />
          </ProtectedRoute>
        } />

        <Route path="/jefatura" element={
          <ProtectedRoute allowedRole="jefatura">
            <Jefatura />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login/estudiante" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;