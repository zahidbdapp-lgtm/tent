import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  invoice_amount?: string;
  due_date?: string;
  property_name?: string;
  unit_number?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.warn("EmailJS not configured. Skipping email send.");
      return false;
    }

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendDueRentNotification(
  tenantEmail: string,
  tenantName: string,
  amount: number,
  dueDate: string,
  propertyName: string,
  unitNumber: string
): Promise<boolean> {
  return sendEmail({
    to_email: tenantEmail,
    to_name: tenantName,
    subject: `Rent Due Reminder - ${propertyName}`,
    message: `This is a reminder that your rent payment of $${amount.toFixed(2)} is due on ${dueDate}. Please ensure timely payment to avoid any late fees.`,
    invoice_amount: `$${amount.toFixed(2)}`,
    due_date: dueDate,
    property_name: propertyName,
    unit_number: unitNumber,
  });
}
