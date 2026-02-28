const NGO = require('../models/NGO');
const Donation = require('../models/Donation');

const registerNGO = async (req, res) => {
    const { orgName, description } = req.body;

    if (!orgName) {
        return res.status(400).json({ error: 'orgName is required.' });
    }

    const existing = await NGO.findOne({ userId: req.user._id });
    if (existing) {
        return res.status(409).json({ error: 'NGO already registered for this user.' });
    }

    const documents = req.files ? req.files.map((f) => `/public/uploads/docs/${f.filename}`) : [];

    const ngo = await NGO.create({
        userId: req.user._id,
        orgName,
        description: description || '',
        documents,
    });

    res.status(201).json(ngo);
};

const getMyNGO = async (req, res) => {
    const ngo = await NGO.findOne({ userId: req.user._id });
    if (!ngo) return res.status(404).json({ error: 'NGO not registered.' });
    res.json(ngo);
};

const verifyNGO = async (req, res) => {
    const { action } = req.body;

    if (!['verified', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'action must be "verified" or "rejected".' });
    }

    const ngo = await NGO.findById(req.params.id);
    if (!ngo) return res.status(404).json({ error: 'NGO not found.' });

    ngo.verificationStatus = action;
    await ngo.save();

    res.json({ message: `NGO ${action}.`, ngo });
};

const getAllNGOs = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { verificationStatus: status } : {};
    const ngos = await NGO.find(filter).populate('userId', 'name email').sort({ _id: -1 });
    res.json(ngos);
};

const getNGODonations = async (req, res) => {
    const Cause = require('../models/Cause');
    const causes = await Cause.find({ ngoId: req.user._id });
    const causeIds = causes.map((c) => c._id);
    const donations = await Donation.find({ causeId: { $in: causeIds }, status: 'verified' })
        .populate('donorId', 'name email')
        .populate('causeId', 'title')
        .sort({ createdAt: -1 });
    res.json(donations);
};

module.exports = { registerNGO, getMyNGO, verifyNGO, getAllNGOs, getNGODonations };
