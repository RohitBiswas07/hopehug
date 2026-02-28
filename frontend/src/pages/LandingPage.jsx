import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const handleDonateClick = (causeId, user, navigate) => {
    if (user && user.role === 'donor') {
        navigate(`/donate/${causeId}`);
    } else {
        localStorage.setItem('redirectAfterLogin', `/donate/${causeId}`);
        navigate('/login');
    }
};

const AnimatedCounter = ({ target, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || !target) return;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [inView, target]);

    return (
        <span ref={ref}>
            {prefix}{count.toLocaleString('en-IN')}{suffix}
        </span>
    );
};

const FloatingHeart = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
        >
            <div className="relative">
                <svg width="320" height="300" viewBox="0 0 320 300" fill="none">
                    <defs>
                        <radialGradient id="heartGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#F5C842" stopOpacity="0.9" />
                            <stop offset="60%" stopColor="#d4a825" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#0A0F2C" stopOpacity="0" />
                        </radialGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <path
                        d="M160 270 C160 270 30 190 30 110 C30 70 60 40 100 40 C125 40 148 55 160 75 C172 55 195 40 220 40 C260 40 290 70 290 110 C290 190 160 270 160 270Z"
                        fill="url(#heartGrad)"
                        filter="url(#glow)"
                    />
                    <path
                        d="M160 250 C160 250 50 178 50 108 C50 76 74 52 104 52 C127 52 148 66 160 84 C172 66 193 52 216 52 C246 52 270 76 270 108 C270 178 160 250 160 250Z"
                        fill="#F5C842"
                        opacity="0.3"
                    />
                </svg>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ top: '-30px' }}
                >
                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                        <div
                            key={deg}
                            className="absolute w-2 h-2 bg-gold rounded-full opacity-60"
                            style={{
                                transform: `rotate(${deg}deg) translateX(140px)`,
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </motion.div>
        <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                        left: `${15 + i * 20}%`,
                        top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                    }}
                >
                    {i % 2 === 0 ? '✨' : '💛'}
                </motion.div>
            ))}
        </div>
    </div>
);

const GradientPlaceholder = ({ title }) => {
    const initials = title?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'HH';
    const gradients = [
        'linear-gradient(135deg, #1a2456 0%, #2d3a8c 50%, #0f1a3d 100%)',
        'linear-gradient(135deg, #1e3a6e 0%, #2a5298 50%, #0d2149 100%)',
        'linear-gradient(135deg, #2d1b4e 0%, #5b3b8c 50%, #1a0e2e 100%)',
    ];
    const idx = (title?.charCodeAt(0) || 0) % gradients.length;
    return (
        <div
            className="h-48 flex items-center justify-center"
            style={{ background: gradients[idx] }}
        >
            <div className="w-20 h-20 rounded-full glass-gold flex items-center justify-center">
                <span className="text-gold font-display font-bold text-2xl">{initials}</span>
            </div>
        </div>
    );
};

const CauseCard = ({ cause }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const pct = Math.min(100, Math.round((cause.currentAmount / cause.goalAmount) * 100));

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(245,200,66,0.18)' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden glass border border-white/10 hover:border-gold/30 transition-all duration-300"
        >
            {cause.images && cause.images[0] ? (
                <img src={`http://localhost:5000${cause.images[0]}`} alt={cause.title} className="w-full h-48 object-cover" />
            ) : (
                <GradientPlaceholder title={cause.title} />
            )}
            <div className="p-6">
                <h3 className="font-display text-xl font-bold text-white mb-2">{cause.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{cause.description}</p>
                <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gold font-semibold">₹{cause.currentAmount?.toLocaleString('en-IN')} raised</span>
                        <span className="text-gray-400">of ₹{cause.goalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.2 }}
                            className="h-full progress-bar"
                        />
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">{pct}% funded</p>
                </div>
                {cause.fundedBy && (
                    <p className="text-gold/80 text-xs font-medium mb-3">
                        Funded by: <span className="text-gold font-semibold">{cause.fundedBy}</span>
                    </p>
                )}
                <button
                    onClick={() => handleDonateClick(cause._id, user, navigate)}
                    className="btn-primary w-full text-center mt-2"
                >
                    Donate Now
                </button>
            </div>
        </motion.div>
    );
};

