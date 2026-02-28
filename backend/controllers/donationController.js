const Donation = require('../models/Donation');
const Cause = require('../models/Cause');
const User = require('../models/User');
const path = require('path');
const { sendDonationVerifiedEmail } = require('../utils/mailer');

const initiateDonation = async (req, res) => {
    const { causeId, amount } = req.body;

    if (!causeId || !amount || amount < 10) {
        return res.status(400).json({ error: 'causeId and amount (min ₹10) are required.' });
    }

    const cause = await Cause.findById(causeId);
    if (!cause || cause.status !== 'active') {
        return res.status(404).json({ error: 'Cause not found or not active.' });
    }

    const donation = await Donation.create({
        donorId: req.user._id,
        causeId,
        amount,
        timeline: [{ status: 'initiated', message: 'Donation initiated by donor.' }],
    });

    const qrCodePath = '/public/qr-codes/upi-qr.png';

    res.status(201).json({
        donationId: donation._id,
        qrCodePath,
        amount: donation.amount,
        upiId: 'hopehug@upi',
    });
};

const submitProof = async (req, res) => {
    const { donationId, utrId } = req.body;

    if (!donationId || !utrId) {
        return res.status(400).json({ error: 'donationId and utrId are required.' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
        return res.status(404).json({ error: 'Donation not found.' });
    }
    if (donation.donorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized.' });
    }

    const screenshotPath = req.file ? `/public/uploads/${req.file.filename}` : '';

    donation.utrId = utrId;
    donation.screenshotPath = screenshotPath;
    donation.status = 'pending';
    donation.timeline.push({ status: 'proof_submitted', message: 'Payment proof submitted by donor.' });

    await donation.save();

    res.json({ message: 'Proof submitted. Awaiting admin verification.', donation });
};

const getMyDonations = async (req, res) => {
    const donations = await Donation.find({ donorId: req.user._id })
        .populate('causeId', 'title description images')
        .sort({ createdAt: -1 });

    res.json(donations);
};

const verifyDonation = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    if (!['verified', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'action must be "verified" or "rejected".' });
    }

    const donation = await Donation.findById(id).populate('donorId', 'name email').populate('causeId', 'title');
    if (!donation) {
        return res.status(404).json({ error: 'Donation not found.' });
    }

    donation.status = action;
    const msg = action === 'verified' ? 'Admin verified the donation.' : 'Admin rejected the donation.';
    donation.timeline.push({ status: action, message: msg });

    if (action === 'verified') {
        await Cause.findByIdAndUpdate(donation.causeId._id, {
            $inc: { currentAmount: donation.amount },
        });
        await User.findByIdAndUpdate(donation.donorId._id, {
            $inc: { totalDonated: donation.amount },
        });

        const io = req.app.get('io');
        if (io) {
            io.to(donation.donorId._id.toString()).emit('donation:verified', {
                donationId: donation._id,
                status: 'verified',
                message: `Your donation of ₹${donation.amount} for ${donation.causeId.title} has been verified!`,
            });
        }

        try {
            await sendDonationVerifiedEmail({
                to: donation.donorId.email,
                donorName: donation.donorId.name,
                amount: donation.amount,
                causeName: donation.causeId.title,
                utrId: donation.utrId,
                date: new Date().toLocaleDateString('en-IN'),
            });
        } catch { }
    }

    await donation.save();

    res.json({ message: `Donation ${action}.`, donation });
};

const getAllDonations = async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const donations = await Donation.find(filter)
        .populate('donorId', 'name email')
        .populate('causeId', 'title')
        .sort({ createdAt: -1 });

    res.json(donations);
};

const getRecentDonations = async (req, res) => {
    const donations = await Donation.find({ status: 'verified' })
        .populate('donorId', 'name')
        .populate('causeId', 'title')
        .sort({ createdAt: -1 })
        .limit(5);
    res.json(donations.map((d) => ({
        donorName: d.donorId?.name || 'Anonymous',
        causeName: d.causeId?.title || '',
        amount: d.amount,
        date: d.createdAt,
    })));
};

module.exports = { initiateDonation, submitProof, getMyDonations, verifyDonation, getAllDonations, getRecentDonations };

