/**
 * Extension-name values offered by the member forms. Stored records may still
 * contain legacy spellings (for example "JR." or "N/A"), so every form value
 * is normalized against this list before it reaches a <select>.
 */
export const EXTENSION_NAME_OPTIONS = ['Jr.', 'Sr.', 'III', 'IV', 'V'];

const NO_EXTENSION_VALUES = new Set(['', 'none', 'n/a', 'na']);

const SUFFIX_VALUES = new Set(['JR', 'JR.', 'JUNIOR', 'JUNIOR.']);

const tokenizeName = (value?: string | null): string[] =>
  (value ?? '')
    .trim()
    .toUpperCase()
    .replace(/,+$/, '')
    .split(/\s+/)
    .filter(Boolean);

/** True when the value ends with a standalone Jr./Junior suffix token. */
export const isExtensionSuffix = (value?: string | null): boolean => {
  const tokens = tokenizeName(value);
  return tokens.length > 0 && SUFFIX_VALUES.has(tokens[tokens.length - 1]);
};

/**
 * Infers "Jr." when a legacy record stored the suffix inside a name part
 * (for example middle_name = "JR.") instead of the extension field.
 * The first token is ignored because "Junior" is also a common given name.
 */
export const inferExtensionName = (...nameParts: Array<string | null | undefined>): string => {
  const tokens = nameParts.flatMap(tokenizeName);
  if (tokens.length === 0) return '';

  const candidates = tokens.length === 1 ? tokens : tokens.slice(1);
  return candidates.some((token) => SUFFIX_VALUES.has(token)) ? 'Jr.' : '';
};

/**
 * Clears a middle name that contains nothing but the suffix, so saving the
 * inferred extension does not render "Jr." twice.
 */
export const stripEmbeddedExtensionSuffix = (middleName?: string | null): string => {
  const raw = (middleName ?? '').trim();
  const tokens = tokenizeName(raw);
  return tokens.length === 1 && SUFFIX_VALUES.has(tokens[0]) ? '' : raw;
};

/**
 * Maps a stored extension name onto the canonical option value.
 * Unknown values are preserved: clearing them must be an explicit choice,
 * never a side effect of editing an unrelated field.
 */
export const normalizeExtensionName = (value?: string | null): string => {
  const raw = (value ?? '').trim();
  if (NO_EXTENSION_VALUES.has(raw.toLowerCase())) return '';

  const canonical = EXTENSION_NAME_OPTIONS.find(
    (option) => option.toLowerCase() === raw.toLowerCase()
  );

  return canonical ?? raw;
};

/**
 * Option list for the extension <select>. A legacy value that has no canonical
 * option is appended so the control shows the member's real value instead of
 * falling back to "None".
 */
export const getExtensionSelectOptions = (currentValue?: string | null): string[] => {
  const normalized = normalizeExtensionName(currentValue);

  if (!normalized || EXTENSION_NAME_OPTIONS.includes(normalized)) {
    return [...EXTENSION_NAME_OPTIONS];
  }

  return [normalized, ...EXTENSION_NAME_OPTIONS];
};
