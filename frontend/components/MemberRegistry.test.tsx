import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../services/api', () => ({
  seniorsAPI: {
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markDeceased: vi.fn(),
    getByIdFresh: vi.fn(),
    updatePhoto: vi.fn(),
    deletePhoto: vi.fn(),
    getDocumentUrl: vi.fn(),
    viewDocument: vi.fn(),
  },
  activityLogsAPI: { log: vi.fn() },
}));

import { seniorsAPI } from '../services/api';
import MemberRegistry from './MemberRegistry';

const seniorRow = {
  id: 7635,
  oscaId: '9901',
  firstName: 'JUAN',
  middleName: 'DELACRUZ',
  lastName: 'ZZTEST',
  extensionName: 'JR.',
  name: 'JUAN DELACRUZ ZZTEST',
  dateOfBirth: '1950-01-01',
  barangay: 'Anibong',
  status: 'Active',
  pensionStatus: 'Indigent',
  contactNumber: '09170000000',
  streetAddress: 'Test Street',
};

const seniorWithEmbeddedSuffix = {
  ...seniorRow,
  id: 1359,
  oscaId: '3351011137',
  firstName: 'CARLOS',
  middleName: 'JR.',
  lastName: 'DIMAANO',
  extensionName: null,
  name: 'CARLOS JR. DIMAANO',
};

const renderRegistry = () => {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);

  render(
    <MemberRegistry
      currentUser={{ id: '1', name: 'Admin', role: 'Admin', barangay: 'Anibong' }}
      notify={vi.fn()}
    />
  );
};

const openEditForm = async () => {
  fireEvent.click(await screen.findByTitle('Edit Record'));
  return (await screen.findByLabelText('Extension Name')) as HTMLSelectElement;
};

describe('MemberRegistry extension name editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';

    vi.mocked(seniorsAPI.getAll).mockResolvedValue({
      data: [seniorRow],
      meta: { last_page: 1, total: 1 },
    } as any);
    vi.mocked(seniorsAPI.getById).mockResolvedValue(seniorRow as any);
    vi.mocked(seniorsAPI.update).mockResolvedValue({ senior: seniorRow } as any);
  });

  it('shows a stored legacy uppercase extension as the matching option', async () => {
    renderRegistry();

    const select = await openEditForm();

    expect(select.value).toBe('Jr.');
    expect(select.options[select.selectedIndex].text).toBe('Jr.');
  });

  it('infers Jr. when the suffix is embedded in the middle name', async () => {
    vi.mocked(seniorsAPI.getAll).mockResolvedValue({
      data: [seniorWithEmbeddedSuffix],
      meta: { last_page: 1, total: 1 },
    } as any);
    vi.mocked(seniorsAPI.getById).mockResolvedValue(seniorWithEmbeddedSuffix as any);
    renderRegistry();

    const select = await openEditForm();
    const middleName = screen.getByLabelText('Middle Name') as HTMLInputElement;

    expect(select.value).toBe('Jr.');
    expect(middleName.value).toBe('');
  });

  it('sends an empty extension in one save when None is chosen', async () => {
    renderRegistry();

    const select = await openEditForm();
    fireEvent.change(select, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(seniorsAPI.update).toHaveBeenCalledTimes(1));
    expect(seniorsAPI.update).toHaveBeenCalledWith(
      seniorRow.id,
      expect.objectContaining({ extensionName: '' })
    );
  });

  it('sends an empty middle name in one save when cleared', async () => {
    renderRegistry();

    await openEditForm();
    const middleName = screen.getByLabelText('Middle Name') as HTMLInputElement;
    fireEvent.change(middleName, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(seniorsAPI.update).toHaveBeenCalledTimes(1));
    expect(seniorsAPI.update).toHaveBeenCalledWith(
      seniorRow.id,
      expect.objectContaining({ middleName: '' })
    );
  });
});
