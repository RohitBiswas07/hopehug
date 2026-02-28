import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const user = await login(email, password);
            const redirectPath = localStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else if (user.role === 'admin') navigate('/dashboard/admin');
            else if (user.role === 'ngo') navigate('/dashboard/ngo');
            else navigate('/dashboard/donor');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy flex font-body">
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0A0F2C 0%, #131b3e 100%)' }}>
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5C842' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <Link to="/" className="flex items-center gap-3 mb-16">
                    <span className="text-4xl">❤️</span>
                    <span className="font-display text-3xl font-bold text-gold">HopeHug</span>
                </Link>
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-10"
                >
                    <svg width="200" height="180" viewBox="0 0 200 180">
                        <defs>
                            <radialGradient id="hg" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#F5C842" stopOpacity="0.95" />
                                <stop offset="100%" stopColor="#d4a825" stopOpacity="0.5" />
                            </radialGradient>
                            <filter id="gl">
                                <feGaussianBlur stdDeviation="6" result="b" />
                                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        <path d="M100 165 C100 165 15 115 15 65 C15 40 35 22 60 22 C77 22 92 32 100 46 C108 32 123 22 140 22 C165 22 185 40 185 65 C185 115 100 165 100 165Z"
                            fill="url(#hg)" filter="url(#gl)" />
                    </svg>
                </motion.div>
                <blockquote className="text-center">
                    <p className="font-display text-3xl font-bold text-white leading-tight mb-4">
                        "Your generosity <span className="text-gold">changes lives.</span>"
                    </p>
                    <p className="text-gray-400 text-lg">Every donation you make teaches hope.</p>
                </blockquote>
                <div className="mt-12 flex gap-8 text-center">
                    {[['3,240+', 'Donors'], ['₹12L+', 'Raised'], ['48', 'Causes']].map(([v, l]) => (
                        <div key={l}>
                            <div className="text-gold text-2xl font-bold font-display">{v}</div>
                            <div className="text-gray-400 text-sm">{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <span className="text-3xl">❤️</span>
                        <span className="font-display text-2xl font-bold text-gold">HopeHug</span>
                    </div>
                    <div className="glass rounded-2xl p-8 md:p-10">
                        <h1 className="font-display text-3xl font-bold text-gold mb-2">Welcome Back</h1>
                        <p className="text-gray-400 mb-8">Sign in to your HopeHug account</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl text-red-300 text-sm"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="login-email">
                                    Email Address
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="login-password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="login-password"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 pr-12"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                        }}
                                        onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                        onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors text-xl"
                                    >
                                        {showPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4 text-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                                        Signing in...
                                    </span>
                                ) : 'Sign In →'}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-400">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-gold font-semibold hover:underline">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 text-xs mt-6">
                        <Link to="/" className="hover:text-gold transition-colors">← Back to HopeHug</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
