import { Product } from '../services/api';

const paletteByCategory: Record<string, { primary: string; secondary: string; accent: string }> = {
  textiles: { primary: '#7c2d12', secondary: '#f3e9dc', accent: '#d97706' },
  paintings: { primary: '#1d4d4f', secondary: '#eef7f2', accent: '#dd6b20' },
  pottery: { primary: '#8c3b2a', secondary: '#f7ece3', accent: '#b7791f' },
  metalwork: { primary: '#2d3748', secondary: '#edf2f7', accent: '#c05621' },
  'traditional toys': { primary: '#7b341e', secondary: '#fff7ed', accent: '#2b6cb0' },
  default: { primary: '#5b4636', secondary: '#f6f1ea', accent: '#b86a2e' },
};

const sanitizeCategory = (category?: string) => category?.trim().toLowerCase() || 'default';

const buildSvgDataUrl = (title: string, subtitle: string, category?: string) => {
  const palette = paletteByCategory[sanitizeCategory(category)] || paletteByCategory.default;
  const safeTitle = title.slice(0, 28);
  const safeSubtitle = subtitle.slice(0, 34);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.secondary}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="980" cy="190" r="170" fill="${palette.accent}" opacity="0.16" />
      <circle cx="210" cy="720" r="210" fill="${palette.primary}" opacity="0.1" />
      <rect x="120" y="130" width="960" height="640" rx="36" fill="#ffffff" stroke="${palette.primary}" stroke-opacity="0.12" />
      <path d="M270 560c80-180 220-270 330-270s240 90 320 270" fill="none" stroke="${palette.accent}" stroke-width="22" stroke-linecap="round" opacity="0.7" />
      <path d="M350 490c60-100 150-150 250-150s180 50 250 150" fill="none" stroke="${palette.primary}" stroke-width="14" stroke-linecap="round" opacity="0.8" />
      <circle cx="600" cy="430" r="72" fill="${palette.secondary}" stroke="${palette.primary}" stroke-width="14" />
      <circle cx="600" cy="430" r="18" fill="${palette.accent}" />
      <text x="160" y="700" font-family="Georgia, serif" font-size="58" font-weight="700" fill="${palette.primary}">${safeTitle}</text>
      <text x="160" y="760" font-family="Arial, sans-serif" font-size="30" fill="#6b6258">${safeSubtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const getProductFallbackImage = (product: Pick<Product, 'name' | 'gi_tag' | 'region' | 'category'>) =>
  buildSvgDataUrl(product.name, `${product.gi_tag} • ${product.region}`, product.category);

export const getProductDisplayImage = (product: Pick<Product, 'name' | 'gi_tag' | 'region' | 'category' | 'image_url'>) =>
  product.image_url || getProductFallbackImage(product);

export const getArtisanFallbackImage = (name: string, regionLabel: string) =>
  buildSvgDataUrl(name, regionLabel, 'default');
