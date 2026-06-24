import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getMetricasJefatura } from '../../services/jefaturaService';

const Icon = {
  Activity:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  XCircle:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  UserX:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Flask:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6M10 3v7l-5 8a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 18l-5-8V3"/></svg>,
  TrendingUp:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

function JefaturaDashboard() {
  const { laboratorios, showToast } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

  const nombre = localStorage.getItem('nombre') || 'Jefatura';

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const fetchMetricas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMetricasJefatura();
      setMetricas(data);
    } catch {
      showToast('error', 'Error al cargar los datos del panel.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchMetricas(); }, [fetchMetricas]);

  const chartOptions = useMemo(() => {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#c9d1d9' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, font: { size: 12 } } },
        tooltip: {
          backgroundColor: isDark ? '#1e2533' : '#fff',
          titleColor: textColor, bodyColor: textColor,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    };
  }, [theme]);

  const doughnutOptions = useMemo(() => ({
    ...chartOptions,
    scales: { x: { display: false }, y: { display: false } },
  }), [chartOptions]);

  const barChartData = useMemo(() => {
    if (!metricas?.reservas_por_laboratorio) return null;
    return {
      labels: metricas.reservas_por_laboratorio.map(i => i.laboratorio),
      datasets: [{
        label: 'Total Reservas',
        data: metricas.reservas_por_laboratorio.map(i => i.total_reservas),
        backgroundColor: 'rgba(108, 99, 255, 0.65)',
        borderColor: 'rgba(108, 99, 255, 1)',
        borderWidth: 1, borderRadius: 6,
      }],
    };
  }, [metricas]);

  const doughnutData = useMemo(() => {
    if (!metricas?.estado_distribucion) return null;
    const { estado_distribucion } = metricas;
    return {
      labels: Object.keys(estado_distribucion),
      datasets: [{
        data: Object.values(estado_distribucion),
        backgroundColor: ['rgba(76,175,80,0.75)','rgba(255,152,0,0.75)','rgba(244,67,54,0.75)','rgba(156,39,176,0.75)','rgba(33,150,243,0.75)'],
        borderColor:      ['rgba(76,175,80,1)',   'rgba(255,152,0,1)',   'rgba(244,67,54,1)',   'rgba(156,39,176,1)',   'rgba(33,150,243,1)'  ],
        borderWidth: 2, hoverOffset: 8,
      }],
    };
  }, [metricas]);

  const kpis = useMemo(() => {
    if (!metricas) return [];
    const total      = metricas.tasa_cancelaciones?.total ?? 0;
    const canceladas = metricas.tasa_cancelaciones?.canceladas ?? 0;
    const noShows    = metricas.noshow_por_usuario?.reduce((acc, u) => acc + u.noshow_count, 0) ?? 0;
    const completadas = metricas.estado_distribucion?.Completada ?? 0;
    const tasaAsistencia = total > 0 ? (((total - noShows - canceladas) / total) * 100).toFixed(1) : '0.0';
    const labsActivos = laboratorios.filter(l => l.habilitado).length;
    return [
      { label: 'Total Reservas',     value: total,                                              icon: Icon.Activity,    color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
      { label: 'Completadas',        value: completadas,                                         icon: Icon.CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
      { label: 'Tasa Cancelaciones', value: `${metricas.tasa_cancelaciones?.porcentaje ?? 0}%`, icon: Icon.XCircle,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
      { label: 'Total No-Shows',     value: noShows,                                             icon: Icon.UserX,       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
      { label: 'Tasa Asistencia',    value: `${tasaAsistencia}%`,                               icon: Icon.TrendingUp,  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
      { label: 'Labs Habilitados',   value: `${labsActivos} / ${laboratorios.length}`,          icon: Icon.Flask,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
    ];
  }, [metricas, laboratorios]);

  if (loading) {
    return (
      <div className="jef-loading-screen">
        <div className="jef-spinner" />
        <p>Cargando panel de jefatura…</p>
      </div>
    );
  }

  if (!metricas) return null;

  return (
    <div className="jef-content">
      <div className="jef-welcome">
        <h1>Bienvenido, {nombre.split(' ')[0]} 👋</h1>
        <p>Aquí tienes el resumen operativo de los laboratorios UNTELS.</p>
      </div>

      <div className="jef-kpi-grid">
        {kpis.map(kpi => (
          <div className="jef-kpi-card" key={kpi.label}>
            <div className="jef-kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
              <kpi.icon />
            </div>
            <div className="jef-kpi-info">
              <span className="jef-kpi-label">{kpi.label}</span>
              <span className="jef-kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="jef-charts-grid">
        <div className="jef-chart-card">
          <h3 className="jef-chart-title">Reservas por Laboratorio</h3>
          <div className="jef-chart-wrapper">
            {barChartData && <Bar data={barChartData} options={chartOptions} />}
          </div>
        </div>
        <div className="jef-chart-card">
          <h3 className="jef-chart-title">Distribución de Estados</h3>
          <div className="jef-chart-wrapper">
            {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
          </div>
        </div>
      </div>

      {laboratorios.length > 0 && (
        <div className="jef-chart-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="jef-chart-title">Estado de Laboratorios</h3>
          <div className="jef-labs-grid">
            {laboratorios.map(lab => (
              <div key={lab.id_laboratorio} className="jef-lab-pill">
                <span className={`jef-lab-dot ${lab.habilitado ? 'on' : 'off'}`} />
                <div className="jef-lab-info">
                  <span className="jef-lab-name">{lab.nombre}</span>
                  <span className="jef-lab-code">{lab.codigo_patrimonio}</span>
                </div>
                <span className={`jef-lab-badge ${lab.habilitado ? 'ok' : 'ko'}`}>
                  {lab.habilitado ? 'Habilitado' : 'Inhab.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {metricas.noshow_por_usuario?.length > 0 && (
        <div className="jef-chart-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="jef-chart-title">Top Estudiantes con No-Show</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="jef-table">
              <thead>
                <tr><th>#</th><th>Estudiante</th><th>No-Shows</th><th>Nivel</th></tr>
              </thead>
              <tbody>
                {metricas.noshow_por_usuario.map((u, i) => {
                  const nivel = u.noshow_count >= 5 ? { label: 'Alto', cls: 'high' }
                    : u.noshow_count >= 3 ? { label: 'Medio', cls: 'mid' }
                    : { label: 'Bajo', cls: 'low' };
                  return (
                    <tr key={i}>
                      <td className="jef-td-num">{i + 1}</td>
                      <td>{u.nombre_usuario}</td>
                      <td className="jef-td-count">{u.noshow_count}</td>
                      <td><span className={`jef-risk-badge jef-risk-${nivel.cls}`}>{nivel.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default JefaturaDashboard;
