import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { authStorage } from '../utils/auth';

interface LoginProps {
  initialMode?: 'login' | 'register';
}

const CraftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="login-brand-icon">
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

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="password-toggle-icon">
    <path
      d="M2 12C4.8 7.6 8 5.4 12 5.4S19.2 7.6 22 12c-2.8 4.4-6 6.6-10 6.6S4.8 16.4 2 12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    {!open && <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
  </svg>
);

const Login: React.FC<LoginProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    resetMessages();
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'register') {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (mode === 'register') {
        const result = authStorage.register(trimmedEmail, formData.password);

        if (!result.success) {
          setError(result.message);
          return;
        }

        setSuccess(result.message);
        setMode('login');
        setFormData({
          email: trimmedEmail.toLowerCase(),
          password: '',
          confirmPassword: '',
        });
        return;
      }

      const result = authStorage.login(trimmedEmail, formData.password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath, { replace: true });
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <CraftIcon />
          </div>
          <h1>Heritage Atlas</h1>
        </div>

        <div className="auth-switch">
          <button
            type="button"
            className={`auth-switch-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-switch-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? mode === 'login'
                ? 'Logging in...'
                : 'Creating account...'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>

          <div className="login-footer">
            {mode === 'login' ? (
              <p>
                Need an account? <Link to="/register" onClick={() => switchMode('register')}>Register here</Link>
              </p>
            ) : (
              <p>
                Already registered? <Link to="/login" onClick={() => switchMode('login')}>Login here</Link>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
