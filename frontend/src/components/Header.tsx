import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { wishlistStorage } from '../utils/wishlist';
import { authStorage } from '../utils/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = authStorage.getCurrentUserEmail();
  const [savedCount, setSavedCount] = useState(wishlistStorage.getAll().length);

  useEffect(() => {
    const syncSavedCount = () => setSavedCount(wishlistStorage.getAll().length);
    window.addEventListener('wishlist-updated', syncSavedCount);
    return () => window.removeEventListener('wishlist-updated', syncSavedCount);
  }, []);

  const handleLogout = () => {
    authStorage.logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">HA</span>
          <span className="logo-text">Heritage Atlas</span>
        </Link>
        <nav>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/artisans">Artisans</Link></li>
            <li><Link to="/map">Map View</Link></li>
            <li><Link to="/saved">Saved ({savedCount})</Link></li>
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
