import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, Product } from '../services/api';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const response = await productService.getProduct(id);
        setProduct(response.product);
        setLoading(false);
      } catch (err) {
        setError('Failed to load product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="error">
        {error || 'Product not found'}
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <Link to="/products" className="back-link">← Back to Products</Link>

      <div className="product-detail-content">
        <div className="product-image-section">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-detail-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image';
              }}
            />
          ) : (
            <div className="product-image-placeholder-large">
              <span>No Image Available</span>
            </div>
          )}
        </div>

        <div className="product-info-section">
          <h1>{product.name}</h1>

          {(product.barcode) && (
          <div className="product-verification">
            <div className="verification-badge">
              <span className="verification-badge-icon">✓</span>
              <span>Verified by Heritage Atlas</span>
            </div>
            <div className="verification-barcode">
              <span className="verification-label">Verification code:</span>
              <code className="verification-code">{product.barcode}</code>
              <Link to={`/verify?barcode=${encodeURIComponent(product.barcode)}`} className="verify-link">
                Verify this product →
              </Link>
            </div>
          </div>
        )}

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">📍 Region:</span>
              <span className="meta-value">{product.region}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">🏷️ GI Tag:</span>
              <span className="meta-value">{product.gi_tag}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">👨‍🎨 Artisan:</span>
              <span className="meta-value">{product.artisan_name}</span>
            </div>
            {product.artisan_contact && (
              <div className="meta-item">
                <span className="meta-label">📞 Contact:</span>
                <span className="meta-value">{product.artisan_contact}</span>
              </div>
            )}
            {product.price && (
              <div className="meta-item">
                <span className="meta-label">💰 Price:</span>
                <span className="meta-value price">₹{product.price.toLocaleString()}</span>
              </div>
            )}
            {product.category && (
              <div className="meta-item">
                <span className="meta-label">📂 Category:</span>
                <span className="meta-value">{product.category}</span>
              </div>
            )}
          </div>

          <div className="product-description">
            <h2>Description</h2>
            <p>{product.description}</p>
          </div>

          {product.cultural_story && (
            <div className="cultural-story">
              <h2>Cultural Story</h2>
              <p>{product.cultural_story}</p>
            </div>
          )}

          {product.location && (
            <div className="product-location">
              <h2>Location</h2>
              <p>
                Latitude: {product.location.latitude}, Longitude: {product.location.longitude}
              </p>
              <Link
                to={`/map?lat=${product.location.latitude}&lng=${product.location.longitude}`}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                View on Map
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
