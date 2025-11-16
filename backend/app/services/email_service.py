"""
Email service for sending OTP codes and notifications.
Supports both SendGrid and SMTP.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    """Email service for sending emails via SendGrid or SMTP."""

    @staticmethod
    def send_otp_email(to_email: str, otp: str, user_name: Optional[str] = None) -> bool:
        """
        Send OTP code via email.

        Args:
            to_email: Recipient email address
            otp: 6-digit OTP code
            user_name: Optional user name for personalization

        Returns:
            True if email sent successfully, False otherwise
        """
        subject = "Your CCAI Jobs Login Code"

        # Create personalized greeting
        greeting = f"Hello {user_name}," if user_name else "Hello,"

        # HTML email body
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .otp-code {{
                    background: #ffffff;
                    border: 2px dashed #667eea;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #667eea;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }}
                .warning {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 12px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 CCAI Jobs</h1>
                    <p>Your One-Time Password</p>
                </div>
                <div class="content">
                    <p>{greeting}</p>
                    <p>You requested to log in to your CCAI Jobs account. Use the code below to complete your sign-in:</p>

                    <div class="otp-code">{otp}</div>

                    <p><strong>This code will expire in 10 minutes.</strong></p>

                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> Never share this code with anyone. CCAI Jobs will never ask for your OTP via phone or email.
                    </div>

                    <p>If you didn't request this code, please ignore this email. Your account remains secure.</p>
                </div>
                <div class="footer">
                    <p>© 2025 CCAI Jobs Platform. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text version (fallback)
        text_content = f"""
        CCAI Jobs - Your Login Code

        {greeting}

        You requested to log in to your CCAI Jobs account.

        Your one-time password is: {otp}

        This code will expire in 10 minutes.

        Security Notice: Never share this code with anyone.

        If you didn't request this code, please ignore this email.

        © 2025 CCAI Jobs Platform
        """

        # Try SendGrid first if API key is configured
        if settings.SENDGRID_API_KEY:
            try:
                return EmailService._send_via_sendgrid(to_email, subject, html_content, text_content)
            except Exception as e:
                print(f"SendGrid failed, falling back to SMTP: {e}")

        # Fall back to SMTP
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            return EmailService._send_via_smtp(to_email, subject, html_content, text_content)

        # No email service configured
        print(f"⚠️ Email service not configured. OTP code for {to_email}: {otp}")
        return False

    @staticmethod
    def _send_via_sendgrid(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send email via SendGrid API."""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content

            message = Mail(
                from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )

            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)

            return response.status_code == 202
        except Exception as e:
            print(f"SendGrid error: {e}")
            raise

    @staticmethod
    def _send_via_smtp(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = settings.SMTP_FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject

            # Attach plain text and HTML versions
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)

            return True
        except Exception as e:
            print(f"SMTP error: {e}")
            return False

    @staticmethod
    def send_welcome_email(to_email: str, user_name: str) -> bool:
        """
        Send welcome email to new users.

        Args:
            to_email: Recipient email address
            user_name: User's name

        Returns:
            True if email sent successfully, False otherwise
        """
        subject = "Welcome to CCAI Jobs! 🎉"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .feature {{ margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to CCAI Jobs!</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    <p>Welcome to CCAI Jobs - your AI-powered career platform! We're excited to have you on board.</p>

                    <h3>🚀 Get Started:</h3>
                    <div class="feature">📄 Upload your resume for AI-powered ATS analysis</div>
                    <div class="feature">🔍 Search and match with perfect job opportunities</div>
                    <div class="feature">🤖 Chat with our AI career assistant</div>
                    <div class="feature">🎯 Prepare for interviews with AI-generated questions</div>
                    <div class="feature">🌐 Connect with other AI professionals</div>

                    <p>Ready to accelerate your career? <a href="{settings.FRONTEND_URL}">Log in now</a></p>

                    <p>Best regards,<br>The CCAI Jobs Team</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Welcome to CCAI Jobs!

        Hi {user_name},

        Welcome to CCAI Jobs - your AI-powered career platform!

        Get Started:
        - Upload your resume for AI-powered analysis
        - Search and match with job opportunities
        - Chat with our AI career assistant
        - Prepare for interviews
        - Connect with AI professionals

        Best regards,
        The CCAI Jobs Team
        """

        if settings.SENDGRID_API_KEY:
            try:
                return EmailService._send_via_sendgrid(to_email, subject, html_content, text_content)
            except:
                pass

        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            return EmailService._send_via_smtp(to_email, subject, html_content, text_content)

        return False


# Create singleton instance
email_service = EmailService()
