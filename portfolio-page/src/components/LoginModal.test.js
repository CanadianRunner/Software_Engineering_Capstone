import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import LoginModal from './LoginModal';

describe('LoginModal Component', () => {
  test('displays error message on failed login attempt', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false }),
      })
    );
  });

  test('calls onLoginSuccess on successful login', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      })
    );

    const onLoginSuccess = jest.fn();

    render(<LoginModal onLoginSuccess={onLoginSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'correctuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'correctpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
  });
});
