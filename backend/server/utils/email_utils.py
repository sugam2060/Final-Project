"""
Utility functions for sending emails via SMTP.
"""
import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


async def send_application_accepted_email(
    applicant_email: str,
    applicant_name: Optional[str],
    job_title: str,
    company_name: str,
) -> bool:
    """
    Send an email notification to an applicant when their application is accepted.
    
    Args:
        applicant_email: Email address of the applicant
        applicant_name: Name of the applicant (optional)
        job_title: Title of the job they applied for
        company_name: Name of the company
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Check if email is enabled and configured
    if not settings.EMAIL_ENABLED:
        logger.info("Email sending is disabled. Skipping email notification.")
        return False
    
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP not configured. Email will not be sent. "
            f"SMTP_HOST: {bool(settings.SMTP_HOST)}, "
            f"SMTP_USER: {bool(settings.SMTP_USER)}, "
            f"SMTP_PASSWORD: {bool(settings.SMTP_PASSWORD)}"
        )
        return False
    
    if not settings.SMTP_FROM_EMAIL:
        logger.warning("SMTP_FROM_EMAIL not configured. Email will not be sent.")
        return False
    
    logger.info(f"Attempting to send acceptance email to {applicant_email} for job: {job_title}")
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Congratulations! Your application for {job_title} has been accepted"
        
        # Set From header with name if provided
        if settings.SMTP_FROM_NAME:
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        else:
            msg["From"] = settings.SMTP_FROM_EMAIL
        
        msg["To"] = applicant_email
        
        # Set Reply-To if configured
        if settings.SMTP_REPLY_TO:
            msg["Reply-To"] = settings.SMTP_REPLY_TO
        
        # Create email body
        applicant_display_name = applicant_name if applicant_name else "Applicant"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .job-details {{
                    background-color: white;
                    padding: 15px;
                    margin: 20px 0;
                    border-left: 4px solid #4CAF50;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Application Accepted!</h1>
            </div>
            <div class="content">
                <p>Dear {applicant_display_name},</p>
                
                <p>We are pleased to inform you that your application has been <strong>accepted</strong>!</p>
                
                <div class="job-details">
                    <h3>Job Details:</h3>
                    <p><strong>Position:</strong> {job_title}</p>
                    <p><strong>Company:</strong> {company_name}</p>
                </div>
                
                <p>Congratulations on this achievement! The hiring team was impressed with your qualifications and experience.</p>
                
                <p>You will be contacted shortly with further details about the next steps in the hiring process.</p>
                
                <p>We look forward to working with you!</p>
                
                <p>Best regards,<br>
                {company_name} Hiring Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>JobPortal - Connecting Talent with Opportunity</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
Dear {applicant_display_name},

We are pleased to inform you that your application has been ACCEPTED!

Job Details:
- Position: {job_title}
- Company: {company_name}

Congratulations on this achievement! The hiring team was impressed with your qualifications and experience.

You will be contacted shortly with further details about the next steps in the hiring process.

We look forward to working with you!

Best regards,
{company_name} Hiring Team

---
This is an automated message. Please do not reply to this email.
JobPortal - Connecting Talent with Opportunity
        """
        
        # Attach both plain text and HTML versions
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        
        # Send email in background thread (non-blocking)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _send_email_sync,
            msg,
            applicant_email
        )
        
        logger.info(f"Acceptance email sent successfully to {applicant_email}")
        return True
        
    except Exception as e:
        logger.error(
            f"Failed to send acceptance email to {applicant_email}: {str(e)}",
            exc_info=True  # Include full traceback
        )
        return False


def _send_email_sync(msg: MIMEMultipart, recipient: str) -> None:
    """
    Synchronous helper function to send email via SMTP.
    This is run in a thread pool to avoid blocking the event loop.
    """
    server = None
    try:
        logger.info(f"Connecting to SMTP server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        
        # Create SMTP connection with timeout
        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT)
            logger.info("Starting TLS...")
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT)
        
        logger.info(f"Logging in to SMTP server as {settings.SMTP_USER}")
        # Login
        server.login(settings.SMTP_USER, str(settings.SMTP_PASSWORD))
        
        logger.info(f"Sending email to {recipient}")
        # Send email
        server.send_message(msg)
        
        logger.info(f"Email sent successfully to {recipient}")
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {str(e)}")
        raise
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending email: {str(e)}", exc_info=True)
        raise
    finally:
        # Close connection if it was opened
        if server:
            try:
                server.quit()
            except Exception as e:
                logger.warning(f"Error closing SMTP connection: {str(e)}")


