import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';
import { MemoryRouter } from 'react-router-dom';

describe('Navbar Component', () => {
  test('renders the navbar with logo and navigation items', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const logo = screen.getByAltText(/a logo of the pnw mountain range/i);
    expect(logo).toBeInTheDocument();

    const navItems = screen.getAllByRole('link');
    expect(navItems.length).toBeGreaterThan(0);
  });
});
