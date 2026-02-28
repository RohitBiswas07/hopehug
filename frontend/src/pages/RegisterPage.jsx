import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor' });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const { name, email, password, role } = form;
        if (!name || !email || !password || !role) {
            setError('All fields are required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const user = await register(name, email, password, role);
            if (user.role === 'admin') navigate('/dashboard/admin');
            else if (user.role === 'ngo') navigate('/dashboard/ngo');
            else navigate('/dashboard/donor');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
    };

    return (
        <div className="min-h-screen bg-navy flex font-body">
            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0A0F2C 0%, #131b3e 100%)' }}>
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F5C842' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")` }} />
                <Link to="/" className="flex items-center gap-3 mb-12">
                    <span className="text-4xl">❤️</span>
                    <span className="font-display text-3xl font-bold text-gold">HopeHug</span>
                </Link>
                <div className="text-center mb-10">
                    <div className="text-8xl mb-4">🌟</div>
                    <p className="font-display text-3xl font-bold text-white leading-tight mb-4">
                        "Be the reason<br />someone <span className="text-gold">smiles today."</span>
                    </p>
                    <p className="text-gray-400 text-lg">Join over 3,240 generous donors.</p>
                </div>
                <div className="w-full max-w-xs space-y-4">
                    {[
                        { icon: '✅', text: 'Verified NGO partners only' },
                        { icon: '🔒', text: '100% secure UPI payments' },
                        { icon: '📊', text: 'Full donation transparency' },
                        { icon: '📧', text: 'Instant email confirmation' },
                    ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-3 glass-gold rounded-xl p-3 text-sm text-gray-300">
                            <span className="text-xl">{icon}</span> {text}
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
                        <h1 className="font-display text-3xl font-bold text-gold mb-2">Create Account</h1>
                        <p className="text-gray-400 mb-8">Join HopeHug and start making a difference</p>

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
                                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="reg-name">
                                    Full Name
                                </label>
                                <input
                                    id="reg-name"
                                    type="text"
                                    name="name"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="reg-email">
                                    Email Address
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="reg-password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPass ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Min. 6 characters"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 pr-12"
                                        style={inputStyle}
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
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    I am a...
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'donor', label: '💝 Donor', desc: 'I want to donate' },
                                        { value: 'ngo', label: '🏢 NGO', desc: 'We need funding' },
                                    ].map(({ value, label, desc }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setForm({ ...form, role: value })}
                                            className={`p-4 rounded-xl text-left transition-all duration-200 ${form.role === value
                                                    ? 'border-2 border-gold glass-gold text-white'
                                                    : 'border border-white/10 text-gray-400 hover:border-gold/40'
                                                }`}
                                            style={{ background: form.role === value ? 'rgba(245,200,66,0.1)' : 'rgba(255,255,255,0.03)' }}
                                        >
                                            <div className="font-semibold text-sm">{label}</div>
                                            <div className="text-xs mt-1 opacity-70">{desc}</div>
                                        </button>
                                    ))}
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
                                        Creating account...
                                    </span>
                                ) : 'Create My Account 🚀'}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-400">
                                Already have an account?{' '}
                                <Link to="/login" className="text-gold font-semibold hover:underline">
                                    Sign In
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
