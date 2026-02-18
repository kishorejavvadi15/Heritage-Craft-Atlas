import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { productService, Region, Product } from '../services/api';
import './MapView.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapView: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regionsRes, productsRes] = await Promise.all([
          productService.getProductsByRegion(),
          productService.getProducts({ limit: 1000 })
        ]);
        setRegions(regionsRes.regions || []);
        // Filter only products with valid coordinates
        const productsWithLocation = (productsRes.products || []).filter(
          (p: Product) => p.location?.latitude && p.location?.longitude
        );
        setAllProducts(productsWithLocation);
        setLoading(false);
      } catch (err) {
        setError('Failed to load map data');
        setLoading(false);
      }
    };

    fetchData();
  }, [location.key]); // Refresh when page is visited

  // Handle URL parameters for centering map
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
    }
  }, [location.search]);

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    if (region.location?.latitude && region.location?.longitude) {
      setMapCenter([region.location.latitude, region.location.longitude]);
    } else if (region.products && region.products.length > 0) {
      // Find first product with location in this region
      const productWithLocation = region.products.find(p => p.location?.latitude && p.location?.longitude);
      if (productWithLocation?.location) {
        setMapCenter([productWithLocation.location.latitude, productWithLocation.location.longitude]);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading map...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="map-view">
      <h1 style={{ marginBottom: '1rem', color: '#333' }}>Explore by Region</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Hover over markers to see product details. Click region names or markers to explore products. Each marker shows the exact location where the product was added.
      </p>
      {allProducts.length > 0 && (
        <p style={{ color: '#667eea', marginBottom: '1rem', fontWeight: 600 }}>
          📍 {allProducts.length} products with location markers on the map
        </p>
      )}

      <div className="map-layout">
        <div className="regions-sidebar">
          <h2>Regions ({regions.length})</h2>
          <div className="regions-list">
            {regions.map((region, index) => (
              <div
                key={index}
                className={`region-item ${selectedRegion?.region === region.region ? 'active' : ''}`}
                onClick={() => handleRegionClick(region)}
              >
                <h3>{region.region}</h3>
                <p className="region-count">{region.count} products</p>
                <div className="gi-tags">
                  {region.gi_tags?.slice(0, 3).map((tag, tagIndex) => (
                    <span key={tagIndex} className="gi-tag-badge">{tag}</span>
                  ))}
                  {region.gi_tags && region.gi_tags.length > 3 && (
                    <span className="gi-tag-badge">+{region.gi_tags.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter center={mapCenter} />
            {/* Show individual product markers at exact locations */}
            {allProducts
              .filter(product => product.location?.latitude && product.location?.longitude)
              .map((product) => (
                <Marker
                  key={product._id}
                  position={[product.location!.latitude, product.location!.longitude]}
                  eventHandlers={{
                    mouseover: (e) => {
                      e.target.openPopup();
                    }
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3>{product.name}</h3>
                      <p><strong>📍 {product.region}</strong></p>
                      <p>🏷️ <strong>GI Tag:</strong> {product.gi_tag}</p>
                      <p>👨‍🎨 <strong>Artisan:</strong> {product.artisan_name}</p>
                      {product.artisan_contact && (
                        <p>📞 <strong>Contact:</strong> {product.artisan_contact}</p>
                      )}
                      {product.price && (
                        <p>💰 <strong>Price:</strong> ₹{product.price.toLocaleString()}</p>
                      )}
                      {product.location && (
                        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                          📍 Location: {product.location.latitude.toFixed(4)}, {product.location.longitude.toFixed(4)}
                        </p>
                      )}
                      <Link 
                        to={`/products/${product._id}`} 
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem', display: 'inline-block', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      >
                        View Full Details
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {selectedRegion && (
        <div className="selected-region-details">
          <h2>{selectedRegion.region}</h2>
          <p className="region-stats">
            {selectedRegion.count} products • {selectedRegion.gi_tags?.length || 0} GI Tags
          </p>
          {selectedRegion.products && selectedRegion.products.length > 0 && (
            <div className="region-products-preview">
              <h3>Products from {selectedRegion.region}</h3>
              <div className="products-grid-mini">
                {selectedRegion.products.slice(0, 6).map((product) => (
                  <Link 
                    key={product._id} 
                    to={`/products/${product._id}`}
                    className="product-mini-card"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <h4>{product.name}</h4>
                    <p className="product-gi">{product.gi_tag}</p>
                    {product.price && <p className="product-price-mini">₹{product.price.toLocaleString()}</p>}
                  </Link>
                ))}
              </div>
              {selectedRegion.products.length > 6 && (
                <Link to={`/products?region=${encodeURIComponent(selectedRegion.region)}`} className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  View All {selectedRegion.count} Products
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapView;
