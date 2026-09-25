import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getInitials, avatarToneFor, TableAvatar } from './Table';

describe('getInitials', () => {
  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials()).toBe('');
  });

  it('returns single initial for a single name', () => {
    expect(getInitials('John')).toBe('J');
    expect(getInitials('madonna')).toBe('M');
  });

  it('returns two initials for first + last names', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns first two initials for multi-word names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('ignores extra spaces', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });
});

describe('avatarToneFor', () => {
  it('is deterministic for the same name', () => {
    expect(avatarToneFor('John Doe')).toBe(avatarToneFor('John Doe'));
  });

  it('returns a non-empty tone class', () => {
    expect(avatarToneFor('Jane')).toMatch(/bg-\S+ text-\S+/);
    expect(avatarToneFor('')).toMatch(/bg-\S+ text-\S+/);
  });
});

describe('TableAvatar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders img with tokenized photo when photo is present', () => {
    localStorage.setItem('auth_token', 'tok123');
    render(<TableAvatar name="Jane Doe" photo="/api/storage/profiles/j.png" />);

    const img = screen.getByRole('img', { name: 'Jane Doe' });
    expect(img.tagName).toBe('IMG');
    expect((img as HTMLImageElement).src).toContain('/api/storage/profiles/j.png');
    expect((img as HTMLImageElement).src).toContain('token=tok123');
  });

  it('falls back to initials without photo', () => {
    render(<TableAvatar name="Jane Doe" />);

    expect(screen.queryByRole('img', { name: 'Jane Doe' })).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('falls back to initials on img error', () => {
    localStorage.setItem('auth_token', 'tok123');
    render(<TableAvatar name="Jane Doe" photo="/api/storage/profiles/j.png" />);

    const img = screen.getByRole('img', { name: 'Jane Doe' });
    fireEvent.error(img);

    expect(screen.queryByRole('img', { name: 'Jane Doe' })).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
