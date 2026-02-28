import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const StepIndicator = ({ current, total }) => (
    <div className="flex items-center justify-center gap-3 mb-10">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i < current ? 'bg-gold text-navy' :
                    i === current ? 'border-2 border-gold text-gold glass-gold' :
                        'border border-white/20 text-gray-500'
                    }`}>
                    {i < current ? '✓' : i + 1}
                </div>
                {i < total - 1 && (
                    <div className={`w-12 h-0.5 transition-all duration-500 ${i < current ? 'bg-gold' : 'bg-white/10'}`} />
                )}
            </div>
        ))}
    </div>
);

const ConfettiPiece = ({ i }) => {
    const colors = ['#F5C842', '#fdd96a', '#ffffff', '#d4a825', '#FF6B6B', '#4ECDC4'];
    return (
        <div
            className="absolute w-2 h-2 rounded-sm"
            style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                background: colors[i % colors.length],
                animation: `confetti-fall ${1.5 + Math.random() * 2}s linear ${Math.random() * 1}s forwards`,
                transform: `rotate(${Math.random() * 360}deg)`,
            }}
        />
    );
};

export default function DonatePage() {
    const { causeId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [step, setStep] = useState(0);
    const [cause, setCause] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [donationId, setDonationId] = useState('');
    const [utrId, setUtrId] = useState('');
    const [screenshot, setScreenshot] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [causeLoading, setCauseLoading] = useState(true);

    const quickAmounts = [100, 500, 1000, 2500, 5000, 10000];
    const steps = ['Select Amount', 'Payment', 'Submit Proof', 'Done!'];

    useEffect(() => {
        const fetchCause = async () => {
            try {
                const res = await axios.get(`${API_BASE}/cause/${causeId}`);
                setCause(res.data);
            } catch {
                navigate('/');
            } finally {
                setCauseLoading(false);
            }
        };
        fetchCause();
    }, [causeId, navigate]);

    const handleInitiate = async () => {
        setError('');
        if (!amount || Number(amount) < 10) {
            setError('Minimum donation amount is ₹10.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/donation/initiate`,
                { causeId, amount: Number(amount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDonationId(res.data.donationId);
            setStep(1);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initiate donation.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProof = async () => {
        setError('');
        if (!utrId) {
            setError('UTR ID is required.');
            return;
        }
        if (!screenshot) {
            setError('Payment screenshot is required.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('donationId', donationId);
            formData.append('utrId', utrId);
            formData.append('screenshot', screenshot);
            await axios.post(`${API_BASE}/donation/submit-proof`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit proof.');
        } finally {
            setLoading(false);
        }
    };

    const pct = cause ? Math.min(100, Math.round((cause.currentAmount / cause.goalAmount) * 100)) : 0;

    if (causeLoading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy font-body py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <a href="/" className="text-gold font-display text-2xl font-bold flex items-center justify-center gap-2">
                        <span>❤️</span> HopeHug
                    </a>
                    <p className="text-gray-400 mt-2">Secure & Transparent Donation</p>
                </div>

                <StepIndicator current={step} total={steps.length} />

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="step0"
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            className="glass rounded-2xl p-8"
                        >
                            <h2 className="font-display text-2xl font-bold text-gold mb-6">Step 1: Select Amount</h2>
                            {cause && (
                                <div className="glass-gold rounded-xl p-5 mb-6">
                                    <h3 className="text-white font-semibold text-lg mb-1">{cause.title}</h3>
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{cause.description}</p>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gold">₹{cause.currentAmount?.toLocaleString('en-IN')} raised</span>
                                        <span className="text-gray-400">of ₹{cause.goalAmount?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full">
                                        <div className="h-full progress-bar rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )}
                            <div className="mb-5">
                                <label className="block text-gray-300 text-sm font-medium mb-3">Quick Select</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {quickAmounts.map((a) => (
                                        <button key={a}
                                            onClick={() => setAmount(String(a))}
                                            className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${amount === String(a) ? 'bg-gold text-navy' : 'glass text-gray-300 hover:border-gold/40 border border-white/10'
                                                }`}>
                                            ₹{a.toLocaleString('en-IN')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Custom Amount (₹)</label>
                                <input type="number" min="10" placeholder="Enter amount (min ₹10)"
                                    value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none text-lg"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-medium mb-2">Message (optional)</label>
                                <textarea placeholder="Leave a message of hope..." value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none resize-none"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                    onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                />
                            </div>
                            {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}
                            <button onClick={handleInitiate} disabled={loading} className="btn-primary w-full py-4 text-lg">
                                {loading ? 'Processing...' : `Proceed to Pay ₹${amount || '0'} →`}
                            </button>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div key="step1"
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            className="glass rounded-2xl p-8 text-center"
                        >
                            <h2 className="font-display text-2xl font-bold text-gold mb-2">Step 2: Make Payment</h2>
                            <p className="text-gray-400 mb-6">Scan the QR code and pay ₹{amount}</p>
                            <div className="inline-block glass-gold rounded-2xl p-6 mb-6">
                                <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center mx-auto overflow-hidden p-2">
                                    <img
                                        src={`${API_BASE.replace('/api', '')}/public/qr-codes/upi-qr.png?t=${Date.now()}`}
                                        alt="UPI QR Code"
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+QR+Uploaded'; }}
                                    />
                                </div>
                            </div>
                            <div className="glass-gold rounded-xl p-5 mb-6 text-left space-y-2">
                                <p className="text-white font-semibold">✅ Instructions:</p>
                                <p className="text-gray-300 text-sm">1. Open any UPI app (GPay, PhonePe, Paytm)</p>
                                <p className="text-gray-300 text-sm">2. Scan the QR or pay to <span className="text-gold font-semibold">hopehug@upi</span></p>
                                <p className="text-gray-300 text-sm">3. Pay exactly <span className="text-gold font-bold">₹{amount}</span></p>
                                <p className="text-gray-300 text-sm">4. Note your UTR/Transaction ID from payment confirmation</p>
                            </div>
                            <div className="p-3 rounded-xl text-sm text-gray-400 glass mb-6">
                                🔖 Donation ID: <span className="text-gold font-mono text-xs">{donationId}</span>
                            </div>
                            <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-lg">
                                I've Made the Payment →
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2"
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                            className="glass rounded-2xl p-8"
                        >
                            <h2 className="font-display text-2xl font-bold text-gold mb-2">Step 3: Submit Proof</h2>
                            <p className="text-gray-400 mb-6">Provide your UTR ID and payment screenshot</p>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">UTR / Transaction ID *</label>
                                    <input type="text" placeholder="e.g. 123456789012"
                                        value={utrId} onChange={(e) => setUtrId(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        onFocus={(e) => (e.target.style.border = '1px solid #F5C842')}
                                        onBlur={(e) => (e.target.style.border = '1px solid rgba(255,255,255,0.1)')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Payment Screenshot *</label>
                                    <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${screenshot ? 'border-gold bg-gold/5' : 'border-white/20 hover:border-gold/40'
                                        }`}>
                                        {screenshot ? (
                                            <div>
                                                <div className="text-3xl mb-2">✅</div>
                                                <p className="text-gold font-semibold text-sm">{screenshot.name}</p>
                                                <p className="text-gray-400 text-xs mt-1">Click to change</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-3xl mb-2">📎</div>
                                                <p className="text-gray-300 font-semibold text-sm">Click to upload screenshot</p>
                                                <p className="text-gray-500 text-xs mt-1">PNG, JPG, JPEG — max 5MB</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden"
                                            onChange={(e) => setScreenshot(e.target.files[0])} />
                                    </label>
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-4">⚠️ {error}</p>}
                            <button onClick={handleSubmitProof} disabled={loading} className="btn-primary w-full py-4 text-lg mt-6">
                                {loading ? 'Submitting...' : 'Submit Proof ✓'}
                            </button>
                            <button onClick={() => setStep(1)} className="w-full py-3 text-gray-400 hover:text-white text-sm mt-3">
                                ← Back to Payment
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-2xl p-10 text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {Array.from({ length: 30 }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
                            </div>
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="text-8xl mb-6"
                            >
                                🎉
                            </motion.div>
                            <h2 className="font-display text-3xl font-bold text-gold mb-3">Thank You!</h2>
                            <p className="text-white text-xl mb-2">Your donation of <span className="text-gold font-bold">₹{amount}</span> is under review</p>
                            <p className="text-gray-400 mb-6">Admin will verify your payment within 24 hours. You'll receive an email confirmation.</p>
                            <div className="glass-gold rounded-xl p-4 mb-8 text-sm">
                                <p className="text-gray-300">Donation ID</p>
                                <p className="text-gold font-mono font-semibold">{donationId}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => navigate('/dashboard/donor')} className="btn-primary px-8 py-3">
                                    View My Donations
                                </button>
                                <button onClick={() => navigate('/')} className="btn-outline px-8 py-3">
                                    Back to Home
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
