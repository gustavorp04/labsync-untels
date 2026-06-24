import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { exportarCsvJefatura, exportarXlsxJefatura } from '../../services/jefaturaService';

const Icon = {
  Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileExcel: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="17"/><line x1="16" y1="13" x2="8" y2="17"/></svg>,
};

function JefaturaReportes() {
  const { laboratorios, showToast } = useOutletContext();
  const [exportLoading, setExportLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [labId, setLabId] = useState('');

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await exportarCsvJefatura(fechaInicio, fechaFin, labId);
      showToast('ok', 'Reporte CSV exportado correctamente.');
    } catch {
      showToast('error', 'Hubo un error al exportar CSV. Inténtelo de nuevo.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      setExportLoading(true);
      await exportarXlsxJefatura(fechaInicio, fechaFin, labId);
      showToast('ok', 'Reporte Excel exportado correctamente.');
    } catch {
      showToast('error', 'Hubo un error al exportar Excel. Inténtelo de nuevo.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="jef-content">
      <div className="jef-welcome">
        <h1>Reportes de Operación</h1>
        <p>Exporta reportes de reservas y asistencias en formato CSV o Excel.</p>
      </div>

      <div className="jef-chart-card jef-export-card">
        <h3 className="jef-chart-title">Generar Reporte de Reservas</h3>
        <p className="jef-export-desc">Selecciona los filtros para descargar la información detallada.</p>

        <div className="jef-export-filters">
          <div className="jef-filter-group">
            <label>Fecha Inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div className="jef-filter-group">
            <label>Fecha Fin</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
          </div>
          <div className="jef-filter-group">
            <label>Laboratorio</label>
            <select value={labId} onChange={e => setLabId(e.target.value)}>
              <option value="">Todos los laboratorios</option>
              {laboratorios.map(lab => (
                <option key={lab.id_laboratorio} value={lab.id_laboratorio}>{lab.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="jef-export-actions">
          <button className="jef-export-btn" onClick={handleExportCsv} disabled={exportLoading}>
            <Icon.Download />
            {exportLoading ? 'Generando...' : 'Exportar a CSV'}
          </button>
          <button className="jef-export-btn jef-export-btn-xlsx" onClick={handleExportXlsx} disabled={exportLoading}>
            <Icon.FileExcel />
            {exportLoading ? 'Generando...' : 'Exportar a Excel'}
          </button>
        </div>
      </div>

      <div className="jef-info-card">
        <h4>¿Qué incluye el reporte?</h4>
        <ul>
          <li>Listado completo de reservas en el periodo seleccionado</li>
          <li>Estado de cada reserva (Programada, Completada, Cancelada, No-Show)</li>
          <li>Datos del usuario y laboratorio involucrado</li>
          <li>Hora de inicio y fin de cada sesión</li>
          <li>Registro de asistencia (si aplica)</li>
        </ul>
      </div>
    </div>
  );
}

export default JefaturaReportes;
