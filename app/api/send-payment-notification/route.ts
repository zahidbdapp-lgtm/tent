import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@propmanager.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userName,
      plan,
      amount,
      paymentMethod,
      transactionId,
      paymentNumber,
      paymentDate,
    } = body;

    console.log("[send-payment-notification] Received payment data:", {
      userEmail,
      userName,
      plan,
      amount,
      paymentMethod,
      transactionId,
      paymentNumber,
      paymentDate,
    });

    // Send email using EmailJS (or your preferred email service)
    try {
      const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          template_id: "template_payment_notification", // Use a specific template for admin notifications
          user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: ADMIN_EMAIL,
            user_email: userEmail,
            user_name: userName,
            plan: plan,
            amount: amount,
            payment_method: paymentMethod,
            transaction_id: transactionId,
            payment_number: paymentNumber,
            payment_date: paymentDate,
            message: `নতুন পেমেন্ট রিকোয়েস্ট\n\nব্যবহারকারী: ${userName}\nইমেইল: ${userEmail}\nপ্যাকেজ: ${plan}\nপরিমাণ: ৳${amount}\nপেমেন্ট মেথড: ${paymentMethod}\nট্রানজেকশন ID: ${transactionId}\nপেমেন্ট নম্বর: ${paymentNumber}\nতারিখ: ${paymentDate}`,
          },
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("[send-payment-notification] EmailJS error:", errorText);
        // Continue anyway - payment request was saved
        return NextResponse.json({
          success: true,
          message: "Payment request recorded (email notification failed but data is safe)",
          data: { userEmail, userName, plan, amount },
        });
      }

      console.log("[send-payment-notification] ✅ Payment notification email sent successfully");
      return NextResponse.json({
        success: true,
        message: "Payment notification sent to admin",
        data: { userEmail, userName, plan, amount },
      });
    } catch (emailError) {
      console.error("[send-payment-notification] Email service error:", emailError);
      // Return success anyway - the important thing is that the payment request exists
      return NextResponse.json({
        success: true,
        message: "Payment request recorded (email notification attempted)",
        data: { userEmail, userName, plan, amount },
      });
    }
  } catch (error) {
    console.error("[send-payment-notification] API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment notification",
        details: (error as any)?.message,
      },
      { status: 500 }
    );
  }
}
