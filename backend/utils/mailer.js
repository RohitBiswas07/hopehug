const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendDonationVerifiedEmail = async ({ to, donorName, amount, causeName, utrId, date }) => {
    const mailOptions = {
        from: `"HopeHug | Mitali Foundation" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Your donation of ₹${amount} has been verified! 🎉`,
        html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F2C; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0A0F2C, #1a2456); padding: 40px; text-align: center;">
          <h1 style="color: #F5C842; margin: 0; font-size: 28px;">HopeHug</h1>
          <p style="color: #aab0d0; margin: 8px 0 0;">Powered by Mitali Foundation</p>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #F5C842;">Donation Verified! ✅</h2>
          <p>Dear <strong>${donorName}</strong>,</p>
          <p>We're happy to inform you that your donation has been successfully verified.</p>
          <div style="background: rgba(245,200,66,0.1); border: 1px solid #F5C842; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Cause:</strong> ${causeName}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> ₹${amount}</p>
            <p style="margin: 4px 0;"><strong>UTR ID:</strong> ${utrId}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${date}</p>
          </div>
          <p>Your generosity is making a real difference. Thank you for trusting HopeHug!</p>
          <p style="color: #aab0d0; font-size: 12px; margin-top: 30px;">HopeHug | Mitali Foundation — Transparent Giving</p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendDonationVerifiedEmail };
