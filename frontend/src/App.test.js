import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  // Ahora la prueba buscará la palabra "LabSync" en lugar de "Learn React"
  const textElement = screen.getByText(/LabSync/i);
  expect(textElement).toBeInTheDocument();
});