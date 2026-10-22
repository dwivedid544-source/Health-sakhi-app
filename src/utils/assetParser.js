/**
 * Utility to safely parse content asset description metadata markers:
 * [hs_cover], [hs_chapters], [hs_access]
 */
export function parseContentAssetMetadata(rawDescription = '') {
  const str = typeof rawDescription === 'string' ? rawDescription : '';

  let isPaid = str.includes('[hs_access] Paid');
  let coverUrl = null;
  let customChapters = null;

  if (str.includes('[hs_cover]')) {
    const coverPart = str.split('[hs_cover]')[1];
    if (coverPart) {
      const extractedCover = coverPart.split('[hs_chapters]')[0].split('[hs_access]')[0].trim();
      if (extractedCover && extractedCover.startsWith('http')) {
        coverUrl = extractedCover;
      }
    }
  }

  if (str.includes('[hs_chapters]')) {
    const chapPart = str.split('[hs_chapters]')[1];
    if (chapPart) {
      const jsonStr = chapPart.split('[hs_access]')[0].trim();
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customChapters = parsed;
        }
      } catch (e) {
        console.warn('[assetParser] Failed to parse [hs_chapters] JSON safely:', e.message);
      }
    }
  }

  let cleanDescription = str
    .split('[hs_cover]')[0]
    .split('[hs_chapters]')[0]
    .split('[hs_access]')[0]
    .trim();

  return {
    description: cleanDescription,
    coverUrl: coverUrl,
    chapters: customChapters,
    isPaid: isPaid
  };
}

/**
 * Standardize single chapter item without inventing fake page metrics
 */
export function normalizeChapterItem(ch, index) {
  if (typeof ch === 'string') {
    return {
      chapterNumber: index + 1,
      title: ch,
      page: index + 1
    };
  }

  const pageNum = ch.page !== undefined
    ? ch.page
    : (ch.startPage !== undefined ? ch.startPage + 1 : undefined);

  return {
    chapterNumber: ch.chapterNumber || index + 1,
    title: ch.title || `Chapter ${index + 1}`,
    page: pageNum,
    startPage: ch.startPage,
    endPage: ch.endPage,
    audioUrl: ch.audioUrl || null,
    isLocked: Boolean(ch.isLocked),
    isCompleted: Boolean(ch.isCompleted)
  };
}
