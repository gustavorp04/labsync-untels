import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Activity, XCircle, UserX, Download, LogOut } from 'lucide-react';
import { logoutUser } from '../../services/auth';
import { getMetricasJefatura, exportarCsvJefatura } from '../../services/jefaturaService';
import laboratorioService from '../../services/laboratorioService';
import ThemeToggle from '../../components/ThemeToggle';
import './Jefatura.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Jefatura() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [laboratorios, setLaboratorios] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Filtros exportación
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [labId, setLabId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricasData, labsData] = await Promise.all([
        getMetricasJefatura(),
        laboratorioService.getLaboratorios()
      ]);
      setMetricas(metricasData);
      setLaboratorios(labsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      await exportarCsvJefatura(fechaInicio, fechaFin, labId);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Hubo un error al exportar los datos. Inténtelo de nuevo.');
    } finally {
      setExportLoading(false);
    }
  };

  const getChartOptions = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };
  };

  const getBarChartData = () => {
    if (!metricas) return null;
    return {
      labels: metricas.reservas_por_laboratorio.map(item => item.laboratorio),
      datasets: [
        {
          label: 'Total Reservas',
          data: metricas.reservas_por_laboratorio.map(item => item.total_reservas),
          backgroundColor: 'rgba(108, 99, 255, 0.7)',
          borderColor: 'rgba(108, 99, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getDoughnutChartData = () => {
    if (!metricas) return null;
    const { estado_distribucion } = metricas;
    const labels = Object.keys(estado_distribucion);
    const data = Object.values(estado_distribucion);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',  // Completada / Programada
            'rgba(255, 152, 0, 0.7)',  // Pendiente
            'rgba(244, 67, 54, 0.7)',  // Cancelada
            'rgba(156, 39, 176, 0.7)', // No-show
            'rgba(33, 150, 243, 0.7)', // Otro
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(244, 67, 54, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(33, 150, 243, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="jefatura-dashboard">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando panel operativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jefatura-dashboard">
      <header className="jefatura-header">
        <h1>Dashboard Jefatura</h1>
        <div className="header-actions">
          <ThemeToggle />
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="jefatura-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={18} /> Panel de Métricas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'exportar' ? 'active' : ''}`}
          onClick={() => setActiveTab('exportar')}
        >
          <Download size={18} /> Reportes CSV
        </button>
      </div>

      {activeTab === 'dashboard' && metricas && (
        <div className="tab-content">
          <div className="kpi-container">
            <div className="kpi-card">
              <div className="kpi-icon reservas">
                <Activity size={24} />
              </div>
              <div className="kpi-info">
                <h3>Total Reservas</h3>
                <p>{metricas.tasa_cancelaciones.total}</p>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon cancelaciones">
                <XCircle size={24} />
              </div>
              <div className="kpi-info">
                <h3>Tasa Cancelaciones</h3>
                <p>{metricas.tasa_cancelaciones.porcentaje}%</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon noshow">
                <UserX size={24} />
              </div>
              <div className="kpi-info">
                <h3>Total No-Shows</h3>
                <p>{metricas.noshow_por_usuario.reduce((acc, curr) => acc + curr.noshow_count, 0)}</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Reservas por Laboratorio</h3>
              <div className="chart-wrapper">
                {getBarChartData() && <Bar data={getBarChartData()} options={getChartOptions()} />}
              </div>
            </div>

            <div className="chart-card">
              <h3>Distribución de Estados</h3>
              <div className="chart-wrapper">
                {getDoughnutChartData() && (
                  <Doughnut 
                    data={getDoughnutChartData()} 
                    options={{
                      ...getChartOptions(),
                      scales: { x: { display: false }, y: { display: false } }
                    }} 
                  />
                )}
              </div>
            </div>
          </div>
          
          {metricas.noshow_por_usuario.length > 0 && (
            <div className="chart-card" style={{ marginTop: '1.5rem' }}>
              <h3>Top Estudiantes Penalizados (No-Show)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Estudiante</th>
                      <th style={{ padding: '0.5rem' }}>Cantidad de No-Shows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.noshow_por_usuario.map((u, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem' }}>{u.nombre_usuario}</td>
                        <td style={{ padding: '0.5rem' }}>{u.noshow_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exportar' && (
        <div className="tab-content">
          <div className="export-card">
            <h3>Exportar Reporte de Reservas</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Seleccione los filtros para exportar las reservas y asistencias en formato CSV.
            </p>
            
            <div className="export-filters">
              <div className="filter-group">
                <label>Fecha Inicio</label>
                <input 
                  type="date" 
                  value={fechaInicio} 
                  onChange={(e) => setFechaInicio(e.target.value)} 
                />
              </div>
              
              <div className="filter-group">
                <label>Fecha Fin</label>
                <input 
                  type="date" 
                  value={fechaFin} 
                  onChange={(e) => setFechaFin(e.target.value)} 
                />
              </div>

              <div className="filter-group">
                <label>Laboratorio</label>
                <select 
                  value={labId} 
                  onChange={(e) => setLabId(e.target.value)}
                >
                  <option value="">Todos los laboratorios</option>
                  {laboratorios.map(lab => (
                    <option key={lab.id_laboratorio} value={lab.id_laboratorio}>
                      {lab.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                className="export-btn" 
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? 'Generando...' : <><Download size={18} /> Exportar CSV</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jefatura;