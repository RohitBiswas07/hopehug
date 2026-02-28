import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

const API_BASE = '/api';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('hopehug_admin_token')}`,
});

const StatusBadge = ({ status }) => {
    const colors = {
        pending: { bg: 'rgba(241,196,15,0.12)', text: '#f1c40f', border: 'rgba(241,196,15,0.3)' },
        verified: { bg: 'rgba(46,204,113,0.12)', text: '#2ecc71', border: 'rgba(46,204,113,0.3)' },
        rejected: { bg: 'rgba(231,76,60,0.12)', text: '#e74c3c', border: 'rgba(231,76,60,0.3)' },
        active: { bg: 'rgba(46,204,113,0.12)', text: '#2ecc71', border: 'rgba(46,204,113,0.3)' },
        completed: { bg: 'rgba(52,152,219,0.12)', text: '#3498db', border: 'rgba(52,152,219,0.3)' },
    };
    const c = colors[status] || colors.pending;
    return (
        <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            background: c.bg,
            color: c.text,
            border: `1px solid ${c.border}`,
        }}>
            {status?.toUpperCase()}
        </span>
    );
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [donations, setDonations] = useState([]);
    const [causes, setCauses] = useState([]);
    const [ngos, setNGOs] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [screenshotModal, setScreenshotModal] = useState(null);

    const [causeDrawer, setCauseDrawer] = useState(false);
    const [editCauseData, setEditCauseData] = useState(null);
    const [causeForm, setCauseForm] = useState({ title: '', description: '', goalAmount: '', fundedBy: '', ngoId: '' });
    const [causeImages, setCauseImages] = useState([]);

    const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [submitting, setSubmitting] = useState(false);

    const adminUser = JSON.parse(localStorage.getItem('hopehug_admin_user') || '{}');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const load = async () => {
        try {
            const h = { headers: getHeaders() };
            const [donRes, statsRes, causeRes, ngoRes, adminRes, subRes] = await Promise.all([
                axios.get(`${API_BASE}/donation/all`, h),
                axios.get(`${API_BASE}/stats`),
                axios.get(`${API_BASE}/cause/all`, h),
                axios.get(`${API_BASE}/ngo/all`, h),
                axios.get(`${API_BASE}/admin/list`, h),
                axios.get(`${API_BASE}/admin/subscribers`, h),
            ]);
            setDonations(donRes.data);
            setStats(statsRes.data);
            setCauses(causeRes.data);
            setNGOs(ngoRes.data);
            setAdmins(adminRes.data);
            setSubscribers(subRes.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('hopehug_admin_token');
                localStorage.removeItem('hopehug_admin_user');
                navigate('/rohitadmin');
            }
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleLogout = () => {
        localStorage.removeItem('hopehug_admin_token');
        localStorage.removeItem('hopehug_admin_user');
        navigate('/rohitadmin');
    };

    const verifyDonation = async (id, action) => {
        try {
            await axios.patch(`${API_BASE}/donation/verify/${id}`, { action }, { headers: getHeaders() });
            showToast(`Donation ${action}!`);
            load();
        } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
    };

    const verifyNGO = async (id, action) => {
        try {
            await axios.patch(`${API_BASE}/ngo/verify/${id}`, { action }, { headers: getHeaders() });
            showToast(`NGO ${action}!`);
            load();
        } catch { showToast('Failed.', 'error'); }
    };

    const submitCause = async (e) => {
        e.preventDefault();
        const data = editCauseData || causeForm;
        if (!data.title || !data.description || !data.goalAmount) return showToast('Fill required fields.', 'error');
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', data.title);
            fd.append('description', data.description);
            fd.append('goalAmount', data.goalAmount);
            fd.append('fundedBy', data.fundedBy || '');
            if (data.ngoId) fd.append('ngoId', data.ngoId);
            causeImages.forEach((img) => fd.append('images', img));
            if (editCauseData?._id) {
                if (data.status) fd.append('status', data.status);
                await axios.patch(`${API_BASE}/cause/${editCauseData._id}`, fd, { headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' } });
                showToast('Cause updated!');
            } else {
                await axios.post(`${API_BASE}/cause`, fd, { headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' } });
                showToast('Cause created!');
            }
            setCauseDrawer(false);
            setEditCauseData(null);
            setCauseForm({ title: '', description: '', goalAmount: '', fundedBy: '', ngoId: '' });
            setCauseImages([]);
            load();
        } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
        setSubmitting(false);
    };

    const deleteCause = async (id) => {
        if (!window.confirm('Delete this cause permanently?')) return;
        try {
            await axios.delete(`${API_BASE}/cause/${id}`, { headers: getHeaders() });
            showToast('Cause deleted.');
            load();
        } catch { showToast('Delete failed.', 'error'); }
    };

    const toggleCauseStatus = async (cause) => {
        const s = cause.status === 'active' ? 'completed' : 'active';
        try {
            await axios.patch(`${API_BASE}/cause/${cause._id}`, { status: s }, { headers: getHeaders() });
            showToast(`Status changed to ${s}.`);
            load();
        } catch { showToast('Failed.', 'error'); }
    };

    const createAdmin = async (e) => {
        e.preventDefault();
        if (adminForm.password !== adminForm.confirmPassword) return showToast('Passwords do not match.', 'error');
        if (adminForm.password.length < 6) return showToast('Password must be 6+ characters.', 'error');
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE}/admin/create`, {
                name: adminForm.name,
                email: adminForm.email,
                password: adminForm.password,
            }, { headers: getHeaders() });
            showToast('Admin created successfully!');
            setAdminForm({ name: '', email: '', password: '', confirmPassword: '' });
            load();
        } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
        setSubmitting(false);
    };

    const removeAdmin = async (id) => {
        if (!window.confirm('Remove this admin?')) return;
        try {
            await axios.delete(`${API_BASE}/admin/${id}`, { headers: getHeaders() });
            showToast('Admin removed.');
            load();
        } catch (err) { showToast(err.response?.data?.error || 'Failed.', 'error'); }
    };

    const handleQrUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSubmitting(true);
        const fd = new FormData();
        fd.append('qrCode', file);
        try {
            await axios.post(`${API_BASE}/admin/upload-qr`, fd, { headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' } });
            showToast('UPI QR Code updated successfully!');
            // Force reload the image on the clients by appending a timestamp
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            showToast('Failed to update QR Code.', 'error');
            setSubmitting(false);
        }
    };

    const filteredDons = donations.filter((d) => {
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchSearch = !searchTerm || d.donorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.utrId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    const chartData = donations.filter((d) => d.status === 'verified').reduce((acc, d) => {
        const k = d.causeId?.title?.slice(0, 18) || 'Unknown';
        const f = acc.find((a) => a.name === k);
        if (f) f.amount += d.amount; else acc.push({ name: k, amount: d.amount });
        return acc;
    }, []);

    const lineData = donations.filter((d) => d.status === 'verified').reduce((acc, d) => {
        const dt = new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const f = acc.find((a) => a.date === dt);
        if (f) f.total += d.amount; else acc.push({ date: dt, total: d.amount });
        return acc;
    }, []).slice(-10);

    const verifiedNGOs = ngos.filter((n) => n.verificationStatus === 'verified');
    const pendingDons = donations.filter((d) => d.status === 'pending');

    const s = {
        page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#0D0D0D' },
        sidebar: { width: '240px', minHeight: '100vh', background: '#111', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', left: 0, top: 0 },
        main: { flex: 1, marginLeft: '240px', padding: '32px', overflowY: 'auto', minHeight: '100vh' },
        card: { background: '#161616', border: '1px solid #222', borderRadius: '12px', padding: '24px' },
        input: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #2a2a2a', background: '#111', color: '#fff', fontSize: '13px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none' },
        btn: { padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.2s' },
        th: { textAlign: 'left', padding: '12px 16px', fontSize: '10px', color: '#666', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #1e1e1e' },
        td: { padding: '14px 16px', fontSize: '13px', color: '#ccc', borderBottom: '1px solid #141414' },
    };

    const sideItems = [
        { key: 'overview', icon: '🏠', label: 'Overview' },
        { key: 'donations', icon: '💸', label: 'Donations' },
        { key: 'causes', icon: '📋', label: 'Causes' },
        { key: 'ngos', icon: '🏢', label: 'NGOs' },
        { key: 'admins', icon: '👤', label: 'Manage Admins' },
        { key: 'subscribers', icon: '📬', label: 'Subscribers' },
    ];

    return (
        <div style={s.page}>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

            {toast && (
                <div style={{
                    position: 'fixed', top: '16px', right: '16px', zIndex: 100, padding: '14px 24px', borderRadius: '10px',
                    background: toast.type === 'success' ? '#1a3a2a' : '#3a1a1a',
                    border: `1px solid ${toast.type === 'success' ? '#2ecc7133' : '#e74c3c33'}`,
                    color: toast.type === 'success' ? '#2ecc71' : '#e74c3c',
                    fontSize: '13px', fontFamily: "'IBM Plex Mono', monospace",
                }}>
                    {toast.msg}
                </div>
            )}

            {screenshotModal && (
                <div onClick={() => setScreenshotModal(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                    <img src={screenshotModal} alt="Screenshot" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', border: '1px solid #333' }} />
                </div>
            )}

            {causeDrawer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', justifyContent: 'flex-end' }}>
                    <div onClick={() => { setCauseDrawer(false); setEditCauseData(null); }} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
                    <div style={{ width: '440px', background: '#111', borderLeft: '1px solid #222', padding: '32px', overflowY: 'auto' }}>
                        <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '18px', color: '#fff', marginBottom: '24px' }}>
                            {editCauseData ? '✏️ Edit Cause' : '➕ New Cause'}
                        </h2>
                        <form onSubmit={submitCause} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Title *</label>
                                <input style={s.input} value={(editCauseData || causeForm).title}
                                    onChange={(e) => editCauseData ? setEditCauseData({ ...editCauseData, title: e.target.value }) : setCauseForm({ ...causeForm, title: e.target.value })}
                                    placeholder="Cause title" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Description *</label>
                                <textarea style={{ ...s.input, height: '80px', resize: 'none' }} value={(editCauseData || causeForm).description}
                                    onChange={(e) => editCauseData ? setEditCauseData({ ...editCauseData, description: e.target.value }) : setCauseForm({ ...causeForm, description: e.target.value })}
                                    placeholder="Describe the cause" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Goal ₹ *</label>
                                    <input type="number" style={s.input} value={(editCauseData || causeForm).goalAmount}
                                        onChange={(e) => editCauseData ? setEditCauseData({ ...editCauseData, goalAmount: e.target.value }) : setCauseForm({ ...causeForm, goalAmount: e.target.value })}
                                        placeholder="75000" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Funded By</label>
                                    <input style={s.input} value={(editCauseData || causeForm).fundedBy || ''}
                                        onChange={(e) => editCauseData ? setEditCauseData({ ...editCauseData, fundedBy: e.target.value }) : setCauseForm({ ...causeForm, fundedBy: e.target.value })}
                                        placeholder="Company" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Assign NGO</label>
                                <select style={s.input} value={(editCauseData || causeForm).ngoId || ''}
                                    onChange={(e) => editCauseData ? setEditCauseData({ ...editCauseData, ngoId: e.target.value }) : setCauseForm({ ...causeForm, ngoId: e.target.value })}>
                                    <option value="">Select NGO...</option>
                                    {verifiedNGOs.map((n) => <option key={n._id} value={n.userId?._id}>{n.orgName}</option>)}
                                </select>
                            </div>
                            {editCauseData && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Status</label>
                                    <select style={s.input} value={editCauseData.status}
                                        onChange={(e) => setEditCauseData({ ...editCauseData, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Image</label>
                                <label style={{
                                    display: 'block', border: `2px dashed ${causeImages.length > 0 ? '#C0392B' : '#2a2a2a'}`,
                                    borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer',
                                    background: causeImages.length > 0 ? 'rgba(192,57,43,0.05)' : 'transparent',
                                }}>
                                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{causeImages.length > 0 ? `${causeImages.length} file(s)` : 'Upload image'}</p>
                                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                                        onChange={(e) => setCauseImages(Array.from(e.target.files))} />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button type="submit" disabled={submitting} style={{ ...s.btn, flex: 1, background: '#C0392B', color: '#fff' }}>
                                    {submitting ? '...' : editCauseData ? 'Save Changes' : 'Create Cause'}
                                </button>
                                <button type="button" onClick={() => { setCauseDrawer(false); setEditCauseData(null); }}
                                    style={{ ...s.btn, flex: 1, background: '#222', color: '#888' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <aside style={s.sidebar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    }}>🛡️</div>
                    <div>
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', margin: 0, fontWeight: 700 }}>Admin</p>
                        <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>Control Panel</p>
                    </div>
                </div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sideItems.map((item) => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 500, textAlign: 'left', width: '100%',
                            background: activeTab === item.key ? 'rgba(192,57,43,0.12)' : 'transparent',
                            color: activeTab === item.key ? '#C0392B' : '#888',
                            border: activeTab === item.key ? '1px solid rgba(192,57,43,0.2)' : '1px solid transparent',
                            transition: 'all 0.15s',
                        }}>
                            <span>{item.icon}</span>
                            <span style={{ fontFamily: "'Inter', sans-serif" }}>{item.label}</span>
                            {item.key === 'donations' && pendingDons.length > 0 && (
                                <span style={{
                                    marginLeft: 'auto', background: '#C0392B', color: '#fff', fontSize: '10px',
                                    width: '20px', height: '20px', borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                                }}>{pendingDons.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(192,57,43,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B',
                            fontSize: '12px', fontWeight: 700,
                        }}>{adminUser?.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                            <p style={{ color: '#ccc', fontSize: '12px', margin: 0, fontWeight: 500 }}>{adminUser?.name}</p>
                            <p style={{ color: '#555', fontSize: '10px', margin: 0 }}>{adminUser?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        ...s.btn, width: '100%', background: 'rgba(192,57,43,0.1)',
                        color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)',
                    }}>🔴 Logout</button>
                </div>
            </aside>

            <main style={s.main}>
                {activeTab === 'overview' && (
                    <div>
                        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Dashboard Overview</h1>
                        <p style={{ color: '#555', fontSize: '13px', marginBottom: '28px' }}>Welcome back, {adminUser?.name}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                            {[
                                { label: 'Total Raised', value: `₹${(stats.totalRaised || 0).toLocaleString('en-IN')}`, color: '#2ecc71' },
                                { label: 'Pending', value: pendingDons.length, color: '#f1c40f' },
                                { label: 'Active Causes', value: stats.activeCauses || 0, color: '#3498db' },
                                { label: 'Total NGOs', value: ngos.length, color: '#9b59b6' },
                            ].map((c, i) => (
                                <div key={i} style={{ ...s.card }}>
                                    <p style={{ color: '#666', fontSize: '11px', margin: '0 0 8px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</p>
                                    <p style={{ color: c.color, fontSize: '28px', fontWeight: 700, margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>{loading ? '...' : c.value}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                            <div style={s.card}>
                                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Donations by Cause</h3>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                                            <XAxis dataKey="name" stroke="#555" fontSize={10} />
                                            <YAxis stroke="#555" fontSize={10} />
                                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                                            <Bar dataKey="amount" fill="#C0392B" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No data</p>}
                            </div>
                            <div style={s.card}>
                                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Donation Trend</h3>
                                {lineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={lineData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                                            <XAxis dataKey="date" stroke="#555" fontSize={10} />
                                            <YAxis stroke="#555" fontSize={10} />
                                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                                            <Line type="monotone" dataKey="total" stroke="#C0392B" strokeWidth={2} dot={{ fill: '#C0392B', r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No data</p>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={s.card}>
                                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Recent Activity</h3>
                                {donations.slice(0, 10).map((d) => (
                                    <div key={d._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                                        <div>
                                            <span style={{ color: '#ccc', fontSize: '13px' }}>{d.donorId?.name}</span>
                                            <span style={{ color: '#555', fontSize: '12px' }}> → {d.causeId?.title?.slice(0, 25)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>₹{d.amount?.toLocaleString('en-IN')}</span>
                                            <StatusBadge status={d.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={s.card}>
                                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Platform Settings</h3>

                                <div style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '16px' }}>
                                    <p style={{ color: '#ccc', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Update Global UPI QR Code</p>
                                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '16px' }}>This QR code will be shown to all donors during payment.</p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div style={{ width: '200px', height: '200px', background: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                            <img
                                                src={`/public/qr-codes/upi-qr.png?t=${Date.now()}`}
                                                alt="Current QR"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+QR+Found'; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{
                                                display: 'block', border: `1px dashed #444`,
                                                borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer',
                                                background: 'transparent', transition: 'all 0.2s',
                                            }}>
                                                <p style={{ color: '#888', fontSize: '12px', margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>
                                                    {submitting ? 'Uploading...' : 'Click to Replace Image'}
                                                </p>
                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQrUpload} disabled={submitting} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'donations' && (
                    <div>
                        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff', marginBottom: '20px' }}>Donations</h1>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                            <input placeholder="Search by donor or UTR..." value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...s.input, maxWidth: '300px' }} />
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {['all', 'pending', 'verified', 'rejected'].map((st) => (
                                    <button key={st} onClick={() => setStatusFilter(st)} style={{
                                        ...s.btn, background: statusFilter === st ? '#C0392B' : '#1a1a1a',
                                        color: statusFilter === st ? '#fff' : '#888', border: '1px solid #2a2a2a',
                                    }}>{st.charAt(0).toUpperCase() + st.slice(1)}</button>
                                ))}
                            </div>
                        </div>
                        <div style={s.card}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Donor', 'Cause', 'Amount', 'UTR ID', 'Screenshot', 'Status', 'Date', 'Actions'].map((h) => (
                                            <th key={h} style={s.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDons.map((d) => (
                                        <tr key={d._id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={s.td}>{d.donorId?.name}<br /><span style={{ fontSize: '10px', color: '#666' }}>{d.donorId?.email}</span></td>
                                            <td style={{ ...s.td, maxWidth: '120px' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{d.causeId?.title}</span></td>
                                            <td style={{ ...s.td, color: '#2ecc71', fontWeight: 600 }}>₹{d.amount?.toLocaleString('en-IN')}</td>
                                            <td style={{ ...s.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>{d.utrId || '—'}</td>
                                            <td style={s.td}>
                                                {d.screenshotPath ? (
                                                    <button onClick={() => setScreenshotModal(`${d.screenshotPath}`)} style={{
                                                        ...s.btn, background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', padding: '4px 10px',
                                                    }}>👁 View</button>
                                                ) : <span style={{ color: '#444' }}>—</span>}
                                            </td>
                                            <td style={s.td}><StatusBadge status={d.status} /></td>
                                            <td style={{ ...s.td, fontSize: '11px', color: '#666' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td style={s.td}>
                                                {d.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button onClick={() => verifyDonation(d._id, 'verified')} style={{ ...s.btn, background: 'rgba(46,204,113,0.12)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.25)', padding: '6px 12px' }}>✅</button>
                                                        <button onClick={() => verifyDonation(d._id, 'rejected')} style={{ ...s.btn, background: 'rgba(231,76,60,0.12)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.25)', padding: '6px 12px' }}>❌</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredDons.length === 0 && <p style={{ color: '#444', textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>No donations found</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'causes' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff' }}>Causes</h1>
                            <button onClick={() => { setCauseDrawer(true); setEditCauseData(null); setCauseForm({ title: '', description: '', goalAmount: '', fundedBy: '', ngoId: '' }); setCauseImages([]); }}
                                style={{ ...s.btn, background: '#C0392B', color: '#fff' }}>+ Add New Cause</button>
                        </div>
                        <div style={s.card}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Image', 'Title', 'Funded By', 'NGO', 'Goal', 'Raised', 'Status', 'Actions'].map((h) => (
                                            <th key={h} style={s.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {causes.map((c) => (
                                        <tr key={c._id}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={s.td}>
                                                {c.images?.[0] ? (
                                                    <img src={`${c.images[0]}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B', fontSize: '12px', fontWeight: 700 }}>
                                                        {c.title?.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ ...s.td, color: '#fff', fontWeight: 500, maxWidth: '160px' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.title}</span></td>
                                            <td style={{ ...s.td, fontSize: '12px' }}>{c.fundedBy || '—'}</td>
                                            <td style={{ ...s.td, fontSize: '12px' }}>{c.ngoId?.name || '—'}</td>
                                            <td style={s.td}>₹{c.goalAmount?.toLocaleString('en-IN')}</td>
                                            <td style={{ ...s.td, color: '#2ecc71', fontWeight: 600 }}>₹{c.currentAmount?.toLocaleString('en-IN')}</td>
                                            <td style={s.td}><StatusBadge status={c.status} /></td>
                                            <td style={s.td}>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => { setEditCauseData(c); setCauseImages([]); setCauseDrawer(true); }}
                                                        style={{ ...s.btn, background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', padding: '4px 10px' }}>Edit</button>
                                                    <button onClick={() => toggleCauseStatus(c)}
                                                        style={{ ...s.btn, background: '#1a1a1a', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)', padding: '4px 10px' }}>
                                                        {c.status === 'active' ? 'Off' : 'On'}
                                                    </button>
                                                    <button onClick={() => deleteCause(c._id)}
                                                        style={{ ...s.btn, background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '4px 10px' }}>Del</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {causes.length === 0 && <p style={{ color: '#444', textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>No causes yet</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'ngos' && (
                    <div>
                        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff', marginBottom: '20px' }}>NGO Verification</h1>
                        <div style={s.card}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['NGO Name', 'Email', 'Documents', 'Status', 'Actions'].map((h) => (
                                            <th key={h} style={s.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ngos.map((n) => (
                                        <tr key={n._id}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ ...s.td, color: '#fff', fontWeight: 500 }}>{n.orgName}</td>
                                            <td style={s.td}>{n.userId?.email}</td>
                                            <td style={s.td}>
                                                {n.documents?.length > 0 ? (
                                                    <button onClick={() => setScreenshotModal(`${n.documents[0]}`)}
                                                        style={{ ...s.btn, background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', padding: '4px 10px' }}>
                                                        📄 View ({n.documents.length})
                                                    </button>
                                                ) : <span style={{ color: '#444' }}>None</span>}
                                            </td>
                                            <td style={s.td}><StatusBadge status={n.verificationStatus} /></td>
                                            <td style={s.td}>
                                                {n.verificationStatus === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button onClick={() => verifyNGO(n._id, 'verified')}
                                                            style={{ ...s.btn, background: 'rgba(46,204,113,0.12)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.25)', padding: '6px 12px' }}>✅ Approve</button>
                                                        <button onClick={() => verifyNGO(n._id, 'rejected')}
                                                            style={{ ...s.btn, background: 'rgba(231,76,60,0.12)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.25)', padding: '6px 12px' }}>❌ Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ngos.length === 0 && <p style={{ color: '#444', textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>No NGOs registered</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div>
                        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff', marginBottom: '20px' }}>Manage Admins</h1>

                        <div style={{
                            background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
                            borderRadius: '10px', padding: '16px 20px', marginBottom: '24px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <p style={{ color: '#e74c3c', fontSize: '13px', margin: 0, fontFamily: "'IBM Plex Mono', monospace" }}>
                                This page is restricted. Only create admin accounts for trusted personnel.
                            </p>
                        </div>

                        <div style={{ ...s.card, marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Current Admins</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Name', 'Email', 'Created', 'Action'].map((h) => (
                                            <th key={h} style={s.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map((a) => (
                                        <tr key={a._id}>
                                            <td style={{ ...s.td, color: '#fff', fontWeight: 500 }}>
                                                {a.name}
                                                {a._id === adminUser?._id && <span style={{ color: '#C0392B', fontSize: '10px', marginLeft: '8px' }}>(YOU)</span>}
                                            </td>
                                            <td style={s.td}>{a.email}</td>
                                            <td style={{ ...s.td, fontSize: '12px' }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                                            <td style={s.td}>
                                                {a._id !== adminUser?._id && (
                                                    <button onClick={() => removeAdmin(a._id)}
                                                        style={{ ...s.btn, background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '4px 12px' }}>Remove</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={s.card}>
                            <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Create New Admin</h3>
                            <form onSubmit={createAdmin} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                                    <input style={s.input} value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} placeholder="Admin name" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
                                    <input type="email" style={s.input} value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@hopehug.com" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                                        <input type="password" style={s.input} value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Min 6 chars" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm</label>
                                        <input type="password" style={s.input} value={adminForm.confirmPassword} onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })} placeholder="Confirm" />
                                    </div>
                                </div>
                                {adminForm.password && (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} style={{
                                                flex: 1, height: '3px', borderRadius: '2px',
                                                background: adminForm.password.length >= i * 3 ? (adminForm.password.length >= 9 ? '#2ecc71' : adminForm.password.length >= 6 ? '#f1c40f' : '#e74c3c') : '#222',
                                            }} />
                                        ))}
                                    </div>
                                )}
                                <button type="submit" disabled={submitting}
                                    style={{ ...s.btn, background: '#C0392B', color: '#fff', padding: '12px', fontSize: '13px', marginTop: '4px' }}>
                                    {submitting ? 'Creating...' : 'Create Admin Account'}
                                </button>
                            </form>
                            <p style={{ color: '#444', fontSize: '11px', marginTop: '16px', fontFamily: "'IBM Plex Mono', monospace" }}>
                                🔒 New admin credentials must be shared securely. This platform does not send automated emails for admin accounts.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'subscribers' && (
                    <div>
                        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '24px', color: '#fff', marginBottom: '20px' }}>Newsletter Subscribers</h1>
                        <div style={s.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#fff', margin: 0 }}>Total Subscribers: {subscribers.length}</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={s.th}>Email Address</th>
                                        <th style={s.th}>Subscribed Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <tr key={sub._id}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ ...s.td, color: '#fff', fontWeight: 500 }}>{sub.email}</td>
                                            <td style={{ ...s.td, color: '#888', fontSize: '12px' }}>{new Date(sub.subscribedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {subscribers.length === 0 && <p style={{ color: '#444', textAlign: 'center', padding: '32px 0', fontSize: '13px' }}>No subscribers yet.</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
