import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArtisanProfile, getApiErrorMessage, productService } from '../services/api';
import { getArtisanFallbackImage, getProductDisplayImage, getProductFallbackImage } from '../utils/productImages';
import './ArtisanDetail.css';

const ArtisanDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisan = async () => {
      if (!slug) {
        setError('Artisan not found');
        setLoading(false);
        return;
      }

      try {
        const response = await productService.getArtisan(slug);
        setArtisan(response.artisan);
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load artisan profile.'));
      } finally {
        setLoading(false);
      }
    };

    fetchArtisan();
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading artisan profile...</div>;
  }

  if (error || !artisan) {
    return (
      <div className="error">
        {error || 'Artisan not found'}
        <div style={{ marginTop: '1rem' }}>
          <Link to="/artisans" className="btn btn-primary">
            Back to Artisans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="artisan-detail-page">
      <Link to="/artisans" className="back-link">
        &lt;- Back to Artisans
      </Link>

      <section className="artisan-profile-hero">
        <div className="artisan-profile-copy">
          <span className="artisan-profile-label">Artisan Profile</span>
          <h1>{artisan.name}</h1>
          <p>
            {artisan.name} has {artisan.product_count} active products across {artisan.regions.length} regions and{' '}
            {artisan.gi_tags.length} GI traditions.
          </p>
          {artisan.artisan_contact && <p>Contact: {artisan.artisan_contact}</p>}
          <div className="artisan-profile-badges">
            {artisan.regions.map((region) => (
              <span key={region} className="artisan-profile-badge">
                {region}
              </span>
            ))}
          </div>
        </div>
        <img
          src={artisan.hero_image || getArtisanFallbackImage(artisan.name, artisan.regions.join(', '))}
          alt={artisan.name}
          className="artisan-profile-image"
          onError={(event) => {
            (event.target as HTMLImageElement).src = getArtisanFallbackImage(artisan.name, artisan.regions.join(', '));
          }}
        />
      </section>

      <section className="artisan-story-panel">
        <h2>Craft Focus</h2>
        <p>{artisan.latest_story || 'This artisan profile is built from the live craft listings currently available on the platform.'}</p>
        {artisan.categories.length > 0 && (
          <div className="artisan-profile-badges">
            {artisan.categories.map((category) => (
              <span key={category} className="artisan-profile-badge subtle">
                {category}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="artisan-products-section">
        <div className="section-heading">
          <h2>Products by {artisan.name}</h2>
          <Link to={`/products?artisan_name=${encodeURIComponent(artisan.name)}`} className="btn btn-secondary">
            Filter in Products Page
          </Link>
        </div>
        <div className="artisan-products-grid">
          {artisan.products.map((product) => (
            <Link key={product._id} to={`/products/${product._id}`} className="artisan-product-card">
              <img
                src={getProductDisplayImage(product)}
                alt={product.name}
                className="artisan-product-image"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = getProductFallbackImage(product);
                }}
              />
              <div className="artisan-product-body">
                <h3>{product.name}</h3>
                <p>{product.region}</p>
                <p>{product.gi_tag}</p>
                {product.price !== undefined && product.price !== null && (
                  <p className="artisan-product-price">Rs. {product.price.toLocaleString()}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArtisanDetail;
