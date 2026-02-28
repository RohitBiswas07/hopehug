require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Cause = require('../models/Cause');
const Donation = require('../models/Donation');

const MONGO_URI = process.env.MONGO_URI;

const seed = async () => {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await NGO.deleteMany({});
    await Cause.deleteMany({});
    await Donation.deleteMany({});
    console.log('Cleared existing data');

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const donorPass = await bcrypt.hash('Donor@123', 10);
    const ngoPass = await bcrypt.hash('Ngo@123', 10);

    const admin = await User.create({
        name: 'Admin',
        email: 'admin@hopehug.com',
        password: hashedPassword,
        role: 'admin',
    });
    console.log('Admin created:', admin.email);

    const ngoUser1 = await User.create({ name: 'Mitali Foundation', email: 'mitali@hopehug.com', password: ngoPass, role: 'ngo' });
    const ngoUser2 = await User.create({ name: 'Asha Kiran Trust', email: 'ashakiran@hopehug.com', password: ngoPass, role: 'ngo' });
    const ngoUser3 = await User.create({ name: 'Green Earth India', email: 'greenearth@hopehug.com', password: ngoPass, role: 'ngo' });

    const ngo1 = await NGO.create({ userId: ngoUser1._id, orgName: 'Mitali Foundation', verificationStatus: 'verified' });
    const ngo2 = await NGO.create({ userId: ngoUser2._id, orgName: 'Asha Kiran Trust', verificationStatus: 'verified' });
    await NGO.create({ userId: ngoUser3._id, orgName: 'Green Earth India', verificationStatus: 'pending' });
    console.log('NGOs created');

    const causes = await Cause.insertMany([
        {
            title: 'Clean Water for Rural Bengal',
            description: 'Providing safe drinking water to over 500 rural families who lack access to clean water sources. This initiative installs water purification systems in remote villages.',
            goalAmount: 75000,
            currentAmount: 48000,
            ngoId: ngoUser1._id,
            fundedBy: 'Tata Trusts',
            status: 'active',
        },
        {
            title: 'Education for Street Children',
            description: 'Funding education, books, and uniforms for underprivileged children living on the streets of Kolkata. Every child deserves a chance to learn.',
            goalAmount: 50000,
            currentAmount: 32000,
            ngoId: ngoUser1._id,
            fundedBy: 'HCL Foundation',
            status: 'active',
        },
        {
            title: 'Medical Aid for Elderly',
            description: 'Providing free medical checkups, medicines, and care for elderly citizens without family support. Health is a right, not a privilege.',
            goalAmount: 100000,
            currentAmount: 67000,
            ngoId: ngoUser2._id,
            fundedBy: 'Infosys Foundation',
            status: 'active',
        },
        {
            title: 'Food for Flood Victims',
            description: 'Emergency food relief for families displaced by devastating floods in Assam and Bihar. Providing dry rations, clean water, and emergency supplies.',
            goalAmount: 200000,
            currentAmount: 145000,
            ngoId: ngoUser2._id,
            fundedBy: 'Wipro Cares',
            status: 'active',
        },
        {
            title: 'School Supplies for Tribal Kids',
            description: 'Distributing school bags, notebooks, pencils, and learning materials to tribal children in Jharkhand who walk miles to attend school.',
            goalAmount: 40000,
            currentAmount: 18000,
            ngoId: ngoUser1._id,
            fundedBy: 'Reliance Foundation',
            status: 'active',
        },
    ]);
    console.log('Causes created:', causes.length);

    const donors = [];
    const donorNames = ['Rohit Sharma', 'Priya Patel', 'Arjun Mehta', 'Sneha Gupta', 'Vikram Singh'];
    const donorEmails = ['rohit@hopehug.com', 'priya@hopehug.com', 'arjun@hopehug.com', 'sneha@hopehug.com', 'vikram@hopehug.com'];
    for (let i = 0; i < 5; i++) {
        const d = await User.create({
            name: donorNames[i],
            email: donorEmails[i],
            password: donorPass,
            role: 'donor',
        });
        donors.push(d);
    }
    console.log('Donors created:', donors.length);

    const donationData = [
        { donorIdx: 0, causeIdx: 0, amount: 5000, utrId: 'UTR100001' },
        { donorIdx: 0, causeIdx: 1, amount: 2500, utrId: 'UTR100002' },
        { donorIdx: 1, causeIdx: 2, amount: 10000, utrId: 'UTR100003' },
        { donorIdx: 1, causeIdx: 3, amount: 7500, utrId: 'UTR100004' },
        { donorIdx: 2, causeIdx: 0, amount: 3000, utrId: 'UTR100005' },
        { donorIdx: 2, causeIdx: 4, amount: 5000, utrId: 'UTR100006' },
        { donorIdx: 3, causeIdx: 1, amount: 15000, utrId: 'UTR100007' },
        { donorIdx: 3, causeIdx: 3, amount: 8000, utrId: 'UTR100008' },
        { donorIdx: 4, causeIdx: 2, amount: 20000, utrId: 'UTR100009' },
        { donorIdx: 4, causeIdx: 4, amount: 4000, utrId: 'UTR100010' },
    ];

    for (const dd of donationData) {
        await Donation.create({
            donorId: donors[dd.donorIdx]._id,
            causeId: causes[dd.causeIdx]._id,
            amount: dd.amount,
            utrId: dd.utrId,
            status: 'verified',
            timeline: [
                { status: 'initiated', timestamp: new Date(Date.now() - 86400000 * 3) },
                { status: 'proof_submitted', timestamp: new Date(Date.now() - 86400000 * 2) },
                { status: 'verified', timestamp: new Date(Date.now() - 86400000) },
            ],
        });
    }
    console.log('Donations created: 10');

    for (const d of donors) {
        const total = donationData.filter((dd) => donors[dd.donorIdx]._id.equals(d._id)).reduce((s, dd) => s + dd.amount, 0);
        await User.findByIdAndUpdate(d._id, { totalDonated: total });
    }

    const ngo1Total = donationData.filter((dd) => [0, 1, 4].includes(dd.causeIdx)).reduce((s, dd) => s + dd.amount, 0);
    const ngo2Total = donationData.filter((dd) => [2, 3].includes(dd.causeIdx)).reduce((s, dd) => s + dd.amount, 0);
    await NGO.findByIdAndUpdate(ngo1._id, { totalReceived: ngo1Total });
    await NGO.findByIdAndUpdate(ngo2._id, { totalReceived: ngo2Total });

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@hopehug.com / Admin@123');
    console.log('Donor: rohit@hopehug.com / Donor@123');
    console.log('NGO:   mitali@hopehug.com / Ngo@123');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
