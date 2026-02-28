const Cause = require('../models/Cause');

const createCause = async (req, res) => {
    const { title, description, goalAmount, fundedBy, ngoId } = req.body;

    if (!title || !description || !goalAmount) {
        return res.status(400).json({ error: 'title, description and goalAmount are required.' });
    }

    const images = req.files ? req.files.map((f) => `/public/uploads/causes/${f.filename}`) : [];

    const cause = await Cause.create({
        title,
        description,
        goalAmount,
        ngoId: ngoId || req.user._id,
        images,
        fundedBy: fundedBy || '',
        status: 'active',
    });

    res.status(201).json(cause);
};

const getCauses = async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : { status: 'active' };
    const causes = await Cause.find(filter).populate('ngoId', 'name').sort({ createdAt: -1 });
    res.json(causes);
};

const getAllCauses = async (req, res) => {
    const causes = await Cause.find().populate('ngoId', 'name').sort({ createdAt: -1 });
    res.json(causes);
};

const getCauseById = async (req, res) => {
    const cause = await Cause.findById(req.params.id).populate('ngoId', 'name');
    if (!cause) return res.status(404).json({ error: 'Cause not found.' });
    res.json(cause);
};

const updateProgress = async (req, res) => {
    const { currentAmount } = req.body;
    const cause = await Cause.findById(req.params.id);
    if (!cause) return res.status(404).json({ error: 'Cause not found.' });
    if (cause.ngoId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized.' });
    }

    if (currentAmount !== undefined) cause.currentAmount = currentAmount;

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map((f) => `/public/uploads/causes/${f.filename}`);
        cause.images.push(...newImages);
    }

    await cause.save();
    res.json(cause);
};

const updateCause = async (req, res) => {
    const { title, description, goalAmount, status, fundedBy } = req.body;
    const cause = await Cause.findById(req.params.id);
    if (!cause) return res.status(404).json({ error: 'Cause not found.' });
    if (cause.ngoId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized.' });
    }

    if (title) cause.title = title;
    if (description) cause.description = description;
    if (goalAmount) cause.goalAmount = goalAmount;
    if (status) cause.status = status;
    if (fundedBy !== undefined) cause.fundedBy = fundedBy;

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map((f) => `/public/uploads/causes/${f.filename}`);
        cause.images = newImages;
    }

    await cause.save();
    res.json(cause);
};

const deleteCause = async (req, res) => {
    const cause = await Cause.findById(req.params.id);
    if (!cause) return res.status(404).json({ error: 'Cause not found.' });
    await Cause.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cause deleted.' });
};

const getNGOCauses = async (req, res) => {
    const causes = await Cause.find({ ngoId: req.user._id }).sort({ createdAt: -1 });
    res.json(causes);
};

module.exports = { createCause, getCauses, getAllCauses, getCauseById, updateProgress, updateCause, deleteCause, getNGOCauses };
