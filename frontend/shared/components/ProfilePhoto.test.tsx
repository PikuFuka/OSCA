import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePhoto } from './ProfilePhoto';

describe('ProfilePhoto', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders img with tokenized src when photo loads', () => {
    localStorage.setItem('auth_token', 'tok123');
    render(<ProfilePhoto src="/api/storage/profiles/x.png" name="John Doe" />);

    const img = screen.getByRole('img', { name: 'John Doe' });
    expect(img.tagName).toBe('IMG');
    expect((img as HTMLImageElement).src).toContain('/api/storage/profiles/x.png');
    expect((img as HTMLImageElement).src).toContain('token=tok123');
    expect((img as HTMLImageElement).src).not.toContain('/api/api/');
  });

  it('renders initials fallback when src is empty', () => {
    const { container } = render(<ProfilePhoto src={null} name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders initials fallback when src is undefined', () => {
    render(<ProfilePhoto name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders fallback after img onError', () => {
    localStorage.setItem('auth_token', 'tok123');
    const { container } = render(<ProfilePhoto src="/api/storage/profiles/x.png" name="John Doe" />);

    const img = screen.getByRole('img', { name: 'John Doe' });
    fireEvent.error(img);

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('respects custom fallback prop', () => {
    render(<ProfilePhoto src={null} name="John Doe" fallback={<span>Custom Fallback</span>} />);
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('JD')).not.toBeInTheDocument();
  });

  it('passes data: URLs through untouched', () => {
    localStorage.setItem('auth_token', 'tok123');
    const dataUrl = 'data:image/png;base64,AAA';
    render(<ProfilePhoto src={dataUrl} name="Jane" />);

    const img = screen.getByRole('img', { name: 'Jane' });
    expect((img as HTMLImageElement).src).toBe(dataUrl);
  });
});
