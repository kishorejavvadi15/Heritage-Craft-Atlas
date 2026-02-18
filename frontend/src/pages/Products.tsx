import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productService, Product } from '../services/api';
import './Products.css';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    region: '',
    gi_tag: '',
    artisan_name: '',
  });
  const [regions, setRegions] = useState<string[]>([]);
  const [giTags, setGITags] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, regionsRes, giTagsRes] = await Promise.all([
          productService.getProducts(filters),
          productService.getRegions(),
          productService.getGITags(),
        ]);

        setProducts(productsRes.products || []);
        setRegions(regionsRes.regions?.map((r: any) => r.region) || []);
        setGITags(giTagsRes.gi_tags?.map((g: any) => g.gi_tag) || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products');
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, location.key]); // Refresh when filters change or page is visited

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="products-page">
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Browse Products</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Region</label>
          <select
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>GI Tag</label>
          <select
            value={filters.gi_tag}
            onChange={(e) => handleFilterChange('gi_tag', e.target.value)}
          >
            <option value="">All GI Tags</option>
            {giTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Artisan Name</label>
          <input
            type="text"
            placeholder="Search artisan..."
            value={filters.artisan_name}
            onChange={(e) => handleFilterChange('artisan_name', e.target.value)}
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="no-products">
          <p>No products found matching your filters.</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Upload First Product
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="card product-card"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              ) : (
                <div className="product-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
              <h3>{product.name}</h3>
              <p className="product-region">📍 {product.region}</p>
              <p className="product-gi-tag">🏷️ {product.gi_tag}</p>
              <p className="product-artisan">👨‍🎨 {product.artisan_name}</p>
              {product.price && (
                <p className="product-price">₹{product.price.toLocaleString()}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
