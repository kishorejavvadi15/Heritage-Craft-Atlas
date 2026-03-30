import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtisanSummary, getApiErrorMessage, productService } from '../services/api';
import { getArtisanFallbackImage } from '../utils/productImages';
import './Artisans.css';

const Artisans: React.FC = () => {
  const [artisans, setArtisans] = useState<ArtisanSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const response = await productService.getArtisans({ search });
        setArtisans(response.artisans || []);
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load artisans.'));
      } finally {
        setLoading(false);
      }
    };

    fetchArtisans();
  }, [search]);

  if (loading) {
    return <div className="loading">Loading artisans...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="artisans-page">
      <div className="artisans-hero">
        <div>
          <h1>Artisan Profiles</h1>
          <p>Discover the makers behind each heritage craft and explore their body of work.</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search artisans by name"
          className="artisans-search"
        />
      </div>

      <div className="artisans-grid">
        {artisans.map((artisan) => (
          <Link key={artisan.slug} to={`/artisans/${artisan.slug}`} className="artisan-card">
            <img
              src={artisan.hero_image || getArtisanFallbackImage(artisan.name, artisan.regions.join(', '))}
              alt={artisan.name}
              className="artisan-card-image"
              onError={(event) => {
                (event.target as HTMLImageElement).src = getArtisanFallbackImage(artisan.name, artisan.regions.join(', '));
              }}
            />
            <div className="artisan-card-body">
              <h2>{artisan.name}</h2>
              <p>{artisan.product_count} listed products</p>
              <p>{artisan.regions.join(', ')}</p>
              {artisan.latest_product_name && <p>Latest: {artisan.latest_product_name}</p>}
              {artisan.gi_tags.length > 0 && (
                <div className="artisan-badges">
                  {artisan.gi_tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="artisan-badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Artisans;
