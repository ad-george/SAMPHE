interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private privateKey: string;

  constructor() {
    this.serviceId = process.env.EMAILJS_SERVICE_ID || "";
    this.templateId = process.env.EMAILJS_TEMPLATE_ID || "";
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY || "";
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY || "";
  }

  async sendEmail(options: EmailOptions) {
    try {
      const payload = {
        service_id: this.serviceId,
        template_id: this.templateId,
        user_id: this.publicKey,
        accessToken: this.privateKey,
        template_params: {
          to_email: options.to,
          subject: options.subject,
          message: options.html,
        },
      };

      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`EmailJS failed: ${res.status} ${text}`);
      }

      console.log("✅ Email sent via EmailJS to:", options.to);
    } catch (error) {
      console.error("❌ EmailJS sending failed:", error);
      throw error;
    }
  }

  async sendLicenseExpiryWarning(
    email: string,
    universityName: string,
    daysLeft: number,
    expiryDate: Date,
  ) {
    const subject = `⚠️ License Expiring Soon - ${universityName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
          <p style="color: #718096; margin: 5px 0 0;">Smart University Attendance Management Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <h2 style="color: #2d3748; font-size: 20px;">⚠️ License Expiring Soon</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Dear ${universityName} Administrator,
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Your license will expire in <strong style="color: #e53e3e; font-size: 18px;">${daysLeft} days</strong>.
          </p>
          <div style="background: #fefcbf; border-left: 4px solid #ecc94b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #744210; font-size: 14px;">
              <strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}
            </p>
            <p style="margin: 5px 0 0; color: #744210; font-size: 14px;">
              <strong>Action Required:</strong> Please renew your license to avoid service interruption.
            </p>
          </div>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            To renew your license, please visit the Subscription page in your SUAMP dashboard.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/university-admin/subscription" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Renew Now
            </a>
          </div>
          <p style="color: #718096; font-size: 14px; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            If you have any questions, please contact support.
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendLicenseExpired(email: string, universityName: string) {
    const subject = `🚫 License Expired - ${universityName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
          <p style="color: #718096; margin: 5px 0 0;">Smart University Attendance Management Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <h2 style="color: #e53e3e; font-size: 20px;">🚫 License Expired</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Dear ${universityName} Administrator,
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Your license has <strong style="color: #e53e3e;">expired</strong>.
          </p>
          <div style="background: #fed7d7; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #9b2c2c; font-size: 14px;">
              <strong>Action Required:</strong> Your system access has been suspended. Please renew immediately to restore access.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/university-admin/subscription" style="background: #e53e3e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Renew Now
            </a>
          </div>
          <p style="color: #718096; font-size: 14px; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            If you have any questions, please contact support.
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendLicenseRequestNotification(
    platformAdminEmail: string,
    universityName: string,
    adminName: string,
    adminEmail: string,
    adminPhone: string,
    currentLicenseCode: string,
  ) {
    const subject = `🔑 License Renewal Request - ${universityName}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
        <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
        <p style="color: #718096; margin: 5px 0 0;">License Renewal Request</p>
      </div>
      <div style="padding: 20px 0;">
        <h2 style="color: #2d3748; font-size: 18px;">🔑 New License Request</h2>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          <strong>${universityName}</strong> has requested a new license.
        </p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>University:</strong> ${universityName}</p>
          <p style="margin: 5px 0;"><strong>Admin:</strong> ${adminName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${adminEmail}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${adminPhone}</p>
          <p style="margin: 5px 0;"><strong>Current License:</strong> ${currentLicenseCode}</p>
        </div>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Please generate a new license code and share it with the university admin.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/platform-admin/licenses" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to License Management
          </a>
        </div>
      </div>
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
        <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
      </div>
    </div>
  `;

    await this.sendEmail({ to: platformAdminEmail, subject, html });
  }

  async sendLicenseRevoked(
    email: string,
    universityName: string,
    graceDaysLeft: number,
  ) {
    const subject = `⚠️ License Revoked - ${universityName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
          <p style="color: #718096; margin: 5px 0 0;">Smart University Attendance Management Platform</p>
        </div>
        <div style="padding: 20px 0;">
          <h2 style="color: #d69e2e; font-size: 20px;">⚠️ License Revoked</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Dear ${universityName} Administrator,
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Your license has been <strong style="color: #d69e2e;">revoked</strong>.
          </p>
          <div style="background: #fefcbf; border-left: 4px solid #ecc94b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #744210; font-size: 14px;">
              <strong>Grace Period:</strong> ${graceDaysLeft} days remaining
            </p>
            <p style="margin: 5px 0 0; color: #744210; font-size: 14px;">
              <strong>Action Required:</strong> Please contact support immediately to resolve this issue.
            </p>
          </div>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            After the grace period ends, system access will be permanently blocked.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/support" style="background: #d69e2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>
          <p style="color: #718096; font-size: 14px; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            Please contact support to resolve this issue.
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetLink: string,
  ) {
    const subject = "Reset Your SUAMP Password";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
          <p style="color: #718096; margin: 5px 0 0;">Password Reset Request</p>
        </div>
        <div style="padding: 20px 0;">
          <h2 style="color: #2d3748; font-size: 20px;">Reset Your Password</h2>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            Hello ${fullName},
          </p>
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
            We received a request to reset your SUAMP password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #718096; font-size: 13px;">
            Or copy this link: <br/>
            <span style="word-break: break-all; color: #3182ce;">${resetLink}</span>
          </p>
          <div style="background: #fefcbf; border-left: 4px solid #ecc94b; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #744210; font-size: 13px;">
              ⚠ This link expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.
            </p>
          </div>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
          <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
        </div>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }
}

export default new EmailService();
