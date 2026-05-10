import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCollegeAuth } from '../../context/CollegeAuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function CollegeLogin() {
  const navigate = useNavigate();
  const { login } = useCollegeAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/college/auth/login`, form, { withCredentials: true });
      login(data.accessToken, data.college);  // updates context state + localStorage
      toast.success(`Welcome, ${data.college.tpo?.name || data.college.name}!`);
      navigate(`/college/${data.college.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="college-login-page">
      {/* Background */}
      <div className="college-login-bg">
        <div className="college-login-blob blob-1" />
        <div className="college-login-blob blob-2" />
        <div className="college-login-blob blob-3" />
      </div>

      {/* Card */}
      <div className="college-login-card">
        {/* Header */}
        <div className="college-login-header">
          <div className="college-login-badge">
            <span>🎓</span>
          </div>
          <h1 className="college-login-title">College Portal</h1>
          <p className="college-login-subtitle">
            Sign in to access your dedicated campus hiring dashboard
          </p>
          <div className="college-login-pills">
            <span className="pill pill-sppu">SPPU</span>
            <span className="pill pill-mu">Mumbai University</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="college-login-form">
          <div className="college-form-group">
            <label htmlFor="college-email">TPO / College Email</label>
            <div className="college-input-wrap">
              <span className="college-input-icon">📧</span>
              <input
                id="college-email"
                type="email"
                placeholder="tpo@college.edu"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="college-form-group">
            <label htmlFor="college-password">Password</label>
            <div className="college-input-wrap">
              <span className="college-input-icon">🔒</span>
              <input
                id="college-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Your secure password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="college-pass-toggle"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="college-login-btn"
            disabled={loading}
            id="college-login-submit"
          >
            {loading ? (
              <span className="college-btn-spinner" />
            ) : (
              <>🎓 Sign In to Portal</>
            )}
          </button>
        </form>

        {/* Footer note */}
        <div className="college-login-footer">
          <p>Access is restricted to registered college TPO coordinators.</p>
          <p>Contact <strong>HireStorm Admin</strong> for credentials.</p>
        </div>

        {/* Supported colleges ticker */}
        <div className="college-supported">
          <span className="college-supported-label">Supported Colleges</span>
          <div className="college-ticker-wrap">
            <div className="college-ticker">
              {['PICT', 'COEP', 'VIT', 'SPIT', 'VJTI', 'DJ Sanghvi', 'MIT WPU', 'MIT ADT', 'MIT Alandi', 'DY Patil', 'VESIT', 'KJ Somaiya'].map(c => (
                <span key={c} className="college-ticker-item">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <a href="/login" className="college-back-link">← Back to Main Login</a>
    </div>
  );
}
