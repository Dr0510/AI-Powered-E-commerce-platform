/**
 * Contact Form API Route
 * Sends contact form submissions to the admin email via Resend.
 */
import { sendEmail } from "@/lib/email";
import { contactFormNotification } from "@/lib/email-templates";
import { withRateLimit } from "@/lib/rateLimit";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean);

async function postHandler(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name?.trim()) {
      return Response.json({ message: "Name is required" }, { status: 400 });
    }
    if (!email?.trim()) {
      return Response.json({ message: "Email is required" }, { status: 400 });
    }
    if (!message?.trim()) {
      return Response.json({ message: "Message is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Response.json({ message: "Invalid email format" }, { status: 400 });
    }

    // Rate limiting: max message length check
    if (message.length > 5000) {
      return Response.json({ message: "Message too long (max 5000 characters)" }, { status: 400 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
    if (adminEmails.length === 0) {
      console.error("[Contact] No ADMIN_EMAILS configured");
      return Response.json({ message: "Contact form not available" }, { status: 500 });
    }

    const html = contactFormNotification({ name, email, subject, message });

    const results = [];
    for (const adminEmail of adminEmails) {
      const result = await sendEmail({
        to: adminEmail,
        subject: `[DR MART Contact] ${subject || "New Message"} from ${name}`,
        html,
        text: `New contact form submission from ${name} (${email})\nSubject: ${subject || "N/A"}\n\nMessage:\n${message}`,
        type: "contact",
        metadata: { name, email, subject: subject || "" },
      });
      results.push(result);

      console.log("[Contact] Sent to admin", {
        adminEmail,
        success: result.success,
        skipped: result.skipped,
        error: result.error,
      });
    }

    const allFailed = results.every((r) => !r.success && !r.skipped);
    if (allFailed) {
      return Response.json(
        { message: results[0]?.error || "Failed to send message" },
        { status: 500 },
      );
    }

    return Response.json({
      message: "Your message has been sent. We'll get back to you soon!",
      sent: results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return Response.json({ message: "Failed to process your message", error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(postHandler, { limit: 5, windowMs: 60 * 1000 });