import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  _id?: string;
  name: string;
  description: string;
  gi_tag: string;
  region: string;
  artisan_name: string;
  artisan_contact?: string;
  price?: number;
  category?: string;
  image_url?: string;
  barcode?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  cultural_story?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  artisan_slug?: string;
  verification_url?: string;
  verification_qr_value?: string;
}

export interface Region {
  region: string;
  count: number;
  gi_tags: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  products?: Product[];
}

export interface GITag {
  gi_tag: string;
  count: number;
  regions: string[];
  products?: Product[];
}

export interface Statistics {
  total_products: number;
  unique_regions: number;
  unique_gi_tags: number;
  unique_artisans: number;
  top_regions: Array<{ _id: string; count: number }>;
  top_gi_tags: Array<{ _id: string; count: number }>;
}

export interface Category {
  category: string;
  count: number;
}

export interface ArtisanSummary {
  name: string;
  slug: string;
  product_count: number;
  regions: string[];
  gi_tags: string[];
  categories: string[];
  artisan_contact?: string;
  hero_image?: string;
  latest_story?: string;
  latest_product_name?: string;
}

export interface ArtisanProfile extends ArtisanSummary {
  products: Product[];
}

export interface ProductQueryParams {
  q?: string;
  region?: string;
  gi_tag?: string;
  artisan_name?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: 'newest' | 'oldest' | 'price' | 'name' | 'region';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return API_URL
        ? `Unable to reach the API at ${API_URL}. Start the backend or update REACT_APP_API_URL.`
        : 'Unable to reach the API. Start the backend on http://localhost:8000 or set REACT_APP_API_URL.';
    }

    if (error.response?.status === 404 && !process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'development') {
      return 'The frontend dev server is returning 404 for /api requests. Restart the frontend after the config change, or set REACT_APP_API_URL=http://localhost:8000.';
    }

    if (typeof error.response?.data?.detail === 'string') {
      return error.response.data.detail;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
};

export const productService = {
  getProducts: async (params?: {
    q?: string;
    region?: string;
    gi_tag?: string;
    artisan_name?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: 'newest' | 'oldest' | 'price' | 'name' | 'region';
    sort_order?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
  }) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  verifyProduct: async (barcode: string) => {
    const response = await api.get('/api/products/verify', {
      params: { barcode: barcode.trim() },
    });
    return response.data;
  },

  createProduct: async (product: FormData) => {
    const response = await api.post('/api/products', product, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProductsByRegion: async () => {
    const response = await api.get('/api/products/by-region');
    return response.data;
  },

  getProductsByGITag: async () => {
    const response = await api.get('/api/products/by-gi-tag');
    return response.data;
  },

  getRegions: async () => {
    const response = await api.get('/api/regions');
    return response.data;
  },

  getGITags: async () => {
    const response = await api.get('/api/gi-tags');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/api/stats');
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/api/categories');
    return response.data;
  },

  getArtisans: async (params?: { search?: string; limit?: number; skip?: number }) => {
    const response = await api.get('/api/artisans', { params });
    return response.data;
  },

  getArtisan: async (slug: string) => {
    const response = await api.get(`/api/artisans/${slug}`);
    return response.data;
  },
};

export default api;
