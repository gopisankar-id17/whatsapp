import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

export default function Login() {
  const { login: doLogin, register } = useAuth();
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

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
        await doLogin(form.email.trim(), form.password);
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
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input:focus {
          border-color: #00a884 !important;
        }

        button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .left-panel {
            display: none !important;
          }
          .right-panel {
            flex: 1 !important;
          }
        }

        @media (max-width: 480px) {
          .auth-container {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .right-panel {
            padding: 40px 24px !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        {/* Background Pattern */}
        <div style={styles.bgPattern} />

        <div style={{...styles.container}} className="auth-container">
          {/* Left Panel - Branding */}
          <div style={styles.leftPanel} className="left-panel">
            <div style={styles.logoSection}>
              <div style={styles.logoCircle}>
                <img src={logo} alt="WhatsApp Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </div>
              <h1 style={styles.whatsappTitle}>WHATSAPP WEB</h1>
            </div>

            <div style={styles.features}>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={styles.featureTitle}>Message privately</h3>
                  <p style={styles.featureDesc}>Simple, reliable, private messaging</p>
                </div>
              </div>

              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <div>
                  <h3 style={styles.featureTitle}>Share moments</h3>
                  <p style={styles.featureDesc}>Send photos and videos instantly</p>
                </div>
              </div>

              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={styles.featureTitle}>End-to-end encrypted</h3>
                  <p style={styles.featureDesc}>Your personal messages are protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Auth Form */}
          <div style={styles.rightPanel} className="right-panel">
            <div style={styles.authCard}>
              <div style={styles.cardHeader}>
                <div style={styles.smallLogo}>
                  <img src={logo} alt="WhatsApp Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                </div>
                <h2 style={styles.authTitle}>
                  {isLogin ? 'Sign in to WhatsApp' : 'Create your account'}
                </h2>
                <p style={styles.authSubtitle}>
                  {isLogin
                    ? 'Enter your credentials to continue'
                    : 'Join millions of users worldwide'}
                </p>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                {!isLogin && (
                  <div style={styles.inputGroup}>
                    <input
                      name="name"
                      type="text"
                      placeholder="Full name"
                      value={form.name}
                      onChange={handleChange}
                      style={styles.input}
                      required={!isLogin}
                      autoComplete="name"
                    />
                    <div style={styles.inputIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    autoComplete="email"
                  />
                  <div style={styles.inputIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2"/>
                      <path d="m3 7 9 6 9-6"/>
                    </svg>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <input
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <div style={styles.inputIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={styles.pwdToggle}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {!isLogin && (
                  <p style={styles.hint}>Password must be at least 6 characters</p>
                )}

                {error && (
                  <div style={styles.errorBox}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <div style={styles.loader} />
                  ) : (
                    isLogin ? 'Sign in' : 'Create account'
                  )}
                </button>
              </form>

              <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>OR</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setForm({ name: '', email: '', password: '' });
                }}
                style={styles.switchBtn}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>

              <p style={styles.footer}>
                By signing {isLogin ? 'in' : 'up'}, you agree to our{' '}
                <span style={styles.link}>Terms</span> &{' '}
                <span style={styles.link}>Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, 'Lucida Grande', Arial, sans-serif",
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '220px',
    background: 'linear-gradient(135deg, #00a884 0%, #128C7E 100%)',
    zIndex: 0,
  },
  container: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    width: '90%',
    maxWidth: '1100px',
    minHeight: '600px',
    background: '#fff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: '1',
    background: 'linear-gradient(135deg, #2a2f32 0%, #111b21 100%)',
    padding: '60px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: '#fff',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  logoCircle: {
    width: '96px',
    height: '96px',
    margin: '0 auto 20px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  whatsappTitle: {
    fontSize: '28px',
    fontWeight: '300',
    letterSpacing: '2px',
    margin: 0,
    color: '#fff',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  feature: {
    display: 'flex',
    gap: '18px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '500',
    margin: '0 0 6px 0',
    color: '#fff',
  },
  featureDesc: {
    fontSize: '14px',
    margin: 0,
    color: '#8696a0',
    lineHeight: '1.5',
  },
  rightPanel: {
    flex: '1',
    padding: '60px 50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
  },
  authCard: {
    width: '100%',
    maxWidth: '380px',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  smallLogo: {
    width: '64px',
    height: '64px',
    margin: '0 auto 20px',
  },
  authTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111b21',
    margin: '0 0 8px 0',
  },
  authSubtitle: {
    fontSize: '14px',
    color: '#667781',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputGroup: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '14px 48px 14px 48px',
    fontSize: '15px',
    border: '1.5px solid #e9edef',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    color: '#111b21',
    background: '#fff',
    boxSizing: 'border-box',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  pwdToggle: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  hint: {
    fontSize: '12px',
    color: '#667781',
    margin: '-10px 0 0 0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#fff3f3',
    border: '1px solid #ffcdd2',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#c62828',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #25D366 0%, #20b858 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px',
  },
  loader: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '24px 0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e9edef',
  },
  dividerText: {
    fontSize: '13px',
    color: '#8696a0',
    fontWeight: '500',
  },
  switchBtn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#00a884',
    border: '1.5px solid #e9edef',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#8696a0',
    marginTop: '24px',
    lineHeight: '1.6',
  },
  link: {
    color: '#a82d00',
    cursor: 'pointer',
    textDecoration: 'none',
  },
};