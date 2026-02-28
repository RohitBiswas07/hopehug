import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    verified: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const StatusBadge = ({ status }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
);

const Skeleton = ({ className }) => <div className={`shimmer rounded-lg ${className}`} />;

const DonationTimeline = ({ donation }) => {
    const statuses = ['initiated', 'proof_submitted', 'verified', 'ngo_assigned', 'funds_utilized', 'work_completed'];
    const labels = ['Payment Initiated', 'Proof Submitted', 'Admin Verified', 'NGO Assigned', 'Funds Utilized', 'Work Completed'];

    const getStatus = (key) => {
        if (!donation) return 'pending';
        const found = donation.timeline?.find((t) => t.status === key);
        return found ? 'done' : 'pending';
    };

    return (
        <div className="space-y-0">
            {statuses.map((s, i) => {
                const done = getStatus(s) === 'done' || (donation?.status === 'verified' && i <= 2);
                return (
                    <div key={s} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'glass border border-white/20 text-gray-500'
                                }`}>
                                {done ? '✓' : '○'}
                            </div>
                            {i < statuses.length - 1 && (
                                <div className={`w-0.5 h-6 ${done ? 'bg-green-500/50' : 'bg-white/10'}`} />
                            )}
                        </div>
                        <div className="pb-1">
                            <p className={`text-sm font-medium ${done ? 'text-white' : 'text-gray-500'}`}>{labels[i]}</p>
                            {done && donation?.timeline?.find((t) => t.status === s) && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(donation.timeline.find((t) => t.status === s).timestamp).toLocaleString('en-IN')}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function DonorDashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchDonations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/donation/my-donations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDonations(res.data);
            if (!selectedDonation && res.data.length > 0) setSelectedDonation(res.data[0]);
        } catch { }
        setLoading(false);
    }, [token, selectedDonation]);

    useEffect(() => {
        fetchDonations();
        const socket = io('http://localhost:5000');
        socket.emit('join', user?._id || user?.id);
        socket.on('donation:verified', (data) => {
            showToast(`🎉 ${data.message}`, 'success');
            fetchDonations();
        });
        return () => socket.disconnect();
    }, [user, fetchDonations]);

    const stats = {
        totalDonated: donations.filter((d) => d.status === 'verified').reduce((s, d) => s + d.amount, 0),
        total: donations.length,
        pending: donations.filter((d) => d.status === 'pending').length,
    };

    return (
        <div className="min-h-screen bg-navy flex font-body">
            {toast && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl text-white font-medium shadow-2xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                    {toast.msg}
                </motion.div>
            )}

            <aside className="w-64 min-h-screen flex flex-col p-6" style={{ background: 'linear-gradient(180deg, #0d1437 0%, #0A0F2C 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-10">
                    <span className="text-2xl">❤️</span>
                    <span className="font-display text-xl font-bold text-gold">HopeHug</span>
                </div>
                <nav className="space-y-2 flex-1">
                    {[
                        { icon: '📊', label: 'Dashboard', active: true },
                        { icon: '💰', label: 'All Causes', action: () => navigate('/') },
                        { icon: '🏠', label: 'Home', action: () => navigate('/') },
                    ].map((item) => (
                        <button key={item.label} onClick={item.action}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${item.active ? 'bg-gold/10 text-gold border border-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}>
                            <span>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>
                <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gold/20 border-2 border-gold/40 flex items-center justify-center text-gold font-bold text-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">{user?.name}</p>
                            <p className="text-gray-500 text-xs">{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-white">
                            Welcome back, <span className="text-gold">{user?.name?.split(' ')[0]}</span> 👋
                        </h1>
                        <p className="text-gray-400 mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={() => navigate('/')} className="btn-primary px-6 py-3 text-sm">
                        + Donate Again
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-5 mb-8">
                    {[
                        { icon: '💰', label: 'Total Donated', value: `₹${stats.totalDonated.toLocaleString('en-IN')}`, sub: 'Verified donations', color: 'text-gold' },
                        { icon: '📋', label: 'Total Donations', value: stats.total, sub: 'All time', color: 'text-blue-400' },
                        { icon: '⏳', label: 'Pending', value: stats.pending, sub: 'Awaiting verification', color: 'text-amber-400' },
                    ].map((card, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="glass rounded-2xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-2xl">{card.icon}</span>
                                <span className="text-xs text-gray-500 font-medium">{card.sub}</span>
                            </div>
                            <div className={`text-3xl font-display font-bold ${card.color} mb-1`}>
                                {loading ? <Skeleton className="w-20 h-8" /> : card.value}
                            </div>
                            <p className="text-gray-400 text-sm">{card.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-display text-xl font-bold text-white mb-5">Donation History</h2>
                            {loading ? (
                                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                            ) : donations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">💝</div>
                                    <p className="text-gray-400">No donations yet.</p>
                                    <button onClick={() => navigate('/')} className="btn-primary mt-4 px-6 py-2 text-sm">Make First Donation</button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                {['Cause', 'Amount', 'UTR ID', 'Status', 'Date', ''].map((h) => (
                                                    <th key={h} className="text-left text-gray-500 font-medium py-3 pr-4 text-xs uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {donations.map((d) => (
                                                <tr key={d._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                                    <td className="py-4 pr-4 text-white font-medium max-w-xs truncate">{d.causeId?.title || 'N/A'}</td>
                                                    <td className="py-4 pr-4 text-gold font-bold">₹{d.amount?.toLocaleString('en-IN')}</td>
                                                    <td className="py-4 pr-4 text-gray-400 font-mono text-xs">{d.utrId || '—'}</td>
                                                    <td className="py-4 pr-4"><StatusBadge status={d.status} /></td>
                                                    <td className="py-4 pr-4 text-gray-500 text-xs">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                                                    <td className="py-4">
                                                        <button onClick={() => setSelectedDonation(d)}
                                                            className="px-3 py-1.5 rounded-lg border border-gold/40 text-gold text-xs hover:bg-gold/10 transition-all">
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">Donation Timeline</h2>
                        {selectedDonation ? (
                            <div>
                                <div className="glass-gold rounded-xl p-4 mb-5 text-sm">
                                    <p className="text-gray-400 text-xs mb-1">Selected Donation</p>
                                    <p className="text-white font-semibold">{selectedDonation.causeId?.title}</p>
                                    <p className="text-gold font-bold">₹{selectedDonation.amount?.toLocaleString('en-IN')}</p>
                                </div>
                                <DonationTimeline donation={selectedDonation} />
                                {selectedDonation.screenshotPath && (
                                    <div className="mt-5">
                                        <p className="text-gray-400 text-xs mb-2">Payment Screenshot</p>
                                        <img
                                            src={`http://localhost:5000${selectedDonation.screenshotPath}`}
                                            alt="Payment proof"
                                            className="w-full rounded-xl border border-white/10 object-cover max-h-32"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">Select a donation to see its timeline</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
