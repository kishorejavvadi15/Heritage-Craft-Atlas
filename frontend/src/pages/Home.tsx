import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getApiErrorMessage, productService, Statistics } from '../services/api';
import './Home.css';

const Home: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await productService.getStatistics();
        setStats(response.statistics);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load statistics.'));
        setLoading(false);
      }
    };

    fetchStats();
  }, [location.key]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <p>Start the FastAPI server with `npm run backend:start` from the repo root.</p>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>Heritage Atlas</h1>
        <p>Discover India's GI-Tagged Traditional Art Forms</p>
        <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
          Explore traditional crafts organized by geographical regions and cultural heritage
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
          <Link to="/artisans" className="btn btn-secondary">Meet Artisans</Link>
          <Link to="/map" className="btn btn-secondary">Explore Map</Link>
          <Link to="/saved" className="btn btn-secondary">Saved Collection</Link>
        </div>
      </section>

      {stats && (
        <section className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total_products}</div>
            <div className="stat-label">Total Products</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.unique_regions}</div>
            <div className="stat-label">Regions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.unique_gi_tags}</div>
            <div className="stat-label">GI Tags</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.unique_artisans}</div>
            <div className="stat-label">Artisans</div>
          </div>
        </section>
      )}

      <section className="features">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          Platform Features
        </h2>
        <div className="feature-grid">
          <Link to="/map" className="feature-card">
            <div className="feature-icon">MAP</div>
            <h3>Map-Based Discovery</h3>
            <p>Explore crafts by geographical regions on an interactive map</p>
          </Link>
          <Link to="/products" className="feature-card">
            <div className="feature-icon">GI</div>
            <h3>GI-Tagged Products</h3>
            <p>Products organized by Geographical Indications for authenticity</p>
          </Link>
          <Link to="/products" className="feature-card">
            <div className="feature-icon">STORY</div>
            <h3>Cultural Stories</h3>
            <p>Learn about the rich heritage and traditions behind each craft</p>
          </Link>
          <Link to="/artisans" className="feature-card">
            <div className="feature-icon">MAKER</div>
            <h3>Artisan Profiles</h3>
            <p>Follow the makers behind each craft and explore their full collections</p>
          </Link>
          <Link to="/upload" className="feature-card">
            <div className="feature-icon">ART</div>
            <h3>Artisan-First</h3>
            <p>Support rural artists with fair visibility and easy product uploads</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
