"""Email service for sending transactional emails via Gmail SMTP"""

from __future__ import annotations

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template

from app.config import settings


class EmailService:
    """Gmail SMTP email service"""

    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = settings.EMAIL_ADDRESS
        self.sender_name = settings.EMAIL_FROM_NAME
        self.app_password = settings.EMAIL_APP_PASSWORD

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> bool:
        """Send email via Gmail SMTP"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.sender_name} <{self.sender_email}>"
            message["To"] = to_email

            # Attach text and HTML parts
            if text_body:
                message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))

            # Send via Gmail SMTP
            async with aiosmtplib.SMTP(hostname=self.smtp_host, port=self.smtp_port) as smtp:
                await smtp.login(self.sender_email, self.app_password)
                await smtp.sendmail(
                    self.sender_email,
                    [to_email],
                    message.as_string(),
                )

            return True
        except Exception as e:
            print(f"[ERROR] Failed to send email to {to_email}: {str(e)}")
            return False

    async def send_welcome_email(self, email: str) -> bool:
        """Send welcome email to new user"""
        subject = "Welcome to Secure Notes!"
        
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; }}
                    .header {{ color: #00C9A7; font-size: 24px; font-weight: bold; margin-bottom: 20px; }}
                    .content {{ color: #333; line-height: 1.6; margin-bottom: 20px; }}
                    .footer {{ color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">🔐 Welcome to Secure Notes!</div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Your account has been successfully created. You can now securely store and encrypt your notes.</p>
                        <p><strong>Key Features:</strong></p>
                        <ul>
                            <li>End-to-end encryption for all your notes</li>
                            <li>Secure biometric authentication</li>
                            <li>Password protected access</li>
                            <li>Real-time note synchronization</li>
                        </ul>
                        <p>If you didn't create this account, please contact us immediately.</p>
                        <p>Best regards,<br/>The Secure Notes Team</p>
                    </div>
                    <div class="footer">
                        <p>Secure Notes (Group 10) - Your privacy is our priority</p>
                    </div>
                </div>
            </body>
        </html>
        """

        text_body = """
Welcome to Secure Notes!

Your account has been successfully created. You can now securely store and encrypt your notes.

Key Features:
- End-to-end encryption for all your notes
- Secure biometric authentication
- Password protected access
- Real-time note synchronization

If you didn't create this account, please contact us immediately.

Best regards,
The Secure Notes Team

Secure Notes (Group 10) - Your privacy is our priority
        """

        return await self.send_email(email, subject, html_body, text_body)

    async def send_password_reset_email(self, email: str, reset_code: str) -> bool:
        """Send password reset email with code"""
        subject = "Password Reset Code - Secure Notes"
        
        html_body = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; }}
                    .header {{ color: #00C9A7; font-size: 24px; font-weight: bold; margin-bottom: 20px; }}
                    .code-box {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }}
                    .code {{ font-size: 32px; font-weight: bold; color: #00C9A7; letter-spacing: 5px; font-family: monospace; }}
                    .warning {{ color: #EF4444; font-weight: bold; margin-top: 20px; }}
                    .content {{ color: #333; line-height: 1.6; margin-bottom: 20px; }}
                    .footer {{ color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">🔐 Password Reset Request</div>
                    <div class="content">
                        <p>Hi,</p>
                        <p>We received a request to reset your password. Use the code below to complete the password reset process.</p>
                        <div class="code-box">
                            <div class="code">{reset_code}</div>
                        </div>
                        <p>This code will expire in 30 minutes.</p>
                        <p class="warning">⚠️ If you did not request this, please ignore this email. Your password has NOT been changed.</p>
                        <p>For security reasons, never share this code with anyone.</p>
                        <p>Best regards,<br/>The Secure Notes Team</p>
                    </div>
                    <div class="footer">
                        <p>Secure Notes (Group 10) - Your privacy is our priority</p>
                    </div>
                </div>
            </body>
        </html>
        """

        text_body = f"""
Password Reset Request - Secure Notes

Hi,

We received a request to reset your password. Use the code below to complete the password reset process.

RESET CODE: {reset_code}

This code will expire in 30 minutes.

⚠️ If you did not request this, please ignore this email. Your password has NOT been changed.

For security reasons, never share this code with anyone.

Best regards,
The Secure Notes Team

Secure Notes (Group 10) - Your privacy is our priority
        """

        return await self.send_email(email, subject, html_body, text_body)

    async def send_password_reset_confirmation(self, email: str) -> bool:
        """Send confirmation email after successful password reset"""
        subject = "Password Reset Successful - Secure Notes"
        
        html_body = """
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; }}
                    .header {{ color: #00C9A7; font-size: 24px; font-weight: bold; margin-bottom: 20px; }}
                    .success {{ color: #10B981; font-weight: bold; margin: 20px 0; }}
                    .content {{ color: #333; line-height: 1.6; margin-bottom: 20px; }}
                    .footer {{ color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">🔐 Password Reset Successful</div>
                    <div class="content">
                        <p>Hi,</p>
                        <p class="success">✅ Your password has been successfully reset!</p>
                        <p>You can now log in with your new password.</p>
                        <p><strong>Security Tips:</strong></p>
                        <ul>
                            <li>Make sure your password is strong and unique</li>
                            <li>Never share your password with anyone</li>
                            <li>Enable biometric authentication for extra security</li>
                            <li>Log out from other devices after resetting password</li>
                        </ul>
                        <p>If you did not request this change, please reset your password immediately.</p>
                        <p>Best regards,<br/>The Secure Notes Team</p>
                    </div>
                    <div class="footer">
                        <p>Secure Notes (Group 10) - Your privacy is our priority</p>
                    </div>
                </div>
            </body>
        </html>
        """

        text_body = """
Password Reset Successful - Secure Notes

Hi,

Your password has been successfully reset!

You can now log in with your new password.

Security Tips:
- Make sure your password is strong and unique
- Never share your password with anyone
- Enable biometric authentication for extra security
- Log out from other devices after resetting password

If you did not request this change, please reset your password immediately.

Best regards,
The Secure Notes Team

Secure Notes (Group 10) - Your privacy is our priority
        """

        return await self.send_email(email, subject, html_body, text_body)


email_service = EmailService()
