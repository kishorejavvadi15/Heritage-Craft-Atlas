import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useParams, Link } from 'react-router-dom';
import SaveProductButton from '../components/SaveProductButton';
import { getApiErrorMessage, productService, Product } from '../services/api';
import { getProductDisplayImage, getProductFallbackImage } from '../utils/productImages';
import { wishlistStorage } from '../utils/wishlist';
import './ProductDetail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      try {
        const response = await productService.getProduct(id);
        setProduct(response.product);
        setSaved(wishlistStorage.has(response.product?._id));
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load product.'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) {
      setImageSrc('');
      return;
    }

    setImageSrc(getProductDisplayImage(product));
  }, [product]);

  useEffect(() => {
    const generateQrCode = async () => {
      if (!product?.verification_qr_value) {
        setQrCodeDataUrl('');
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(product.verification_qr_value, {
          width: 180,
          margin: 1,
          color: {
            dark: '#1f2937',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch {
        setQrCodeDataUrl('');
      }
    };

    generateQrCode();
  }, [product?.verification_qr_value]);

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
      <Link to="/products" className="back-link">
        &lt;- Back to Products
      </Link>

      <div className="product-detail-content">
        <div className="product-image-section">
          <img
            src={imageSrc}
            alt={product.name}
            className="product-detail-image"
            onError={() => {
              setImageSrc(getProductFallbackImage(product));
            }}
          />
        </div>

        <div className="product-info-section">
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <SaveProductButton
              saved={saved}
              className={`save-product-button detail-save-button ${saved ? 'is-saved' : ''}`}
              onToggle={() => {
                const nextSaved = wishlistStorage.toggle(product._id);
                setSaved(nextSaved);
              }}
            />
          </div>

          {product.barcode && (
            <div className="product-verification">
              <div className="verification-badge">
                <span className="verification-badge-icon">OK</span>
                <span>Verified by Heritage Atlas</span>
              </div>
              <div className="verification-barcode">
                <span className="verification-label">Verification code:</span>
                <code className="verification-code">{product.barcode}</code>
                <Link to={`/verify?barcode=${encodeURIComponent(product.barcode)}`} className="verify-link">
                  Verify this product -&gt;
                </Link>
              </div>
              {product.verification_url && (
                <div className="verification-qr-panel">
                  {qrCodeDataUrl && <img src={qrCodeDataUrl} alt={`Verification QR code for ${product.name}`} className="verification-qr-image" />}
                  <div>
                    <h3>Scan to verify</h3>
                    <p>Share this QR code on packaging so buyers can open the live authenticity page directly.</p>
                    <a href={product.verification_url} className="verify-link">
                      Open verification link
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">Region:</span>
              <span className="meta-value">{product.region}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">GI Tag:</span>
              <span className="meta-value">{product.gi_tag}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Artisan:</span>
              <span className="meta-value">
                {product.artisan_slug ? <Link to={`/artisans/${product.artisan_slug}`}>{product.artisan_name}</Link> : product.artisan_name}
              </span>
            </div>
            {product.artisan_contact && (
              <div className="meta-item">
                <span className="meta-label">Contact:</span>
                <span className="meta-value">{product.artisan_contact}</span>
              </div>
            )}
            {product.price !== undefined && product.price !== null && (
              <div className="meta-item">
                <span className="meta-label">Price:</span>
                <span className="meta-value price">Rs. {product.price.toLocaleString()}</span>
              </div>
            )}
            {product.category && (
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{product.category}</span>
              </div>
            )}
          </div>

          <div className="product-description">
            <h2>Description</h2>
            <p>{product.description}</p>
          </div>

          <div className="craft-timeline">
            <h2>Craft Journey</h2>
            <div className="timeline-list">
              <div className="timeline-step">
                <span className="timeline-dot" />
                <div>
                  <h3>Origin</h3>
                  <p>{product.region} | {product.gi_tag}</p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="timeline-dot" />
                <div>
                  <h3>Maker</h3>
                  <p>{product.artisan_name} preserves and represents this craft tradition.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="timeline-dot" />
                <div>
                  <h3>Cultural Meaning</h3>
                  <p>{product.cultural_story || 'Cultural story can be enriched further from the upload flow for deeper storytelling.'}</p>
                </div>
              </div>
            </div>
          </div>

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
