import { describe, expect, it } from 'vitest';
import {
  ID_CARD_HEIGHT_MM,
  ID_CARD_HEIGHT_PX,
  ID_CARD_PRINT_CSS,
  ID_CARD_PRINT_SCALE_X,
  ID_CARD_PRINT_SCALE_Y,
  ID_CARD_WIDTH_MM,
  ID_CARD_WIDTH_PX,
  ID_CARDS_PER_PRINT_PAGE,
  ID_PRINT_CONTENT_HEIGHT_PX,
  ID_PRINT_CONTENT_WIDTH_PX,
  paginateIdCards,
} from './IdCardPrint';

describe('ID card print geometry', () => {
  it('uses the fixed CR80 card size in millimetres', () => {
    expect(ID_CARD_WIDTH_MM).toBe(85.6);
    expect(ID_CARD_HEIGHT_MM).toBe(53.98);
  });

  it('maps the 480 x 303 design canvas exactly onto the physical card', () => {
    expect(ID_PRINT_CONTENT_WIDTH_PX * ID_CARD_PRINT_SCALE_X).toBeCloseTo(
      ID_CARD_WIDTH_PX,
      2,
    );
    expect(ID_PRINT_CONTENT_HEIGHT_PX * ID_CARD_PRINT_SCALE_Y).toBeCloseTo(
      ID_CARD_HEIGHT_PX,
      2,
    );
  });

  it('prints four IDs per A4 sheet', () => {
    expect(ID_CARDS_PER_PRINT_PAGE).toBe(4);

    const pages = paginateIdCards([1, 2, 3, 4, 5, 6, 7]);
    expect(pages.map((page) => page.length)).toEqual([4, 3]);
    expect(pages.flat()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(paginateIdCards([])).toEqual([]);
  });

  it('locks both card dimensions so no print layout can shrink them', () => {
    expect(ID_CARD_PRINT_CSS).toContain('width: 85.6mm !important');
    expect(ID_CARD_PRINT_CSS).toContain('height: 53.98mm !important');
    expect(ID_CARD_PRINT_CSS).toContain('flex: 0 0 85.6mm !important');
    expect(ID_CARD_PRINT_CSS).toContain('.id-print-cut-guide');
  });
});
