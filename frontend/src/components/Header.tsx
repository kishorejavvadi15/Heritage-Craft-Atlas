import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { wishlistStorage } from '../utils/wishlist';
import { authStorage } from '../utils/auth';
import { cartStorage } from '../utils/cart';

const CraftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="craft-brand-icon">
    <path
      d="M9 4.5c0 1 .8 1.8 1.8 1.8h2.4c1 0 1.8-.8 1.8-1.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 7c0 1.6 1.2 2.7 1.2 3.8 0 1-1.7 1.8-1.7 4.1 0 2.9 2 4.6 4.5 4.6s4.5-1.7 4.5-4.6c0-2.3-1.7-3.1-1.7-4.1C14.8 9.7 16 8.6 16 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8.8 14.4c1.8.9 4.6.9 6.4 0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = authStorage.getCurrentUserEmail();
  const isAdmin = authStorage.isAdmin();
  const [savedCount, setSavedCount] = useState(wishlistStorage.getAll().length);
  const [cartCount, setCartCount] = useState(cartStorage.getCount());

  useEffect(() => {
    const syncSavedCount = () => setSavedCount(wishlistStorage.getAll().length);
    window.addEventListener('wishlist-updated', syncSavedCount);
    return () => window.removeEventListener('wishlist-updated', syncSavedCount);
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(cartStorage.getCount());
    window.addEventListener('cart-updated', syncCartCount);
    return () => window.removeEventListener('cart-updated', syncCartCount);
  }, []);

  const handleLogout = () => {
    authStorage.logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">
            <CraftIcon />
          </span>
          <span className="logo-text">Heritage Atlas</span>
        </Link>
        <nav>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/artisans">Artisans</Link></li>
            <li><Link to="/map">Map View</Link></li>
            <li><Link to="/saved">Saved ({savedCount})</Link></li>
            <li><Link to="/cart">Cart ({cartCount})</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            {isAdmin && <li><Link to="/admin/orders">Admin Orders</Link></li>}
            <li><Link to="/verify">Verify Product</Link></li>
            <li><Link to="/upload">Upload Product</Link></li>
            <li><Link to="/about">About</Link></li>
            <li className="user-info">
              <span className="user-email">{userEmail}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
