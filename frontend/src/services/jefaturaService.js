import api from './api';

export const getMetricasJefatura = async () => {
    const response = await api.get('/v1/jefatura/metricas/');
    return response.data;
};

export const exportarCsvJefatura = async (fechaInicio, fechaFin, laboratorioId) => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (laboratorioId) params.laboratorio_id = laboratorioId;

    const response = await api.get('/v1/jefatura/reporte/csv/', {
        params,
        responseType: 'blob' // Important for file download
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte_reservas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const exportarXlsxJefatura = async (fechaInicio, fechaFin, laboratorioId) => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    if (laboratorioId) params.laboratorio_id = laboratorioId;

    const response = await api.get('/v1/jefatura/reporte/xlsx/', {
        params,
        responseType: 'blob' // Important for file download
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte_reservas.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
