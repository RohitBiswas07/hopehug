import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

export default function NGOPanel() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [ngo, setNGO] = useState(null);
    const [causes, setCauses] = useState([]);
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [ngoForm, setNGOForm] = useState({ orgName: '', description: '' });
    const [causeForm, setCauseForm] = useState({ title: '', description: '', goalAmount: '' });
    const [causeImages, setCauseImages] = useState([]);
    const [ngoDoc, setNgoDoc] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [ngoRes, causesRes, donationRes] = await Promise.all([
                    axios.get(`${API_BASE}/ngo/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
                    axios.get(`${API_BASE}/cause/my`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
                    axios.get(`${API_BASE}/ngo/donations`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
                ]);
                setNGO(ngoRes.data);
                setCauses(causesRes.data);
                setDonations(donationRes.data);
            } catch { }
            setLoading(false);
        };
        load();
    }, [token]);

    const handleRegisterNGO = async (e) => {
        e.preventDefault();
        if (!ngoForm.orgName) return showToast('Organization name is required.', 'error');
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('orgName', ngoForm.orgName);
            fd.append('description', ngoForm.description);
            if (ngoDoc) fd.append('documents', ngoDoc);
            const res = await axios.post(`${API_BASE}/ngo/register`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            setNGO(res.data);
            showToast('NGO registered! Awaiting verification.');
            setActiveTab('causes');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to register NGO.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCause = async (e) => {
        e.preventDefault();
        if (!causeForm.title || !causeForm.description || !causeForm.goalAmount) {
            return showToast('All fields required.', 'error');
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', causeForm.title);
            fd.append('description', causeForm.description);
            fd.append('goalAmount', causeForm.goalAmount);
            causeImages.forEach((img) => fd.append('images', img));
            const res = await axios.post(`${API_BASE}/cause`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            setCauses([res.data, ...causes]);
            setCauseForm({ title: '', description: '', goalAmount: '' });
            setCauseImages([]);
            showToast('Cause created successfully!');
            setActiveTab('causes');
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create cause.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = ['overview', 'causes', 'add-cause', 'donations'];

    return (
        <div className="min-h-screen bg-navy flex font-body">
            {toast && (
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }}
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
                        { key: 'overview', icon: '📊', label: 'Overview' },
                        { key: 'causes', icon: '🌟', label: 'My Causes' },
                        { key: 'add-cause', icon: '➕', label: 'Add Cause' },
                        { key: 'donations', icon: '💰', label: 'Donations' },
                    ].map((item) => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.key ? 'bg-gold/10 text-gold border border-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                            <p className="text-gray-500 text-xs capitalize">NGO Partner</p>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-white">
                        NGO <span className="text-gold">Panel</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your causes and track donations</p>
                </div>

                {!ngo && !loading && (
                    <div className="glass rounded-2xl p-8 max-w-xl mb-8">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">🏢</div>
                            <h2 className="font-display text-2xl font-bold text-gold mb-2">Register Your NGO</h2>
                            <p className="text-gray-400 text-sm">Complete registration to start accepting donations</p>
                        </div>
                        <form onSubmit={handleRegisterNGO} className="space-y-4">
                            <input type="text" placeholder="Organization Name *"
                                value={ngoForm.orgName} onChange={(e) => setNGOForm({ ...ngoForm, orgName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                            />
                            <textarea placeholder="Organization Description" value={ngoForm.description}
                                onChange={(e) => setNGOForm({ ...ngoForm, description: e.target.value })} rows={3}
                                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                            />
                            <label className="block border-2 border-dashed border-white/20 hover:border-gold/40 rounded-xl p-5 text-center cursor-pointer transition-all">
                                <div className="text-2xl mb-1">📄</div>
                                <p className="text-gray-300 text-sm">{ngoDoc ? ngoDoc.name : 'Upload Documents (Optional)'}</p>
                                <input type="file" className="hidden" onChange={(e) => setNgoDoc(e.target.files[0])} />
                            </label>
                            <button type="submit" disabled={submitting} className="btn-primary w-full py-4">
                                {submitting ? 'Registering...' : 'Register NGO 🏢'}
                            </button>
                        </form>
                    </div>
                )}

                {ngo && (
                    <div className={`glass-gold rounded-xl p-4 mb-6 flex items-center gap-4 ${ngo.verificationStatus === 'verified' ? 'border-green-500/30' : 'border-amber-500/30'}`}
                        style={{ border: `1px solid ${ngo.verificationStatus === 'verified' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        <div className="text-3xl">{ngo.verificationStatus === 'verified' ? '✅' : '⏳'}</div>
                        <div>
                            <p className="text-white font-semibold">{ngo.orgName}</p>
                            <p className={`text-sm ${ngo.verificationStatus === 'verified' ? 'text-green-400' : 'text-amber-400'}`}>
                                {ngo.verificationStatus === 'verified' ? 'Verified NGO Partner' : 'Verification Pending — Admin will verify soon'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div>
                        <div className="grid grid-cols-3 gap-5 mb-8">
                            {[
                                { icon: '🌟', label: 'Active Causes', value: causes.filter(c => c.status === 'active').length, color: 'text-gold' },
                                { icon: '💰', label: 'Total Received', value: `₹${donations.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')}`, color: 'text-green-400' },
                                { icon: '📋', label: 'Total Donations', value: donations.length, color: 'text-blue-400' },
                            ].map((card, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className="glass rounded-2xl p-6 card-hover">
                                    <div className="text-3xl mb-3">{card.icon}</div>
                                    <div className={`text-3xl font-display font-bold ${card.color} mb-1`}>{loading ? '...' : card.value}</div>
                                    <p className="text-gray-400 text-sm">{card.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'causes' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Loading...</div>
                        ) : causes.length === 0 ? (
                            <div className="text-center py-12 glass rounded-2xl">
                                <div className="text-5xl mb-4">🌟</div>
                                <p className="text-gray-400 mb-4">No causes yet.</p>
                                <button onClick={() => setActiveTab('add-cause')} className="btn-primary px-8 py-3">Create First Cause</button>
                            </div>
                        ) : (
                            causes.map((cause) => (
                                <motion.div key={cause._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="glass rounded-2xl p-6 flex items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-white font-semibold">{cause.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${cause.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {cause.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-3">{cause.description}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gold font-semibold">₹{cause.currentAmount?.toLocaleString('en-IN')} raised</span>
                                            <span className="text-gray-500">of ₹{cause.goalAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full mt-2">
                                            <div className="h-full progress-bar rounded-full" style={{ width: `${Math.min(100, (cause.currentAmount / cause.goalAmount) * 100)}%` }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'add-cause' && (
                    <div className="glass rounded-2xl p-8 max-w-2xl">
                        <h2 className="font-display text-2xl font-bold text-gold mb-6">Create New Cause</h2>
                        <form onSubmit={handleCreateCause} className="space-y-5">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Cause Title *</label>
                                <input type="text" placeholder="e.g. Clean Water for Rural Bengal"
                                    value={causeForm.title} onChange={(e) => setCauseForm({ ...causeForm, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Description *</label>
                                <textarea placeholder="Describe the cause and its impact..." value={causeForm.description}
                                    onChange={(e) => setCauseForm({ ...causeForm, description: e.target.value })} rows={4}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Goal Amount (₹) *</label>
                                <input type="number" min="1" placeholder="e.g. 75000"
                                    value={causeForm.goalAmount} onChange={(e) => setCauseForm({ ...causeForm, goalAmount: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">Cause Images (optional)</label>
                                <label className="block border-2 border-dashed border-white/20 hover:border-gold/40 rounded-xl p-6 text-center cursor-pointer transition-all">
                                    <div className="text-3xl mb-2">🖼️</div>
                                    <p className="text-gray-300 text-sm">{causeImages.length > 0 ? `${causeImages.length} file(s) selected` : 'Upload images (max 5)'}</p>
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

                {activeTab === 'donations' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="font-display text-xl font-bold text-white mb-5">Verified Donations Received</h2>
                        {loading ? (
                            <p className="text-gray-400 text-center py-8">Loading...</p>
                        ) : donations.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">💰</div>
                                <p className="text-gray-400">No verified donations yet for your causes.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            {['Donor', 'Cause', 'Amount', 'Date'].map((h) => (
                                                <th key={h} className="text-left text-gray-500 font-medium py-3 pr-4 text-xs uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donations.map((d) => (
                                            <tr key={d._id} className="border-b border-white/5">
                                                <td className="py-4 pr-4 text-white">{d.donorId?.name}</td>
                                                <td className="py-4 pr-4 text-gray-300">{d.causeId?.title}</td>
                                                <td className="py-4 pr-4 text-gold font-bold">₹{d.amount?.toLocaleString('en-IN')}</td>
                                                <td className="py-4 pr-4 text-gray-500 text-xs">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
