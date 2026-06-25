import api from './api';

// Pruebas del cliente HTTP central. No dependen del DOM ni del router,
// por lo que son rápidas y estables en CI.
describe('cliente api (axios)', () => {
  test('apunta al backend bajo el prefijo /api', () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });

  test('envía cookies de credenciales (cookie httpOnly auth_token)', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  test('usa JSON como Content-Type por defecto', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
