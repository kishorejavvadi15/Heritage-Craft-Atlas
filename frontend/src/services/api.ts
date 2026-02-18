import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export const productService = {
  getProducts: async (params?: {
    region?: string;
    gi_tag?: string;
    artisan_name?: string;
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
};

export default api;
