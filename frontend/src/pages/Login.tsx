import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { authStorage } from '../utils/auth';

interface LoginProps {
  initialMode?: 'login' | 'register';
}

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
          <div className="login-logo">HA</div>
          <h1>Heritage Atlas</h1>
          <p>
            {mode === 'login'
              ? 'Welcome back! Please login with your registered details.'
              : 'Create your account, then login with the same email and password.'}
          </p>
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
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
