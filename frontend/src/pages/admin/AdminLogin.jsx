import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function AdminLogin() {
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('All fields are required.'); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/admin/login`, { email, password });
            localStorage.setItem('hopehug_admin_token', res.data.token);
            localStorage.setItem('hopehug_admin_user', JSON.stringify(res.data.user));
            navigate('/rohitadmin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials or insufficient permissions.');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !confirmPassword) { setError('All fields are required.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/admin/register`, { name, email, password });
            localStorage.setItem('hopehug_admin_token', res.data.token);
            localStorage.setItem('hopehug_admin_user', JSON.stringify(res.data.user));
            navigate('/rohitadmin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally { setLoading(false); }
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px', borderRadius: '10px',
        border: '1px solid #2a2a2a', background: '#111', color: '#fff',
        fontSize: '14px', fontFamily: "'Inter', sans-serif",
        transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
    };

    const labelStyle = {
        display: 'block', fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '11px', color: '#888', marginBottom: '8px',
        textTransform: 'uppercase', letterSpacing: '1px',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#080808',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
        }}>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(rgba(192,57,43,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(192,57,43,0.03) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            <div style={{
                position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 70%)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }} />

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '0 20px' }}>
                <div className="admin-login-card" style={{
                    background: 'rgba(22,22,22,0.95)', borderRadius: '16px',
                    padding: '44px 40px', border: '1px solid rgba(192,57,43,0.15)',
                    boxShadow: '0 0 80px rgba(192,57,43,0.05), 0 24px 48px rgba(0,0,0,0.5)',
                }}>
                    <style>{`
                        @keyframes borderPulse {
                            0%, 100% { border-color: rgba(192,57,43,0.15); box-shadow: 0 0 80px rgba(192,57,43,0.05); }
                            50% { border-color: rgba(192,57,43,0.35); box-shadow: 0 0 80px rgba(192,57,43,0.12); }
                        }
                        .admin-login-card { animation: borderPulse 4s ease-in-out infinite; }
                        .admin-input:focus { border-color: #C0392B !important; box-shadow: 0 0 0 3px rgba(192,57,43,0.15); }
                        .admin-btn:hover { background: #a93226 !important; transform: translateY(-1px); }
                        .admin-btn:active { transform: translateY(0); }
                    `}</style>

                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: '24px',
                        }}>🛡️</div>
                        <h1 style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: '20px',
                            fontWeight: 700, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.3px',
                        }}>HopeHug Admin Portal</h1>
                        <p style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px',
                            color: '#666', margin: 0, letterSpacing: '2px', textTransform: 'uppercase',
                        }}>Restricted Access</p>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#111', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => { setMode('login'); setError(''); }} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
                            background: mode === 'login' ? '#C0392B' : 'transparent',
                            color: mode === 'login' ? '#fff' : '#666', transition: 'all 0.2s',
                        }}>Sign In</button>
                        <button onClick={() => { setMode('register'); setError(''); }} style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
                            background: mode === 'register' ? '#C0392B' : 'transparent',
                            color: mode === 'register' ? '#fff' : '#666', transition: 'all 0.2s',
                        }}>Create Account</button>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)',
                            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                            color: '#e74c3c', fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace",
                        }}>⚠ {error}</div>
                    )}

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@hopehug.com" className="admin-input" style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '28px' }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPass ? 'text' : 'password'} value={password}
                                        onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                                        className="admin-input" style={{ ...inputStyle, paddingRight: '48px' }} />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px',
                                    }}>{showPass ? '🙈' : '👁'}</button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="admin-btn" style={{
                                width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                                background: '#C0392B', color: '#fff', fontSize: '14px', fontWeight: 600,
                                fontFamily: "'IBM Plex Mono', monospace", cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1, transition: 'all 0.2s', letterSpacing: '0.5px',
                            }}>{loading ? '◌ Authenticating...' : '→ Access Dashboard'}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name" className="admin-input" style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@hopehug.com" className="admin-input" style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPass ? 'text' : 'password'} value={password}
                                        onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                                        className="admin-input" style={{ ...inputStyle, paddingRight: '48px' }} />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px',
                                    }}>{showPass ? '🙈' : '👁'}</button>
                                </div>
                                {password && (
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} style={{
                                                flex: 1, height: '3px', borderRadius: '2px',
                                                background: password.length >= i * 3 ? (password.length >= 9 ? '#2ecc71' : password.length >= 6 ? '#f1c40f' : '#e74c3c') : '#222',
                                                transition: 'background 0.3s',
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={labelStyle}>Confirm Password</label>
                                <input type="password" value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password"
                                    className="admin-input" style={inputStyle} />
                                {confirmPassword && password !== confirmPassword && (
                                    <p style={{ color: '#e74c3c', fontSize: '11px', margin: '6px 0 0', fontFamily: "'IBM Plex Mono', monospace" }}>Passwords don't match</p>
                                )}
                            </div>
                            <button type="submit" disabled={loading} className="admin-btn" style={{
                                width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                                background: '#C0392B', color: '#fff', fontSize: '14px', fontWeight: 600,
                                fontFamily: "'IBM Plex Mono', monospace", cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1, transition: 'all 0.2s', letterSpacing: '0.5px',
                            }}>{loading ? '◌ Creating Account...' : '→ Create Admin Account'}</button>
                        </form>
                    )}

                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
                        <p style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px',
                            color: '#444', margin: 0, letterSpacing: '0.5px',
                        }}>🔒 Secured connection · Admin only</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
