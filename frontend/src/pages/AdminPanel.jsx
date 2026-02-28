import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const StatusBadge = ({ status }) => {
    const colors = {
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        verified: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.pending}`}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
};

export default function AdminPanel() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState([]);
    const [ngos, setNGOs] = useState([]);
    const [causes, setCauses] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [causeForm, setCauseForm] = useState({ title: '', description: '', goalAmount: '', fundedBy: '', ngoId: '' });
    const [causeImages, setCauseImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [editCause, setEditCause] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const load = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [donRes, ngoRes, statsRes, causeRes] = await Promise.all([
                axios.get(`${API_BASE}/donation/all`, { headers }),
                axios.get(`${API_BASE}/ngo/all`, { headers }),
                axios.get(`${API_BASE}/stats`),
                axios.get(`${API_BASE}/cause/all`, { headers }),
            ]);
            setDonations(donRes.data);
            setNGOs(ngoRes.data);
            setStats(statsRes.data);
            setCauses(causeRes.data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, [token]);

    const handleVerify = async (id, action) => {
        try {
            await axios.patch(`${API_BASE}/donation/verify/${id}`, { action }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast(`Donation ${action} successfully!`);
            load();
        } catch (err) {
            showToast(err.response?.data?.error || 'Action failed.', 'error');
        }
    };

    const handleVerifyNGO = async (id, action) => {
        try {
            await axios.patch(`${API_BASE}/ngo/verify/${id}`, { action }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast(`NGO ${action}!`);
            load();
        } catch {
            showToast('NGO action failed.', 'error');
        }
    };

    const handleCreateCause = async (e) => {
        e.preventDefault();
        if (!causeForm.title || !causeForm.description || !causeForm.goalAmount) {
            return showToast('Title, description, and goal amount required.', 'error');
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', causeForm.title);
            fd.append('description', causeForm.description);
            fd.append('goalAmount', causeForm.goalAmount);
            fd.append('fundedBy', causeForm.fundedBy);
            if (causeForm.ngoId) fd.append('ngoId', causeForm.ngoId);
            causeImages.forEach((img) => fd.append('images', img));
            await axios.post(`${API_BASE}/cause`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            showToast('Cause created!');
            setCauseForm({ title: '', description: '', goalAmount: '', fundedBy: '', ngoId: '' });
            setCauseImages([]);
            load();
            setActiveTab('manage-causes');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCause = async (e) => {
        e.preventDefault();
        if (!editCause) return;
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', editCause.title);
            fd.append('description', editCause.description);
            fd.append('goalAmount', editCause.goalAmount);
            fd.append('fundedBy', editCause.fundedBy || '');
            fd.append('status', editCause.status);
            if (editCause.newImages && editCause.newImages.length > 0) {
                editCause.newImages.forEach((img) => fd.append('images', img));
            }
            await axios.patch(`${API_BASE}/cause/${editCause._id}`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            showToast('Cause updated!');
            setShowEditModal(false);
            setEditCause(null);
            load();
        } catch (err) {
            showToast(err.response?.data?.error || 'Update failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCause = async (id) => {
        try {
            await axios.delete(`${API_BASE}/cause/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast('Cause deleted.');
            load();
        } catch {
            showToast('Delete failed.', 'error');
        }
    };

    const toggleCauseStatus = async (cause) => {
        const newStatus = cause.status === 'active' ? 'completed' : 'active';
        try {
            await axios.patch(`${API_BASE}/cause/${cause._id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast(`Cause ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
            load();
        } catch {
            showToast('Status change failed.', 'error');
        }
    };

    const filteredDonations = donations.filter((d) =>
        statusFilter === 'all' ? true : d.status === statusFilter
    );

    const verifiedNGOs = ngos.filter((n) => n.verificationStatus === 'verified');

    const chartData = donations
        .filter((d) => d.status === 'verified')
        .reduce((acc, d) => {
            const key = d.causeId?.title?.slice(0, 15) || 'Unknown';
            const found = acc.find((a) => a.name === key);
            if (found) found.amount += d.amount;
            else acc.push({ name: key, amount: d.amount });
            return acc;
        }, []);

    const lineData = donations
        .filter((d) => d.status === 'verified')
        .reduce((acc, d) => {
            const date = new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            const found = acc.find((a) => a.date === date);
            if (found) found.total += d.amount;
            else acc.push({ date, total: d.amount });
            return acc;
        }, [])
        .slice(-10);

    const inputClass = "w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none";
    const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

    return (
        <div className="min-h-screen bg-navy flex font-body">
            {toast && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}
                    className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl text-white font-medium shadow-2xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.msg}
                </motion.div>
            )}

            <AnimatePresence>
                {showEditModal && editCause && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="glass rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-display text-2xl font-bold text-gold mb-6">Edit Cause</h2>
                            <form onSubmit={handleEditCause} className="space-y-4">
                                <input type="text" placeholder="Title" value={editCause.title}
                                    onChange={(e) => setEditCause({ ...editCause, title: e.target.value })}
                                    className={inputClass} style={inputStyle} />
                                <textarea placeholder="Description" value={editCause.description} rows={3}
                                    onChange={(e) => setEditCause({ ...editCause, description: e.target.value })}
                                    className={`${inputClass} resize-none`} style={inputStyle} />
                                <input type="number" placeholder="Goal Amount" value={editCause.goalAmount}
                                    onChange={(e) => setEditCause({ ...editCause, goalAmount: e.target.value })}
                                    className={inputClass} style={inputStyle} />
                                <input type="text" placeholder="Funded By" value={editCause.fundedBy || ''}
                                    onChange={(e) => setEditCause({ ...editCause, fundedBy: e.target.value })}
                                    className={inputClass} style={inputStyle} />
                                <select value={editCause.status}
                                    onChange={(e) => setEditCause({ ...editCause, status: e.target.value })}
                                    className={inputClass} style={inputStyle}>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <label className="block border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-gold/40 transition-all">
                                    <p className="text-gray-300 text-sm">{editCause.newImages?.length > 0 ? `${editCause.newImages.length} new image(s) selected` : 'Upload new image (optional)'}</p>
                                    <input type="file" accept="image/*" multiple className="hidden"
                                        onChange={(e) => setEditCause({ ...editCause, newImages: Array.from(e.target.files) })} />
                                </label>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => setShowEditModal(false)}
                                        className="btn-outline flex-1 py-3">Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <aside className="w-64 min-h-screen flex flex-col p-6" style={{ background: 'linear-gradient(180deg, #0d1437 0%, #0A0F2C 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-10">
                    <span className="text-2xl">❤️</span>
                    <span className="font-display text-xl font-bold text-gold">HopeHug</span>
                </div>
                <nav className="space-y-2 flex-1">
                    {[
                        { key: 'overview', icon: '📊', label: 'Overview' },
                        { key: 'pending', icon: '⏳', label: 'Pending Donations' },
                        { key: 'all-donations', icon: '💰', label: 'All Donations' },
                        { key: 'ngos', icon: '🏢', label: 'NGO Approvals' },
                        { key: 'add-cause', icon: '➕', label: 'Add Cause' },
                        { key: 'manage-causes', icon: '🌟', label: 'Manage Causes' },
                        { key: 'analytics', icon: '📈', label: 'Analytics' },
                    ].map((item) => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.key ? 'bg-gold/10 text-gold border border-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <span>{item.icon}</span> {item.label}
                            {item.key === 'pending' && donations.filter(d => d.status === 'pending').length > 0 && (
                                <span className="ml-auto bg-amber-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {donations.filter(d => d.status === 'pending').length}
                                </span>
                            )}
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
                            <p className="text-gray-500 text-xs">Administrator</p>
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
                            Admin <span className="text-gold">Panel</span>
                        </h1>
                        <p className="text-gray-400 mt-1">HopeHug — Mitali Foundation</p>
                    </div>
                    <div className="glass-gold rounded-xl px-4 py-2 text-gold text-sm font-semibold">
                        🔐 Admin Access
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div>
                        <div className="grid grid-cols-4 gap-5 mb-8">
                            {[
                                { icon: '💰', label: 'Total Raised', value: `₹${(stats.totalRaised || 0).toLocaleString('en-IN')}`, color: 'text-gold' },
                                { icon: '👥', label: 'Total Donors', value: stats.totalDonors || 0, color: 'text-blue-400' },
                                { icon: '⏳', label: 'Pending', value: donations.filter(d => d.status === 'pending').length, color: 'text-amber-400' },
                                { icon: '🏢', label: 'Pending NGOs', value: ngos.filter(n => n.verificationStatus === 'pending').length, color: 'text-purple-400' },
                            ].map((card, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className="glass rounded-2xl p-6 card-hover">
                                    <div className="text-3xl mb-3">{card.icon}</div>
                                    <div className={`text-3xl font-display font-bold ${card.color} mb-1`}>{loading ? '...' : card.value}</div>
                                    <p className="text-gray-400 text-sm">{card.label}</p>
                                </motion.div>
                            ))}
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-display text-xl font-bold text-white mb-5">Recent Pending Donations</h2>
                            {donations.filter(d => d.status === 'pending').slice(0, 3).map((d) => (
                                <div key={d._id} className="flex items-center justify-between border-b border-white/5 py-4 last:border-0">
                                    <div>
                                        <p className="text-white font-medium">{d.donorId?.name}</p>
                                        <p className="text-gray-400 text-sm">{d.causeId?.title} — ₹{d.amount?.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleVerify(d._id, 'verified')}
                                            className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold hover:bg-green-500/40 transition-all">
                                            ✅ Verify
                                        </button>
                                        <button onClick={() => handleVerify(d._id, 'rejected')}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/40 transition-all">
                                            ❌ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {donations.filter(d => d.status === 'pending').length === 0 && (
                                <p className="text-gray-500 text-center py-6">No pending donations 🎉</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">
                            Pending Donations
                            <span className="ml-3 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
                                {donations.filter(d => d.status === 'pending').length}
                            </span>
                        </h2>
                        <div className="space-y-4">
                            {donations.filter(d => d.status === 'pending').map((d) => (
                                <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="glass-gold rounded-xl p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-lg">₹{d.amount?.toLocaleString('en-IN')}</p>
                                            <p className="text-gray-400 text-sm mt-1">
                                                <span className="text-white">{d.donorId?.name}</span> → {d.causeId?.title}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">📧 {d.donorId?.email}</p>
                                            {d.utrId && <p className="text-gold font-mono text-xs mt-1">UTR: {d.utrId}</p>}
                                            <p className="text-gray-500 text-xs mt-1">{new Date(d.createdAt).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {d.screenshotPath && (
                                                <a href={`${d.screenshotPath}`} target="_blank" rel="noopener noreferrer"
                                                    className="px-3 py-1.5 glass rounded-lg text-xs text-gray-300 hover:text-gold border border-white/10 hover:border-gold/30">
                                                    📸 View Screenshot
                                                </a>
                                            )}
                                            <button onClick={() => handleVerify(d._id, 'verified')}
                                                className="px-5 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-semibold hover:bg-green-500/40 transition-all">
                                                ✅ Verify
                                            </button>
                                            <button onClick={() => handleVerify(d._id, 'rejected')}
                                                className="px-5 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/40 transition-all">
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {donations.filter(d => d.status === 'pending').length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-5xl mb-3">✅</div>
                                    <p>All donations are processed!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'all-donations' && (
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-xl font-bold text-white">All Donations</h2>
                            <div className="flex gap-2">
                                {['all', 'pending', 'verified', 'rejected'].map((s) => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'bg-gold text-navy' : 'glass text-gray-400 hover:text-white'}`}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Donor', 'Cause', 'Amount', 'UTR', 'Status', 'Date', 'Action'].map((h) => (
                                            <th key={h} className="text-left text-gray-500 font-medium py-3 pr-4 text-xs uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDonations.map((d) => (
                                        <tr key={d._id} className="border-b border-white/5 hover:bg-white/2">
                                            <td className="py-3 pr-4 text-white">{d.donorId?.name}</td>
                                            <td className="py-3 pr-4 text-gray-300 max-w-32 truncate">{d.causeId?.title}</td>
                                            <td className="py-3 pr-4 text-gold font-bold">₹{d.amount?.toLocaleString('en-IN')}</td>
                                            <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{d.utrId || '—'}</td>
                                            <td className="py-3 pr-4"><StatusBadge status={d.status} /></td>
                                            <td className="py-3 pr-4 text-gray-500 text-xs">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td className="py-3">
                                                {d.status === 'pending' && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleVerify(d._id, 'verified')}
                                                            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/40">✅</button>
                                                        <button onClick={() => handleVerify(d._id, 'rejected')}
                                                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/40">❌</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'ngos' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">NGO Verifications</h2>
                        <div className="space-y-4">
                            {ngos.map((ngo) => (
                                <div key={ngo._id} className="flex items-center justify-between glass rounded-xl p-5">
                                    <div>
                                        <p className="text-white font-semibold">{ngo.orgName}</p>
                                        <p className="text-gray-400 text-sm">Owner: {ngo.userId?.name} ({ngo.userId?.email})</p>
                                        <div className="mt-2"><StatusBadge status={ngo.verificationStatus} /></div>
                                    </div>
                                    {ngo.verificationStatus === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVerifyNGO(ngo._id, 'verified')}
                                                className="px-5 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-semibold hover:bg-green-500/40">
                                                ✅ Approve
                                            </button>
                                            <button onClick={() => handleVerifyNGO(ngo._id, 'rejected')}
                                                className="px-5 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/40">
                                                ❌ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {ngos.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-5xl mb-3">🏢</div>
                                    <p>No NGOs registered yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'add-cause' && (
                    <div className="glass rounded-2xl p-8 max-w-2xl">
                        <h2 className="font-display text-2xl font-bold text-gold mb-6">Add New Cause</h2>
                        <form onSubmit={handleCreateCause} className="space-y-5">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Title *</label>
                                <input type="text" placeholder="e.g. Clean Water for Rural Bengal"
                                    value={causeForm.title} onChange={(e) => setCauseForm({ ...causeForm, title: e.target.value })}
                                    className={inputClass} style={inputStyle}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')} />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Description *</label>
                                <textarea placeholder="Describe the cause and its impact..." value={causeForm.description}
                                    onChange={(e) => setCauseForm({ ...causeForm, description: e.target.value })} rows={4}
                                    className={`${inputClass} resize-none`} style={inputStyle}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Goal Amount (₹) *</label>
                                    <input type="number" min="1" placeholder="e.g. 75000"
                                        value={causeForm.goalAmount} onChange={(e) => setCauseForm({ ...causeForm, goalAmount: e.target.value })}
                                        className={inputClass} style={inputStyle}
                                        onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                        onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')} />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Funded By / Company</label>
                                    <input type="text" placeholder="e.g. Tata Trusts"
                                        value={causeForm.fundedBy} onChange={(e) => setCauseForm({ ...causeForm, fundedBy: e.target.value })}
                                        className={inputClass} style={inputStyle}
                                        onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                        onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Assign to NGO</label>
                                <select value={causeForm.ngoId}
                                    onChange={(e) => setCauseForm({ ...causeForm, ngoId: e.target.value })}
                                    className={inputClass} style={inputStyle}>
                                    <option value="">Select a verified NGO...</option>
                                    {verifiedNGOs.map((n) => (
                                        <option key={n._id} value={n.userId?._id}>{n.orgName} ({n.userId?.name})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Cause Image</label>
                                <label className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${causeImages.length > 0 ? 'border-gold bg-gold/5' : 'border-white/20 hover:border-gold/40'}`}>
                                    <div className="text-3xl mb-2">🖼️</div>
                                    <p className="text-gray-300 text-sm">{causeImages.length > 0 ? `${causeImages.length} file(s) selected` : 'Upload cause image'}</p>
                                    <input type="file" accept="image/*" multiple className="hidden"
                                        onChange={(e) => setCauseImages(Array.from(e.target.files).slice(0, 5))} />
                                </label>
                            </div>
                            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-lg">
                                {submitting ? 'Creating...' : 'Create Cause 🌟'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'manage-causes' && (
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display text-xl font-bold text-white">Manage Causes</h2>
                            <button onClick={() => setActiveTab('add-cause')} className="btn-primary px-4 py-2 text-sm">
                                + Add Cause
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        {['Image', 'Title', 'Funded By', 'Goal', 'Raised', 'Status', 'Actions'].map((h) => (
                                            <th key={h} className="text-left text-gray-500 font-medium py-3 pr-4 text-xs uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {causes.map((c) => (
                                        <tr key={c._id} className="border-b border-white/5">
                                            <td className="py-3 pr-4">
                                                {c.images && c.images[0] ? (
                                                    <img src={`${c.images[0]}`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-gold font-bold text-sm"
                                                        style={{ background: 'linear-gradient(135deg, #1a2456, #2d3a8c)' }}>
                                                        {c.title?.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-white font-medium max-w-40 truncate">{c.title}</td>
                                            <td className="py-3 pr-4 text-gold text-xs">{c.fundedBy || '—'}</td>
                                            <td className="py-3 pr-4 text-gray-300">₹{c.goalAmount?.toLocaleString('en-IN')}</td>
                                            <td className="py-3 pr-4 text-gold font-semibold">₹{c.currentAmount?.toLocaleString('en-IN')}</td>
                                            <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                                            <td className="py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditCause({ ...c, newImages: [] }); setShowEditModal(true); }}
                                                        className="px-3 py-1.5 rounded-lg border border-gold/40 text-gold text-xs hover:bg-gold/10">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => toggleCauseStatus(c)}
                                                        className="px-3 py-1.5 rounded-lg border border-blue-400/40 text-blue-400 text-xs hover:bg-blue-400/10">
                                                        {c.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button onClick={() => handleDeleteCause(c._id)}
                                                        className="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 text-xs hover:bg-red-400/10">
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {causes.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <div className="text-5xl mb-3">🌟</div>
                                <p>No causes yet. Add one above!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-display text-xl font-bold text-white mb-6">Donations by Cause</h2>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                                        <Tooltip
                                            contentStyle={{ background: '#131b3e', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '12px', color: '#fff' }}
                                            formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
                                        />
                                        <Bar dataKey="amount" fill="#F5C842" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400">No verified donations yet</div>
                            )}
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-display text-xl font-bold text-white mb-6">Donation Trend</h2>
                            {lineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip
                                            contentStyle={{ background: '#131b3e', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '12px', color: '#fff' }}
                                            formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Total']}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="#F5C842" strokeWidth={3} dot={{ fill: '#F5C842', strokeWidth: 2, r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400">No data available</div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
