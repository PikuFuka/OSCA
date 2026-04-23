import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthProvider';

describe('App Component', () => {
  it('renders without crashing and shows loading state initially', () => {
    // AuthProvider is required for App to render because it uses useAuth hook
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
    
    // Check if the loading screen is displayed initially
    // We can look for the text "OSCA Pagsanjan" inside the loading container
    expect(screen.getByText('OSCA Pagsanjan')).toBeInTheDocument();
  });
});
