const WISHLIST_STORAGE_KEY = 'heritage-atlas-saved-products';

const readSavedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeSavedIds = (ids: string[]) => {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event('wishlist-updated'));
};

export const wishlistStorage = {
  getAll: () => readSavedIds(),
  has: (productId?: string) => !!productId && readSavedIds().includes(productId),
  toggle: (productId?: string) => {
    if (!productId) {
      return false;
    }

    const savedIds = readSavedIds();
    const exists = savedIds.includes(productId);
    const nextIds = exists ? savedIds.filter((id) => id !== productId) : [...savedIds, productId];
    writeSavedIds(nextIds);
    return !exists;
  },
};
