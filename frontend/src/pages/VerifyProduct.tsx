import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService, Product } from '../services/api';
import { getProductDisplayImage, getProductFallbackImage } from '../utils/productImages';
import './VerifyProduct.css';

const VerifyProduct: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState<{ verified: boolean; product?: Product } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('barcode');
    if (code && code.trim()) setBarcode(code.trim());
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let lookupValue = barcode.trim();
      if (lookupValue.includes('/verify?barcode=')) {
        try {
          const url = new URL(lookupValue);
          lookupValue = url.searchParams.get('barcode') || lookupValue;
        } catch {
          lookupValue = lookupValue.split('barcode=')[1] || lookupValue;
        }
      }

      const response = await productService.verifyProduct(lookupValue);
      setResult({
        verified: response.verified,
        product: response.product,
      });
    } catch (err: any) {
      const message =
        err.response?.status === 404
          ? err.response?.data?.detail || 'Product not found. Please check the barcode or verification code.'
          : err.response?.data?.detail || 'Verification failed. Please try again.';
      setError(message);
      setResult({ verified: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-product">
      <h1>Verify Product</h1>
      <p className="verify-intro">
        Enter the barcode or verification code from your Heritage Craft product to confirm authenticity.
      </p>

      <form onSubmit={handleVerify} className="verify-form">
        <div className="verify-input-group">
          <label htmlFor="barcode">Barcode / Verification code</label>
          <input
            id="barcode"
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. HC-KOND-001 or paste a verification link"
            disabled={loading}
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !barcode.trim()}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="verify-error">
          <span className="verify-error-icon">!</span>
          {error}
        </div>
      )}

      {result && !error && result.product && (
        <div className="verify-result success">
          <div className="verify-badge">
            <span className="verify-badge-icon">OK</span>
            <span>Verified by Heritage Atlas</span>
          </div>
          <div className="verify-result-card">
            {result.product.image_url ? (
              <img
                src={getProductDisplayImage(result.product)}
                alt={result.product.name}
                className="verify-result-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getProductFallbackImage(result.product!);
                }}
              />
            ) : (
              <div className="verify-result-image-placeholder">No Image</div>
            )}
            <div className="verify-result-details">
              <h2>{result.product.name}</h2>
              <p className="verify-result-meta">
                <span>Region: {result.product.region}</span>
                <span>GI Tag: {result.product.gi_tag}</span>
                <span>Artisan: {result.product.artisan_name}</span>
              </p>
              {result.product.barcode && (
                <p className="verify-result-barcode">Code: <strong>{result.product.barcode}</strong></p>
              )}
              <Link
                to={`/products/${result.product._id}`}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      )}

      {result && !result.product && !error && (
        <div className="verify-result not-found">
          <p>No product found for this code. It may be invalid or the product may be inactive.</p>
        </div>
      )}
    </div>
  );
};

export default VerifyProduct;
