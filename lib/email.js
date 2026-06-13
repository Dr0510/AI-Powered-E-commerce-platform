/**
 * Centralized Email Service
 * Handles all email sending through Resend with retry logic,
 * deduplication, validation, and detailed logging.
 */

import { Resend } from "resend";

// ── Retry Configuration ──
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// ── In-memory dedup to prevent duplicate sends within a session ──
const sentKeys = new Set();

// ── Resend client (lazy initialized) ──
let _resendClient = null;

function getResend() {
  if (!_resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return _resendClient;
}

/**
 * Get the configured from-email address
 */
export function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || process.env.EMAIL_FROM || "";
}

/**
 * Validate an email address (basic format + not empty)
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email address is empty" };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: "Email address is empty" };
  }
  // RFC5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: `Invalid email format: ${email}` };
  }
  return { valid: true, email: trimmed };
}

/**
 * Check if the onboarding sender restriction would skip this send.
 * Returns an object with { canSend, reason }.
 */
export function checkOnboardingRestriction(toEmail) {
  const fromEmail = getFromEmail();
  const isOnboarding = fromEmail.toLowerCase() === "onboarding@resend.dev" ||
    fromEmail.toLowerCase().endsWith("@resend.dev");

  if (!isOnboarding) {
    return { canSend: true };
  }

  const testingEmail = process.env.RESEND_TEST_EMAIL;
  if (!testingEmail) {
    return {
      canSend: false,
      reason: `RESEND_FROM_EMAIL is onboarding@resend.dev but RESEND_TEST_EMAIL is not set. Add RESEND_TEST_EMAIL to .env`,
    };
  }

  if (toEmail.toLowerCase() !== testingEmail.toLowerCase()) {
    return {
      canSend: false,
      reason: `Onboarding sender can only send to ${testingEmail}, not to ${toEmail}. Verify a custom domain in Resend for production.`,
    };
  }

  return { canSend: true };
}

/**
 * Generate a deduplication key for an email send
 */
function dedupKey({ to, subject, type }) {
  return `${type || "general"}::${to}::${subject}`;
}

/**
 * Mark an email as sent in the dedup tracker
 */
function markSent(key) {
  sentKeys.add(key);
  // Clear after 5 minutes to prevent memory leaks
  setTimeout(() => sentKeys.delete(key), 5 * 60 * 1000);
}

/**
 * Check if this email was already sent recently (in-memory dedup)
 */
function wasRecentlySent(key) {
  return sentKeys.has(key);
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt) {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
    RETRY_CONFIG.maxDelayMs,
  );
  // Add jitter ±25%
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

/**
 * Centralized email send with:
 * - Address validation
 * - Onboarding sender restriction check
 * - Deduplication (in-memory)
 * - Retry with exponential backoff
 * - Structured logging
 * - Error wrapping
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @param {string} options.text - Plain text fallback
 * @param {string} [options.type] - Email type for dedup key (e.g., "receipt", "order-confirmation")
 * @param {Object} [options.metadata] - Additional metadata for logging
 * @param {boolean} [options.skipDedup] - Skip deduplication check if true
 * @returns {Promise<{success: boolean, emailId?: string, error?: string, skipped?: boolean, reason?: string}>}
 */
export async function sendEmail(options) {
  const { to, subject, html, text, type, metadata = {}, skipDedup = false } = options;

  const logPrefix = `[Email:${type || "general"}]`;

  // 1. Validate recipient email
  const validation = validateEmail(to);
  if (!validation.valid) {
    const msg = `${logPrefix} Invalid recipient: ${validation.error}`;
    console.error(msg, { metadata });
    return { success: false, error: validation.error };
  }
  const recipientEmail = validation.email;

  // 2. Validate from-email
  const fromEmail = getFromEmail();
  if (!fromEmail) {
    const msg = `${logPrefix} RESEND_FROM_EMAIL is not set`;
    console.error(msg);
    return { success: false, error: "Email sender not configured (RESEND_FROM_EMAIL)" };
  }

  // 3. Check onboarding sender restriction
  const restriction = checkOnboardingRestriction(recipientEmail);
  if (!restriction.canSend) {
    console.warn(`${logPrefix} ${restriction.reason}`, { to: recipientEmail, subject, metadata });
    return {
      success: false,
      skipped: true,
      reason: restriction.reason,
    };
  }

  // 4. Deduplication
  const key = dedupKey({ to: recipientEmail, subject, type });
  if (!skipDedup && wasRecentlySent(key)) {
    console.log(`${logPrefix} Skipping duplicate send`, { to: recipientEmail, subject, key });
    return {
      success: true,
      skipped: true,
      reason: "Duplicate send prevented",
    };
  }

  // 5. Attempt send with retry
  let lastError = null;
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const delay = getBackoffDelay(attempt);
        console.log(`${logPrefix} Retry attempt ${attempt}/${RETRY_CONFIG.maxAttempts} after ${delay}ms`);
        await sleep(delay);
      }

      const response = await getResend().emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, "").substring(0, 5000),
      });

      // Check for Resend API error
      if (response?.error) {
        throw new Error(response.error.message || "Resend API error");
      }

      const emailId = response?.id || response?.data?.id;
      if (!emailId) {
        throw new Error(`Resend did not return an email ID: ${JSON.stringify(response)}`);
      }

      // Mark as sent in dedup tracker
      markSent(key);

      console.log(`${logPrefix} Sent successfully`, {
        emailId,
        to: recipientEmail,
        subject,
        attempt,
        metadata,
      });

      return {
        success: true,
        emailId,
      };
    } catch (error) {
      lastError = error;
      console.error(
        `${logPrefix} Attempt ${attempt}/${RETRY_CONFIG.maxAttempts} failed:`,
        error.message,
        { to: recipientEmail, subject, metadata },
      );
    }
  }

  // All retries exhausted
  const errorMsg = lastError?.message || "Unknown error sending email";
  console.error(`${logPrefix} All ${RETRY_CONFIG.maxAttempts} attempts failed`, {
    to: recipientEmail,
    subject,
    error: errorMsg,
    metadata,
  });

  return {
    success: false,
    error: errorMsg,
  };
}

/**
 * Simple logger wrapper for email send events
 */
export function logEmailEvent(event, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    event: `email.${event}`,
    timestamp,
    ...data,
  }));
}