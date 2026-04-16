// SMS Templates for Rent Management
// Uses native SMS app via tel: URI scheme

export interface SMSTemplateData {
  tenantName: string;
  month?: string;
  amount?: number;
  dueAmount?: number;
  propertyName?: string;
  unitNumber?: string;
  dueDate?: string;
  ownerName?: string;
}

export type SMSTemplateType = 
  | "rent_reminder" 
  | "rent_due" 
  | "payment_received" 
  | "payment_partial" 
  | "overdue_notice"
  | "custom";

// Format month to Bengali
function formatMonthBn(monthStr?: string): string {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const months = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

// Format amount to Bengali locale
function formatAmountBn(amount?: number): string {
  if (!amount) return "০";
  return amount.toLocaleString("bn-BD");
}

export function getSMSTemplate(type: SMSTemplateType, data: SMSTemplateData): string {
  const { tenantName, month, amount, dueAmount, propertyName, unitNumber, dueDate, ownerName } = data;
  const monthBn = formatMonthBn(month);
  const amountBn = formatAmountBn(amount);
  const dueAmountBn = formatAmountBn(dueAmount);

  switch (type) {
    case "rent_reminder":
      return `প্রিয় ${tenantName},

${monthBn} মাসের ভাড়া ${amountBn} টাকা পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।

${dueDate ? `শেষ তারিখ: ${dueDate}` : ""}

ধন্যবাদ${ownerName ? `\n- ${ownerName}` : ""}`;

    case "rent_due":
      return `প্রিয় ${tenantName},

${monthBn} মাসের ভাড়া বকেয়া আছে।
বকেয়া পরিমাণ: ${dueAmountBn} টাকা

অনুগ্রহ করে যথাশীঘ্র পরিশোধ করুন।

ধন্যবাদ${ownerName ? `\n- ${ownerName}` : ""}`;

    case "payment_received":
      return `প্রিয় ${tenantName},

${monthBn} মাসের ভাড়া ${amountBn} টাকা সফলভাবে পেয়েছি।

ধন্যবাদ।${ownerName ? `\n- ${ownerName}` : ""}`;

    case "payment_partial":
      return `প্রিয় ${tenantName},

আপনার ${amountBn} টাকা পেয়েছি।
বাকি বকেয়া: ${dueAmountBn} টাকা

অনুগ্রহ করে বাকি টাকা পরিশোধ করুন।

ধন্যবাদ${ownerName ? `\n- ${ownerName}` : ""}`;

    case "overdue_notice":
      return `প্রিয় ${tenantName},

আপনার ${monthBn} মাসের ভাড়া ${dueAmountBn} টাকা বকেয়া আছে এবং নির্ধারিত তারিখ অতিক্রান্ত হয়েছে।

অবিলম্বে পরিশোধ করুন।

${propertyName ? `প্রপার্টি: ${propertyName}` : ""}
${unitNumber ? `ইউনিট: ${unitNumber}` : ""}

${ownerName ? `- ${ownerName}` : ""}`;

    case "custom":
    default:
      return `প্রিয় ${tenantName},

`;
  }
}

export function openSMSApp(phone: string, message: string): void {
  // Clean phone number
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Use sms: URI scheme
  // Format works on both iOS and Android
  const smsUrl = `sms:${cleanPhone}?body=${encodedMessage}`;
  
  // Open SMS app
  window.location.href = smsUrl;
}

export function getSMSUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `sms:${cleanPhone}?body=${encodedMessage}`;
}

// All available templates for UI selection
export const SMS_TEMPLATES: { value: SMSTemplateType; label: string; description: string }[] = [
  { 
    value: "rent_reminder", 
    label: "ভাড়া মনে করিয়ে দেওয়া", 
    description: "মাসিক ভাড়া পরিশোধের রিমাইন্ডার" 
  },
  { 
    value: "rent_due", 
    label: "বকেয়া নোটিশ", 
    description: "বকেয়া ভাড়ার নোটিশ" 
  },
  { 
    value: "payment_received", 
    label: "পেমেন্ট কনফার্মেশন", 
    description: "পেমেন্ট পাওয়ার পর ধন্যবাদ বার্তা" 
  },
  { 
    value: "payment_partial", 
    label: "আংশিক পেমেন্ট", 
    description: "আংশিক পেমেন্ট পাওয়ার নোটিফিকেশন" 
  },
  { 
    value: "overdue_notice", 
    label: "ওভারডিউ নোটিশ", 
    description: "মেয়াদ উত্তীর্ণ ভাড়ার কড়া নোটিশ" 
  },
  { 
    value: "custom", 
    label: "কাস্টম মেসেজ", 
    description: "নিজের মেসেজ লিখুন" 
  },
];
