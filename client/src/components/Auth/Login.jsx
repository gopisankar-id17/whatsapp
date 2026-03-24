import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd]   = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.email.trim()) return 'Email is required';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) return 'Enter a valid email';

    if (!isLogin) {
      if (!form.name.trim()) return 'Name is required';
      if (form.password.length < 6) return 'Password must be at least 6 characters';
    }

    if (!form.password) return 'Password is required';
    return '';
  };

  const mapError = (err) => {
    const msg = err?.response?.data?.error || err?.message || '';
    if (err?.response?.status === 401) return 'Invalid email or password';
    if (err?.response?.status === 409) return 'Email already registered';
    if (/Invalid login credentials/i.test(msg)) return 'Invalid email or password';
    return msg || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(form.email.trim(), form.password);
      } else {
        await register(form.name.trim(), form.email.trim(), form.password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <path d="M32 6C17.64 6 6 17.64 6 32c0 4.84 1.32 9.38 3.63 13.26L6 58l13.08-3.42A25.85 25.85 0 0 0 32 58c14.36 0 26-11.64 26-26S46.36 6 32 6z" fill="#fff"/>
              <path d="M44.5 37.86c-.68-.34-4.02-1.98-4.64-2.2-.62-.23-1.07-.34-1.52.34-.45.68-1.75 2.2-2.14 2.65-.4.45-.79.51-1.47.17-4.02-2.01-6.66-3.59-9.31-8.14-.7-1.21.7-1.12 2-3.74.23-.45.11-.85-.06-1.19-.17-.34-1.52-3.66-2.08-5.01-.55-1.31-1.11-1.13-1.52-1.15-.4-.02-.85-.02-1.3-.02-.45 0-1.19.17-1.81.85-.62.68-2.37 2.31-2.37 5.63 0 3.32 2.43 6.52 2.77 6.97.34.45 4.77 7.28 11.56 10.22 4.3 1.86 5.98 2.02 8.13 1.7 1.31-.19 4.02-1.64 4.59-3.23.56-1.58.56-2.93.39-3.22-.17-.28-.62-.45-1.3-.79z" fill="#008069"/>
            </svg>
          </div>
          <h1 style={styles.appName}>WhatsApp</h1>
          <p style={styles.tagline}>
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.fieldWrap}>
              <label style={styles.label}>Your name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                required={!isLogin}
                autoComplete="name"
              />
            </div>
          )}

          <div style={styles.fieldWrap}>
            <label style={styles.label}>Email address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldWrap}>
            <label style={styles.label}>Password</label>
            <div style={styles.pwdWrap}>
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                value={form.password}
                onChange={handleChange}
                style={styles.input}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={styles.pwdToggle}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Toggle */}
        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={styles.toggleLink}
            onClick={() => { setIsLogin(!isLogin); setError(''); setForm({ name: '', email: '', password: '' }); }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111b21',
    padding: '20px',
    fontFamily: "'Segoe UI', Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '4px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
    gap: '8px',
  },
  logoCircle: {
    width: '78px',
    height: '78px',
    borderRadius: '50%',
    background: '#00a884',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: '24px',
    fontWeight: '500',
    color: '#111b21',
    margin: 0,
    letterSpacing: 'normal',
  },
  tagline: {
    fontSize: '14px',
    color: '#667781',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#111b21',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '4px',
    border: '1px solid #cfd5db',
    fontSize: '15px',
    color: '#111b21',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  pwdWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pwdToggle: {
    position: 'absolute',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: '#00a884',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 6px',
    fontSize: '14px',
  },
  error: {
    fontSize: '13px',
    color: '#ea0038',
    background: '#fcebee',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    padding: '10px 14px',
    margin: 0,
  },
  btn: {
    padding: '14px',
    borderRadius: '24px',
    background: '#00a884',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  toggle: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#667781',
    marginTop: '20px',
    marginBottom: 0,
  },
  toggleLink: {
    color: '#00a884',
    fontWeight: '500',
    cursor: 'pointer',
  },
};