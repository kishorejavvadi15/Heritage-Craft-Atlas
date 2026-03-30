import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SaveProductButton from '../components/SaveProductButton';
import { getApiErrorMessage, productService, Product } from '../services/api';
import { getProductDisplayImage, getProductFallbackImage } from '../utils/productImages';
import { wishlistStorage } from '../utils/wishlist';
import './SavedProducts.css';

const SavedProducts: React.FC = () => {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedProducts = async () => {
    const savedIds = wishlistStorage.getAll();
    if (savedIds.length === 0) {
      setSavedProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.allSettled(savedIds.map((id) => productService.getProduct(id)));
      const products = responses
        .filter((result): result is PromiseFulfilledResult<{ product: Product }> => result.status === 'fulfilled')
        .map((result) => result.value.product)
        .filter(Boolean);
      setSavedProducts(products);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load saved products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedProducts();
    const syncSavedProducts = () => loadSavedProducts();
    window.addEventListener('wishlist-updated', syncSavedProducts);
    return () => window.removeEventListener('wishlist-updated', syncSavedProducts);
  }, []);

  if (loading) {
    return <div className="loading">Loading saved products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="saved-products-page">
      <div className="saved-products-header">
        <div>
          <h1>Saved Products</h1>
          <p>Your shortlist of crafts and artisan products to revisit later.</p>
        </div>
        <Link to="/products" className="btn btn-secondary">
          Browse More Crafts
        </Link>
      </div>

      {savedProducts.length === 0 ? (
        <div className="saved-empty-state">
          <h2>No saved products yet</h2>
          <p>Use the Save button on any product card or detail page to build your personal collection.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="saved-products-grid">
          {savedProducts.map((product) => (
            <Link key={product._id} to={`/products/${product._id}`} className="saved-product-card">
              <div className="saved-product-topbar">
                <span className="saved-product-tag">{product.gi_tag}</span>
                <SaveProductButton
                  saved={true}
                  className="save-product-button is-saved"
                  onToggle={() => {
                    wishlistStorage.toggle(product._id);
                    loadSavedProducts();
                  }}
                />
              </div>
              <img
                src={getProductDisplayImage(product)}
                alt={product.name}
                className="saved-product-image"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = getProductFallbackImage(product);
                }}
              />
              <h3>{product.name}</h3>
              <p>{product.region}</p>
              <p>Artisan: {product.artisan_name}</p>
              {product.price !== undefined && product.price !== null && (
                <p className="saved-product-price">Rs. {product.price.toLocaleString()}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProducts;
