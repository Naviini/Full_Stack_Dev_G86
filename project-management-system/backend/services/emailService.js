const nodemailer = require('nodemailer');

// Create a transporter using Gmail (you can change this to your email service)
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

// Alternative: Use Ethereal for testing (no credentials needed)
const getTestTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendInvitationEmail = async (invitedEmail, projectName, inviterName, invitationLink, message = '') => {
  try {
    // Use test transporter if no real credentials are configured
    let mailTransporter = transporter;
    let previewUrl = null;

    // Check if real credentials are provided
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('Using Ethereal test email service (no credentials configured)');
      mailTransporter = await getTestTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'project-management@example.com',
      to: invitedEmail,
      subject: `You're invited to join "${projectName}" project`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited! 🎉</h2>
          
          <p style="font-size: 16px; color: #555;">
            <strong>${inviterName}</strong> has invited you to join the <strong>"${projectName}"</strong> project.
          </p>

          ${message ? `<p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; color: #666;">${message}</p>` : ''}

          <p style="margin-top: 25px;">
            <a href="${invitationLink}" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accept Invitation
            </a>
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you can't click the link above, copy and paste this URL in your browser:<br>
            <code style="background-color: #f5f5f5; padding: 5px; border-radius: 3px;">${invitationLink}</code>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `
        You're Invited!
        
        ${inviterName} has invited you to join the "${projectName}" project.
        
        ${message ? `Message from ${inviterName}: ${message}` : ''}
        
        Accept the invitation here: ${invitationLink}
        
        This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    // If using test email, log preview URL
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL:', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    let mailTransporter = transporter;

    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
      mailTransporter = await getTestTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'project-management@example.com',
      to: email,
      subject: 'Welcome to Project Management System!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Project Management System! 👋</h2>
          
          <p style="font-size: 16px; color: #555;">
            Hi <strong>${name}</strong>,
          </p>

          <p style="color: #555;">
            Thank you for signing up! You can now start managing your projects and collaborating with your team.
          </p>

          <p style="margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail,
  sendWelcomeEmail,
};
