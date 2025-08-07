// server/utils/emailSender.js
const nodemailer = require('nodemailer');




const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465 (SSL), false for other ports (like 587 for TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    
});

const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.SENDER_EMAIL || 'noreply@scholara.com', // Your verified sender email
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text, // Fallback for plain text clients
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email} with subject: ${options.subject}`);
        return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
        console.error(`Error sending email to ${options.email}:`, error);
        // Provide a more user-friendly error message
        throw new Error('Failed to send email. Please check server logs for details.');
    }
};

module.exports = sendEmail;