const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden glass border border-white/10">
        <div className="h-48 shimmer" />
        <div className="p-6 space-y-3">
            <div className="h-5 shimmer rounded w-3/4" />
            <div className="h-4 shimmer rounded w-full" />
            <div className="h-4 shimmer rounded w-2/3" />
            <div className="h-2 shimmer rounded-full" />
            <div className="h-10 shimmer rounded-full mt-4" />
        </div>
    </div>
);

const StatSkeleton = () => (
    <div className="glass-gold rounded-2xl p-8 text-center">
        <div className="w-12 h-12 shimmer rounded-full mx-auto mb-3" />
        <div className="w-24 h-10 shimmer rounded mx-auto mb-2" />
        <div className="w-20 h-4 shimmer rounded mx-auto mb-1" />
        <div className="w-16 h-3 shimmer rounded mx-auto" />
    </div>
);

export default function LandingPage() {
    const [causes, setCauses] = useState([]);
    const [stats, setStats] = useState({ totalRaised: 0, totalDonors: 0, activeCauses: 0 });
    const [recentDonations, setRecentDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const scrollToCauses = () => {
        const el = document.getElementById('causes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const timeAgo = (date) => {
        const d = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (d < 60) return 'just now';
        if (d < 3600) return `${Math.floor(d / 60)}m ago`;
        if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
        return `${Math.floor(d / 86400)}d ago`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [causesRes, statsRes, recentRes] = await Promise.all([
                    axios.get(`${API_BASE}/cause`),
                    axios.get(`${API_BASE}/stats`),
                    axios.get(`${API_BASE}/donation/recent`),
                ]);
                setCauses(causesRes.data.slice(0, 6));
                setStats(statsRes.data);
                setRecentDonations(recentRes.data);
            } catch { }
            setLoading(false);
            setStatsLoading(false);
        };
        fetchData();

        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = () => {
        if (!user) {
            return (
                <>
                    {['Home', 'Causes', 'About'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium"
                        >
                            {item}
                        </a>
                    ))}
                    <Link to="/login" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">
                        Login
                    </Link>
                </>
            );
        }
        if (user.role === 'admin') {
            return (
                <>
                    <a href="#home" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">Home</a>
                    <Link to="/dashboard/admin" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">Admin Panel</Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="text-gray-300 hover:text-red-400 transition-colors duration-200 font-medium">Logout</button>
                </>
            );
        }
        if (user.role === 'ngo') {
            return (
                <>
                    <a href="#home" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">Home</a>
                    <Link to="/dashboard/ngo" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">NGO Panel</Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="text-gray-300 hover:text-red-400 transition-colors duration-200 font-medium">Logout</button>
                </>
            );
        }
        return (
            <>
                {['Home', 'Causes'].map((item) => (
                    <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium"
                    >
                        {item}
                    </a>
                ))}
                <Link to="/dashboard/donor" className="text-gray-300 hover:text-gold transition-colors duration-200 font-medium">My Dashboard</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="text-gray-300 hover:text-red-400 transition-colors duration-200 font-medium">Logout</button>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-navy font-body">
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
                    }`}
                style={{ backdropFilter: scrolled ? 'blur(12px)' : 'none' }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-3xl">❤️</span>
                        <span className="font-display text-2xl font-bold text-gold">HopeHug</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks()}
                    </div>
                    {!user ? (
                        <Link to="/register">
                            <button className="btn-primary text-sm px-6 py-3">Get Started</button>
                        </Link>
                    ) : (
                        <button
                            className="btn-primary text-sm px-6 py-3"
                            onClick={() => {
                                if (user.role === 'admin') navigate('/dashboard/admin');
                                else if (user.role === 'ngo') navigate('/dashboard/ngo');
                                else navigate('/dashboard/donor');
                            }}
                        >
                            Dashboard
                        </button>
                    )}
                </div>
            </nav>

            <section id="home" className="min-h-screen flex items-center relative overflow-hidden pt-20">
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5C842' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at 70% 50%, rgba(245,200,66,0.08) 0%, transparent 60%)',
                    }}
                />
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4 px-4 py-2 glass-gold rounded-full">
                            ✦ Mitali Foundation
                        </span>
                        <h1 className="font-display text-5xl lg:text-7xl font-black text-white leading-tight mb-6">
                            Give Hope.{' '}
                            <span className="text-gradient">Create Change.</span>{' '}
                            Transform Lives.
                        </h1>
                        <p className="text-gray-300 text-xl leading-relaxed mb-10 max-w-xl">
                            HopeHug connects donors with verified NGOs through 100% transparent donations.
                            Every rupee counts, every story matters.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-primary text-lg px-8 py-4"
                                onClick={scrollToCauses}
                            >
                                🚀 Start Donating
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={scrollToCauses}
                                className="btn-outline text-lg px-8 py-4"
                            >
                                See Causes →
                            </motion.button>
                        </div>
                        <div className="mt-10 flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {['👩', '👨', '👧', '👦'].map((e, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full glass border-2 border-gold/40 flex items-center justify-center text-lg">
                                        {e}
                                    </div>
                                ))}
                            </div>
                            <p className="text-gray-400 text-sm">
                                <span className="text-gold font-bold">{stats.totalDonors || 0}+</span> donors have already joined
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-96 lg:h-[500px]"
                    >
                        <FloatingHeart />
                    </motion.div>
                </div>
            </section>

            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {statsLoading ? (
                            [1, 2, 3].map((i) => <StatSkeleton key={i} />)
                        ) : (
                            [
                                { icon: '💰', value: stats.totalRaised, prefix: '₹', suffix: '+', label: 'Total Raised', sub: 'Verified donations' },
                                { icon: '❤️', value: stats.totalDonors, suffix: '+', label: 'Generous Donors', sub: 'Across India' },
                                { icon: '🌍', value: stats.activeCauses, label: 'Active Causes', sub: 'Seeking help now' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                    className="glass-gold rounded-2xl p-8 text-center card-hover"
                                >
                                    <div className="text-4xl mb-3">{stat.icon}</div>
                                    <div className="text-4xl font-display font-black text-gold mb-1">
                                        <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix || ''} />
                                    </div>
                                    <div className="text-white font-semibold text-lg">{stat.label}</div>
                                    <div className="text-gray-400 text-sm mt-1">{stat.sub}</div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <section id="causes" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <span className="text-gold text-sm font-semibold tracking-widest uppercase">Make a Difference</span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
                            Causes Seeking <span className="text-gradient">Your Help</span>
                        </h2>
                        <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loading
                            ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
                            : causes.length > 0
                                ? causes.map((cause) => <CauseCard key={cause._id} cause={cause} />)
                                : (
                                    <div className="col-span-3 text-center py-16">
                                        <div className="text-6xl mb-4">🌟</div>
                                        <p className="text-gray-400 text-lg">No active causes yet. Check back soon!</p>
                                    </div>
                                )
                        }
                    </div>
                    {causes.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mt-10"
                        >
                            <button onClick={() => navigate('#causes')} className="btn-outline px-10 py-4 text-lg">View All Causes</button>
                        </motion.div>
                    )}
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <span className="text-gold text-sm font-semibold tracking-widest uppercase">Transparency</span>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3 mb-4">
                            Recent <span className="text-gradient">Donations</span>
                        </h2>
                        <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
                    </motion.div>
                    {recentDonations.length > 0 ? (
                        <div className="space-y-4">
                            {recentDonations.map((d, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass border border-white/10 rounded-xl px-6 py-4 flex items-center justify-between hover:border-gold/30 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 glass-gold rounded-full flex items-center justify-center text-gold font-bold text-sm">
                                            {d.donorName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{d.donorName}</p>
                                            <p className="text-gray-500 text-xs">{d.causeName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gold font-display font-bold text-lg">₹{d.amount?.toLocaleString('en-IN')}</p>
                                        <p className="text-gray-500 text-xs">{timeAgo(d.date)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No donations yet. Be the first!</p>
                    )}
                </div>
            </section>

            <section id="about" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
                            How <span className="text-gradient">HopeHug</span> Works
                        </h2>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">Simple, transparent, and impactful.</p>
                    </motion.div>
                    <div className="relative">
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-gold/30" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {[
                                { num: '01', icon: '💳', title: 'Donate Securely', desc: 'Scan our UPI QR code, pay the exact amount, and upload your payment screenshot as proof.' },
                                { num: '02', icon: '🔍', title: 'Admin Verifies', desc: 'Our dedicated team reviews your payment proof and verifies it within 24 hours.' },
                                { num: '03', icon: '📊', title: '100% Transparent', desc: 'Track every rupee. NGOs post updates, photos, and bills showing exactly how funds are used.' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="text-center"
                                >
                                    <div className="relative inline-block mb-6">
                                        <div className="w-24 h-24 glass-gold rounded-full flex items-center justify-center text-4xl mx-auto pulse-gold">
                                            {step.icon}
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-navy text-xs font-black">
                                            {step.num}
                                        </div>
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass-gold rounded-3xl p-12 text-center"
                    >
                        <div className="text-5xl mb-4">🙏</div>
                        <h2 className="font-display text-4xl font-bold text-white mb-4">
                            Ready to Make a Difference?
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                            Join thousands of compassionate donors who are changing lives every day.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {!user ? (
                                <>
                                    <Link to="/register">
                                        <motion.button whileHover={{ scale: 1.05 }} className="btn-primary text-lg px-10 py-4">
                                            Join HopeHug Today
                                        </motion.button>
                                    </Link>
                                    <Link to="/login">
                                        <motion.button whileHover={{ scale: 1.05 }} className="btn-outline text-lg px-10 py-4">
                                            Already a member? Login
                                        </motion.button>
                                    </Link>
                                </>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    className="btn-primary text-lg px-10 py-4"
                                    onClick={() => {
                                        if (user.role === 'admin') navigate('/dashboard/admin');
                                        else if (user.role === 'ngo') navigate('/dashboard/ngo');
                                        else navigate('/dashboard/donor');
                                    }}
                                >
                                    Go to Dashboard
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="border-t border-white/10 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-3xl">❤️</span>
                                <span className="font-display text-2xl font-bold text-gold">HopeHug</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                                A transparent donation platform by Mitali Foundation. Every donation is tracked, verified, and reported.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    placeholder="Stay updated — enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-l-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 text-sm"
                                />
                                <button
                                    className={`btn-primary rounded-r-full rounded-l-none px-6 py-3 text-sm whitespace-nowrap ${subscribed ? 'bg-green-500 text-white border-green-500' : ''}`}
                                    disabled={subscribed || !email}
                                    onClick={async () => {
                                        if (email && email.includes('@')) {
                                            try {
                                                await axios.post(`${API_BASE}/subscribe`, { email });
                                                setSubscribed(true);
                                                setEmail('');
                                            } catch (err) {
                                                alert('Failed to subscribe or already subscribed.');
                                            }
                                        } else {
                                            alert('Please enter a valid email.');
                                        }
                                    }}
                                >
                                    {subscribed ? 'Subscribed ✓' : 'Subscribe'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                {[['Home', '/'], ['Causes', '#causes'], ['Login', '/login'], ['Register', '/register']].map(([link, path]) => (
                                    <li key={link}>
                                        <Link to={path} className="hover:text-gold transition-colors duration-200">{link}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Connect</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                {['📧 rbrohitbiswas07@gmail.com', '📞 +91 8700450195', '📍 Delhi, India', '🌐 https://hopehug.vercel.app/'].map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                            <div className="flex gap-3 mt-4">
                                {['🐦', '📘', '📸', '▶️'].map((icon, i) => (
                                    <div key={i} className="w-9 h-9 glass rounded-full flex items-center justify-center hover:border-gold/50 hover:text-gold cursor-pointer transition-all">
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 text-center">
                        <p className="text-gold font-semibold font-display text-lg mb-1">HopeHug | Powered by Mitali Foundation</p>
                        <p className="text-gray-500 text-sm">© 2025 HopeHug. All rights reserved. Making giving transparent.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
