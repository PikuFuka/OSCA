import React from 'react';

/**
 * Physical ID card size (CR80): 85.6 mm x 53.98 mm.
 *
 * These values are the single source of truth for both the individual and
 * batch print flows. Keep the card boxes in physical millimetres so the
 * browser cannot shrink them to fit the surrounding layout.
 */
export const ID_CARD_WIDTH_MM = 85.6;
export const ID_CARD_HEIGHT_MM = 53.98;

/** Small space between the ID edge and the dashed cut line. */
export const ID_CARD_CUT_MARGIN_MM = 1;

/** Gap between separate back/front pairs on a batch sheet. */
export const ID_PRINT_FRAME_GAP_MM = 2;

/** Four back/front ID pairs fit comfortably on one A4 sheet. */
export const ID_CARDS_PER_PRINT_PAGE = 4;

/** Back and front touch so the printed sheet can be folded into one ID. */
export const ID_PRINT_PAIR_WIDTH_MM = ID_CARD_WIDTH_MM * 2;

/** Outer frame that holds the pair plus the cut-line margin. */
export const ID_PRINT_FRAME_WIDTH_MM =
  ID_PRINT_PAIR_WIDTH_MM + ID_CARD_CUT_MARGIN_MM * 2;
export const ID_PRINT_FRAME_HEIGHT_MM =
  ID_CARD_HEIGHT_MM + ID_CARD_CUT_MARGIN_MM * 2;

/** Internal design coordinate system used by the ID templates and labels. */
export const ID_PRINT_CONTENT_WIDTH_PX = 480;
export const ID_PRINT_CONTENT_HEIGHT_PX = 303;

const CSS_PX_PER_MM = 96 / 25.4;

export const ID_CARD_WIDTH_PX = ID_CARD_WIDTH_MM * CSS_PX_PER_MM;
export const ID_CARD_HEIGHT_PX = ID_CARD_HEIGHT_MM * CSS_PX_PER_MM;

/** Uniform mapping from the 480 x 303 design canvas to the physical card. */
export const ID_CARD_PRINT_SCALE_X = Number(
  (ID_CARD_WIDTH_PX / ID_PRINT_CONTENT_WIDTH_PX).toFixed(6),
);
export const ID_CARD_PRINT_SCALE_Y = Number(
  (ID_CARD_HEIGHT_PX / ID_PRINT_CONTENT_HEIGHT_PX).toFixed(6),
);

/**
 * Shared page setup. A4 with 10 mm margins leaves 190 x 277 mm, comfortably
 * larger than the 173.2 x 229.92 mm used by four framed ID pairs.
 */
export const ID_PRINT_PAGE_CSS = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }
`;

/**
 * Shared card geometry. Every rule that controls physical size is marked
 * !important so neither the modal layout nor a flex/grid parent can shrink it.
 */
export const ID_CARD_PRINT_CSS = `
  .id-print-card {
    position: relative;
    box-sizing: border-box;
    width: ${ID_CARD_WIDTH_MM}mm !important;
    height: ${ID_CARD_HEIGHT_MM}mm !important;
    min-width: ${ID_CARD_WIDTH_MM}mm !important;
    max-width: ${ID_CARD_WIDTH_MM}mm !important;
    min-height: ${ID_CARD_HEIGHT_MM}mm !important;
    max-height: ${ID_CARD_HEIGHT_MM}mm !important;
    flex: 0 0 ${ID_CARD_WIDTH_MM}mm !important;
    overflow: hidden;
    border: 0 !important;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .id-print-card-content {
    position: relative;
    width: ${ID_PRINT_CONTENT_WIDTH_PX}px;
    height: ${ID_PRINT_CONTENT_HEIGHT_PX}px;
    transform: scale(${ID_CARD_PRINT_SCALE_X}, ${ID_CARD_PRINT_SCALE_Y});
    transform-origin: top left;
  }
  .id-print-pair-frame {
    position: relative;
    box-sizing: border-box;
    width: ${ID_PRINT_FRAME_WIDTH_MM}mm;
    padding: ${ID_CARD_CUT_MARGIN_MM}mm;
    margin: 0 auto;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .id-print-pair {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    gap: 0;
    width: ${ID_PRINT_PAIR_WIDTH_MM}mm;
    margin: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .id-print-cut-guide {
    position: absolute;
    inset: 0;
    z-index: 60;
    box-sizing: border-box;
    border: 0.3mm dashed #000;
    pointer-events: none;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .id-print-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${ID_PRINT_FRAME_GAP_MM}mm;
    width: ${ID_PRINT_FRAME_WIDTH_MM}mm;
    margin: 0 auto;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .id-print-page:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
`;

/**
 * One back/front ID pair. The two faces touch so the sheet can be folded into
 * a single double-sided ID. The dashed cut line wraps the whole pair with a
 * small margin, leaving the fold line clean.
 */
export const IdPrintPair: React.FC<{ front: React.ReactNode }> = ({ front }) => (
  <div className="id-print-pair-frame">
    <div className="id-print-pair">
      <IdPrintCard>
        <img
          src="img/BACK.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0"
          alt=""
        />
      </IdPrintCard>
      <IdPrintCard>{front}</IdPrintCard>
    </div>
    <span className="id-print-cut-guide" aria-hidden="true" />
  </div>
);

export const IdPrintCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="id-print-card">
    <div className="id-print-card-content">{children}</div>
  </div>
);

/** Split selected seniors into sheets of at most four IDs (eight cards). */
export function paginateIdCards<T>(
  items: readonly T[],
  perPage: number = ID_CARDS_PER_PRINT_PAGE,
): T[][] {
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new Error('perPage must be a positive integer');
  }

  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += perPage) {
    pages.push(items.slice(index, index + perPage));
  }
  return pages;
}
