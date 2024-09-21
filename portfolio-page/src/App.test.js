import { render, screen } from '@testing-library/react';
import App from './App';

test('renders My Projects title', async () => {
  render(<App />);
  const titleElement = await screen.findByText(/My Projects/i);
  expect(titleElement).toBeInTheDocument();
});
