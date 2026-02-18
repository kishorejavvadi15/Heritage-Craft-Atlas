import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import './UploadProduct.css';

const UploadProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [giTags, setGITags] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gi_tag: '',
    region: '',
    artisan_name: '',
    artisan_contact: '',
    price: '',
    category: '',
    image_url: '',
    barcode: '',
    latitude: '',
    longitude: '',
    cultural_story: '',
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [regionsRes, giTagsRes] = await Promise.all([
          productService.getRegions(),
          productService.getGITags(),
        ]);

        setRegions(regionsRes.regions?.map((r: any) => r.region) || []);
        setGITags(giTagsRes.gi_tags?.map((g: any) => g.gi_tag) || []);
      } catch (err) {
        console.error('Failed to load options:', err);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          submitData.append(key, value.toString());
        }
      });

      const response = await productService.createProduct(submitData);
      if (response.success) {
        setSuccess(true);
        // Clear form after successful upload
        setFormData({
          name: '',
          description: '',
          gi_tag: '',
          region: '',
          artisan_name: '',
          artisan_contact: '',
          price: '',
          category: '',
          image_url: '',
          barcode: '',
          latitude: '',
          longitude: '',
          cultural_story: '',
        });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload product. Please check all required fields.');
      setLoading(false);
    }
  };

  return (
    <div className="upload-product">
      <h1>Upload Product</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Share your traditional craft with the Heritage Atlas community
      </p>

      {success && (
        <div className="success-message">
          ✅ Product uploaded successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Kondapalli Bommalu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Traditional Craft"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Describe the product, its features, and significance..."
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gi_tag">GI Tag *</label>
            <input
              type="text"
              id="gi_tag"
              name="gi_tag"
              value={formData.gi_tag}
              onChange={handleChange}
              required
              placeholder="e.g., Kondapalli, Kalamkari"
              list="gi-tags-list"
            />
            <datalist id="gi-tags-list">
              {giTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="region">Region *</label>
            <input
              type="text"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
              placeholder="e.g., Andhra Pradesh"
              list="regions-list"
            />
            <datalist id="regions-list">
              {regions.map((region) => (
                <option key={region} value={region} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="artisan_name">Artisan Name *</label>
            <input
              type="text"
              id="artisan_name"
              name="artisan_name"
              value={formData.artisan_name}
              onChange={handleChange}
              required
              placeholder="Name of the artisan"
            />
          </div>

          <div className="form-group">
            <label htmlFor="artisan_contact">Artisan Contact</label>
            <input
              type="text"
              id="artisan_contact"
              name="artisan_contact"
              value={formData.artisan_contact}
              onChange={handleChange}
              placeholder="Phone or email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="barcode">Barcode / Verification code (optional)</label>
          <input
            type="text"
            id="barcode"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            placeholder="Leave empty to auto-generate (e.g. HC-A1B2C3D4)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (₹)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url">Image URL</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="e.g., 17.3850"
              step="any"
            />
          </div>

          <div className="form-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="e.g., 78.4867"
              step="any"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cultural_story">Cultural Story</label>
          <textarea
            id="cultural_story"
            name="cultural_story"
            value={formData.cultural_story}
            onChange={handleChange}
            placeholder="Share the cultural significance, history, or tradition behind this craft..."
            rows={5}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Product'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadProduct;
