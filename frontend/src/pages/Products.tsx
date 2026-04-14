import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SaveProductButton from '../components/SaveProductButton';
import { Category, getApiErrorMessage, ProductQueryParams, productService, Product } from '../services/api';
import { getProductDisplayImage, getProductFallbackImage } from '../utils/productImages';
import { wishlistStorage } from '../utils/wishlist';
import { cartStorage } from '../utils/cart';
import './Products.css';

const ProductCardImage: React.FC<{ product: Product }> = ({ product }) => {
  const fallbackImage = getProductFallbackImage(product);
  const [imageSrc, setImageSrc] = useState(getProductDisplayImage(product));

  useEffect(() => {
    setImageSrc(getProductDisplayImage(product));
  }, [product]);

  return (
    <img
      src={imageSrc}
      alt={product.name}
      className="product-image"
      loading="lazy"
      onError={() => setImageSrc(fallbackImage)}
    />
  );
};

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [giTags, setGITags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(wishlistStorage.getAll());
  const [cartIds, setCartIds] = useState<string[]>(cartStorage.getAll().map((item) => item.productId));
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    region: searchParams.get('region') || '',
    gi_tag: searchParams.get('gi_tag') || '',
    artisan_name: searchParams.get('artisan_name') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort_by: searchParams.get('sort_by') || 'newest',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const syncSavedIds = () => setSavedIds(wishlistStorage.getAll());
    window.addEventListener('wishlist-updated', syncSavedIds);
    return () => window.removeEventListener('wishlist-updated', syncSavedIds);
  }, []);

  useEffect(() => {
    const syncCartIds = () => setCartIds(cartStorage.getAll().map((item) => item.productId));
    window.addEventListener('cart-updated', syncCartIds);
    return () => window.removeEventListener('cart-updated', syncCartIds);
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams: ProductQueryParams = {
          ...deferredFilters,
          sort_by: deferredFilters.sort_by as ProductQueryParams['sort_by'],
          sort_order: deferredFilters.sort_order as ProductQueryParams['sort_order'],
          min_price: deferredFilters.min_price ? Number(deferredFilters.min_price) : undefined,
          max_price: deferredFilters.max_price ? Number(deferredFilters.max_price) : undefined,
        };

        const [productsRes, regionsRes, giTagsRes, categoriesRes] = await Promise.all([
          productService.getProducts(queryParams),
          productService.getRegions(),
          productService.getGITags(),
          productService.getCategories(),
        ]);

        setProducts(productsRes.products || []);
        setTotal(productsRes.total || 0);
        setRegions(regionsRes.regions?.map((r: { region: string }) => r.region) || []);
        setGITags(giTagsRes.gi_tags?.map((g: { gi_tag: string }) => g.gi_tag) || []);
        setCategories(categoriesRes.categories || []);
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load products.'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deferredFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      region: '',
      gi_tag: '',
      artisan_name: '',
      category: '',
      min_price: '',
      max_price: '',
      sort_by: 'newest',
      sort_order: 'desc',
    });
  };

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (!value) {
          return false;
        }
        if (key === 'sort_by' && value === 'newest') {
          return false;
        }
        if (key === 'sort_order' && value === 'desc') {
          return false;
        }
        return true;
      }).length,
    [filters]
  );

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="products-page">
      <div className="products-page-header">
        <div>
          <h1>Browse Products</h1>
          <p>Search by craft, region, artisan, or story, then save favorites or move straight into the online purchase flow.</p>
        </div>
        <div className="products-header-actions">
          <Link to="/saved" className="btn btn-secondary">
            Saved Products ({savedIds.length})
          </Link>
          <Link to="/cart" className="btn btn-primary">
            View Cart ({cartIds.length})
          </Link>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group filter-group-wide">
          <label>Keyword Search</label>
          <input
            type="text"
            placeholder="Search products, stories, materials, GI tags..."
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Region</label>
          <select value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
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
          <select value={filters.gi_tag} onChange={(e) => handleFilterChange('gi_tag', e.target.value)}>
            <option value="">All GI Tags</option>
            {giTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.category} value={category.category}>
                {category.category}
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

        <div className="filter-group">
          <label>Min Price</label>
          <input
            type="number"
            min="0"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="filter-group">
          <label>Max Price</label>
          <input
            type="number"
            min="0"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            placeholder="10000"
          />
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={filters.sort_by} onChange={(e) => handleFilterChange('sort_by', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price">Price</option>
            <option value="name">Name</option>
            <option value="region">Region</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort Order</label>
          <select value={filters.sort_order} onChange={(e) => handleFilterChange('sort_order', e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="filter-actions">
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="results-summary">
        <span>{total} products found</span>
        <span>{activeFilterCount} active filters</span>
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
          {products.map((product) => {
            const isSaved = savedIds.includes(product._id || '');
            const isInCart = cartIds.includes(product._id || '');

            return (
              <article key={product._id} className="card product-card">
                <div className="product-card-actions">
                  <SaveProductButton
                    saved={isSaved}
                    className={`save-product-button ${isSaved ? 'is-saved' : ''}`}
                    onToggle={() => {
                      wishlistStorage.toggle(product._id);
                      setSavedIds(wishlistStorage.getAll());
                    }}
                  />
                </div>
                <Link to={`/products/${product._id}`} className="product-card-link">
                  <ProductCardImage product={product} />
                  <div className="product-card-content">
                    <div className="product-card-copy">
                      <h3>{product.name}</h3>
                      <p className="product-region">Region: {product.region}</p>
                      <p className="product-gi-tag">GI Tag: {product.gi_tag}</p>
                      <p className="product-artisan">
                        Artisan:{' '}
                        {product.artisan_slug ? (
                          <span className="product-artisan-link">{product.artisan_name}</span>
                        ) : (
                          product.artisan_name
                        )}
                      </p>
                      {product.category && <p className="product-category">{product.category}</p>}
                    </div>
                    {product.price !== undefined && product.price !== null && (
                      <p className="product-price">Rs. {product.price.toLocaleString()}</p>
                    )}
                  </div>
                </Link>
                <div className="product-purchase-actions">
                  <button
                    type="button"
                    className={`btn ${isInCart ? 'btn-secondary' : 'btn-primary'} product-cart-btn`}
                    onClick={() => {
                      cartStorage.add(product);
                      setCartIds(cartStorage.getAll().map((item) => item.productId));
                    }}
                  >
                    {isInCart ? 'Add One More' : 'Add to Cart'}
                  </button>
                  <Link
                    to="/cart"
                    className="btn btn-secondary product-buy-btn"
                    onClick={() => {
                      cartStorage.add(product);
                    }}
                  >
                    Buy Now
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
