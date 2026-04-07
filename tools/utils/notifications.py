"""Notification utilities for alerts (Slack webhook or email)."""

import os
import json
import logging
import smtplib
from email.mime.text import MIMEText
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def send_slack_notification(message: str, level: str = "info") -> bool:
    """Send a notification via Slack webhook.

    Args:
        message: The message text
        level: 'info', 'warning', or 'critical'

    Returns:
        True if sent successfully
    """
    webhook_url = os.getenv("NOTIFICATION_SLACK_WEBHOOK")
    if not webhook_url:
        logger.debug("No Slack webhook configured — skipping notification")
        return False

    try:
        import requests

        emoji = {"info": ":information_source:", "warning": ":warning:", "critical": ":rotating_light:"}.get(level, ":speech_balloon:")

        payload = {
            "text": f"{emoji} *Jockey Dashboard Alert*\n{message}",
        }

        resp = requests.post(webhook_url, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info(f"Slack notification sent: {message[:50]}...")
        return True
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")
        return False


def send_email_notification(subject: str, body: str) -> bool:
    """Send a notification via SMTP email.

    Returns:
        True if sent successfully
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    alert_to = os.getenv("ALERT_EMAIL_TO")

    if not all([smtp_host, smtp_user, smtp_pass, alert_to]):
        logger.debug("SMTP not configured — skipping email notification")
        return False

    try:
        msg = MIMEText(body)
        msg["Subject"] = f"[Jockey Dashboard] {subject}"
        msg["From"] = smtp_user
        msg["To"] = alert_to

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        logger.info(f"Email notification sent: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False


def notify(message: str, level: str = "info"):
    """Send notification via all configured channels."""
    sent = False

    if send_slack_notification(message, level):
        sent = True

    if level in ("warning", "critical"):
        subject = f"{'CRITICAL' if level == 'critical' else 'Warning'}: {message[:60]}"
        if send_email_notification(subject, message):
            sent = True

    if not sent:
        logger.warning(f"No notification channels configured. Alert: {message}")
