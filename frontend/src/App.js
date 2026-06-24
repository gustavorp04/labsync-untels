import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import LoginEstudiante from "./pages/auth/estudiante/LoginEstudiante";
import LoginDocente from "./pages/auth/docente/LoginDocente";
import LoginAdmin from "./pages/auth/admin/LoginAdmin";
import LoginJefatura from "./pages/auth/jefatura/LoginJefatura";
import ResetPassword from "./pages/auth/ResetPassword";

// Estudiante
import EstudianteLayout from "./pages/estudiante/EstudianteLayout";
import EstudianteInicio from "./pages/estudiante/Inicio";
import EstudianteReservar from "./pages/estudiante/Reservar";
import EstudianteMisReservas from "./pages/estudiante/MisReservas";

// Docente
import DocenteLayout from "./pages/docente/DocenteLayout";
import DocenteInicio from "./pages/docente/Inicio";
import DocenteReservar from "./pages/docente/Reservar";
import DocenteMisReservas from "./pages/docente/MisReservas";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminInicio from "./pages/admin/Inicio";
import AdminHoy from "./pages/admin/reservas/Hoy";
import AdminProgramadas from "./pages/admin/reservas/Programadas";
import AdminHistorial from "./pages/admin/reservas/Historial";
import AdminInventario from "./pages/admin/inventario/Inventario";
import AdminLabDetalle from "./pages/admin/inventario/LabDetalle";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminVisualizador from "./pages/admin/Visualizador";

// Jefatura
import JefaturaLayout from "./pages/jefatura/JefaturaLayout";
import JefaturaDashboard from "./pages/jefatura/Dashboard";
import JefaturaReportes from "./pages/jefatura/Reportes";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login/estudiante" />} />

        {/* Auth */}
        <Route path="/login/estudiante" element={<LoginEstudiante />} />
        <Route path="/login/docente"    element={<LoginDocente />} />
        <Route path="/login/admin"      element={<LoginAdmin />} />
        <Route path="/login/jefatura"   element={<LoginJefatura />} />
        <Route path="/reset-password"   element={<ResetPassword />} />

        {/* Estudiante */}
        <Route path="/estudiante" element={
          <ProtectedRoute allowedRole="estudiante"><EstudianteLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio"       element={<EstudianteInicio />} />
          <Route path="reservar"     element={<EstudianteReservar />} />
          <Route path="mis-reservas" element={<EstudianteMisReservas />} />
        </Route>

        {/* Docente */}
        <Route path="/docente" element={
          <ProtectedRoute allowedRole="docente"><DocenteLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio"       element={<DocenteInicio />} />
          <Route path="reservar"     element={<DocenteReservar />} />
          <Route path="mis-reservas" element={<DocenteMisReservas />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin_lab"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<AdminInicio />} />
          <Route path="reservas">
            <Route index element={<Navigate to="hoy" replace />} />
            <Route path="hoy"         element={<AdminHoy />} />
            <Route path="programadas" element={<AdminProgramadas />} />
            <Route path="historial"   element={<AdminHistorial />} />
          </Route>
          <Route path="inventario">
            <Route index        element={<AdminInventario />} />
            <Route path=":labId" element={<AdminLabDetalle />} />
          </Route>
          <Route path="usuarios"     element={<AdminUsuarios />} />
          <Route path="visualizador" element={<AdminVisualizador />} />
        </Route>

        {/* Jefatura */}
        <Route path="/jefatura" element={
          <ProtectedRoute allowedRole="jefatura"><JefaturaLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<JefaturaDashboard />} />
          <Route path="reportes"  element={<JefaturaReportes />} />
        </Route>

        <Route path="*" element={<Navigate to="/login/estudiante" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
