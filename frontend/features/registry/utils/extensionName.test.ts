import { describe, expect, it } from 'vitest';
import {
  EXTENSION_NAME_OPTIONS,
  getExtensionSelectOptions,
  inferExtensionName,
  isExtensionSuffix,
  normalizeExtensionName,
  stripEmbeddedExtensionSuffix,
} from './extensionName';

describe('normalizeExtensionName', () => {
  it('maps legacy uppercase values onto the form options', () => {
    expect(normalizeExtensionName('JR.')).toBe('Jr.');
    expect(normalizeExtensionName('SR.')).toBe('Sr.');
  });

  it('keeps canonical option values unchanged', () => {
    EXTENSION_NAME_OPTIONS.forEach((option) => {
      expect(normalizeExtensionName(option)).toBe(option);
    });
  });

  it('treats empty and "none" spellings as no extension', () => {
    expect(normalizeExtensionName('')).toBe('');
    expect(normalizeExtensionName('   ')).toBe('');
    expect(normalizeExtensionName('None')).toBe('');
    expect(normalizeExtensionName('N/A')).toBe('');
    expect(normalizeExtensionName(null)).toBe('');
    expect(normalizeExtensionName(undefined)).toBe('');
  });

  it('preserves unknown legacy values so they are not silently cleared', () => {
    expect(normalizeExtensionName('JOSE')).toBe('JOSE');
    expect(normalizeExtensionName('S.')).toBe('S.');
  });
});

describe('inferExtensionName', () => {
  it('detects "Jr." stored inside a name part', () => {
    expect(inferExtensionName('JR.')).toBe('Jr.');
    expect(inferExtensionName('', 'DIMAANO', 'CARLOS JR. DIMAANO')).toBe('Jr.');
  });

  it('detects the spelled-out "Junior" suffix', () => {
    expect(inferExtensionName('JUNIOR')).toBe('Jr.');
    expect(inferExtensionName('Junior.')).toBe('Jr.');
  });

  it('ignores ordinary names that merely start with "Jun"', () => {
    expect(inferExtensionName('JUNE')).toBe('');
    expect(inferExtensionName('JUNDOC')).toBe('');
    expect(inferExtensionName('JUNIOR', 'DELA CRUZ')).toBe('');
  });

  it('does not invent an extension when no suffix is present', () => {
    expect(inferExtensionName('CARLOS', 'DIMAANO')).toBe('');
    expect(inferExtensionName()).toBe('');
  });
});

describe('isExtensionSuffix', () => {
  it('matches only a standalone trailing suffix token', () => {
    expect(isExtensionSuffix('JR.')).toBe(true);
    expect(isExtensionSuffix('CARLOS JR.')).toBe(true);
    expect(isExtensionSuffix('JUNIOR')).toBe(true);
    expect(isExtensionSuffix('JUNE')).toBe(false);
    expect(isExtensionSuffix('JR. DIMAANO')).toBe(false);
  });
});

describe('stripEmbeddedExtensionSuffix', () => {
  it('clears a middle name that is only the suffix', () => {
    expect(stripEmbeddedExtensionSuffix('JR.')).toBe('');
    expect(stripEmbeddedExtensionSuffix(' Junior ')).toBe('');
  });

  it('keeps a real middle name untouched', () => {
    expect(stripEmbeddedExtensionSuffix('DELA CRUZ')).toBe('DELA CRUZ');
    expect(stripEmbeddedExtensionSuffix('JR. DIMAANO')).toBe('JR. DIMAANO');
  });
});

describe('getExtensionSelectOptions', () => {
  it('returns the canonical options when the current value is known', () => {
    expect(getExtensionSelectOptions('Jr.')).toEqual([...EXTENSION_NAME_OPTIONS]);
    expect(getExtensionSelectOptions('')).toEqual([...EXTENSION_NAME_OPTIONS]);
  });

  it('adds an option for an unknown legacy value so the select displays it', () => {
    const options = getExtensionSelectOptions('JOSE');

    expect(options).toContain('JOSE');
    expect(options.filter((option) => option === 'JOSE')).toHaveLength(1);
  });
});
