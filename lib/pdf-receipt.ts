"use client";

import type { Invoice, Property } from "@/types";

interface ReceiptData {
  invoice: Invoice;
  property?: Property;
  ownerName?: string;
  ownerPhone?: string;
}

export async function generateReceiptPDF(data: ReceiptData) {
  const { jsPDF } = await import("jspdf");
  const { invoice, property, ownerName, ownerPhone } = data;
  const doc = new jsPDF();

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const grayColor: [number, number, number] = [107, 114, 128];
  const darkColor: [number, number, number] = [17, 24, 39];
  const successColor: [number, number, number] = [34, 197, 94];
  const lightGray: [number, number, number] = [249, 250, 251];

  // Set page margins
  const margins = { top: 15, left: 15, right: 15, bottom: 15 };
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Header with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("PropManager - Professional Property Management System", pageWidth / 2, 30, { align: "center" });

  // Main content area
  let yPosition = margins.top + 40;

  // Receipt Number, Date, and Status Row
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt No:", margins.left, yPosition);
  doc.text("Date Issued:", margins.left + 75, yPosition);
  doc.text("Status:", margins.left + 145, yPosition);

  doc.setFont("helvetica", "normal");
  doc.text(`#${invoice.id.slice(-10).toUpperCase()}`, margins.left + 35, yPosition);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), margins.left + 105, yPosition);
  
  if (invoice.status === "paid") {
    doc.setTextColor(...successColor);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", margins.left + 165, yPosition);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.status.toUpperCase(), margins.left + 165, yPosition);
  }

  yPosition += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
  yPosition += 8;

  // Tenant Information
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TENANT INFORMATION", margins.left, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${invoice.tenantName}`, margins.left, yPosition);
  yPosition += 6;
  doc.text(`Unit: ${invoice.unitNumber}`, margins.left, yPosition);
  yPosition += 6;

  if (property) {
    doc.text(`Property: ${property.name}`, margins.left, yPosition);
    yPosition += 6;
    doc.text(`Address: ${property.address}`, margins.left, yPosition);
    yPosition += 6;
  }

  yPosition += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
  yPosition += 8;

  // Billing Information
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILLING INFORMATION", margins.left, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Billing Month: ${formatMonth(invoice.month)}`, margins.left, yPosition);
  yPosition += 6;
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, margins.left, yPosition);
  yPosition += 10;

  // Column positions - description on left (60%), amount on right (40%)
  const descColumnX = margins.left + 3;
  const amountColumnX = margins.left + 110; // Better spacing, not at edge

  // Invoice Items Table Header
  doc.setFillColor(...lightGray);
  doc.rect(margins.left, yPosition, contentWidth, 8, "F");

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  doc.text("Description", descColumnX, yPosition + 6);
  doc.text("Amount", amountColumnX + 50, yPosition + 6, { align: "right" });

  yPosition += 14; // Increased gap after header

  // Table Items
  const items = [
    { label: "Monthly Rent", amount: invoice.rent },
    { label: "Gas Charge", amount: invoice.gasCharge },
    { label: "Water Charge", amount: invoice.waterCharge },
    { label: "Electricity Bill", amount: invoice.electricityBill },
    { label: "Service Charge", amount: invoice.serviceCharge },
  ];

  doc.setFont("helvetica", "normal");
  let itemCount = 0;
  items.forEach((item) => {
    if (item.amount > 0) {
      doc.setTextColor(...darkColor);
      doc.text(item.label, descColumnX, yPosition);
      const amountStr = `${item.amount.toLocaleString("en-BD")}`;
      doc.text(amountStr, amountColumnX + 50, yPosition, { align: "right" });
      yPosition += 7;
      itemCount++;
    }
  });

  // Summary Section
  yPosition += 10; // Gap after items (at least 1 row)
  doc.setDrawColor(200, 200, 200);
  doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
  yPosition += 8;

  // Total Amount with proper padding
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("TOTAL AMOUNT:", margins.left, yPosition);
  const totalAmountText = `${invoice.totalAmount.toLocaleString("en-BD")}`;
  doc.text(totalAmountText, amountColumnX + 50, yPosition, { align: "right" });
  yPosition += 8;

  // Paid Amount
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...successColor);
  doc.text("PAID AMOUNT:", margins.left, yPosition);
  const paidAmountText = `${invoice.paidAmount.toLocaleString("en-BD")}`;
  doc.text(paidAmountText, amountColumnX + 50, yPosition, { align: "right" });
  yPosition += 8;

  // Due Amount
  if (invoice.dueAmount > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("DUE AMOUNT:", margins.left, yPosition);
    const dueAmountText = `${invoice.dueAmount.toLocaleString("en-BD")}`;
    doc.text(dueAmountText, amountColumnX + 50, yPosition, { align: "right" });
    yPosition += 10;
  } else {
    yPosition += 2;
  }

  // Payment Status Box
  if (invoice.status === "paid") {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(...successColor);
    doc.setLineWidth(1);
    doc.rect(margins.left, yPosition, contentWidth, 16, "FD");

    doc.setTextColor(...successColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("✓ PAYMENT COMPLETED", pageWidth / 2, yPosition + 6, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your timely payment!", pageWidth / 2, yPosition + 12, { align: "center" });
    yPosition += 20;
  } else if (invoice.status === "overdue") {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.rect(margins.left, yPosition, contentWidth, 16, "FD");

    doc.setTextColor(217, 119, 6);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("⚠ PAYMENT OVERDUE", pageWidth / 2, yPosition + 6, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Please pay ${invoice.dueAmount.toLocaleString("en-BD")} immediately`, pageWidth / 2, yPosition + 12, { align: "center" });
    yPosition += 20;
  }

  // Footer
  yPosition = pageHeight - margins.bottom - 18;
  doc.setDrawColor(200, 200, 200);
  doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
  yPosition += 4;

  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  if (ownerName || ownerPhone) {
    const ownerInfo = `Issued by: ${ownerName || "Property Owner"}${ownerPhone ? ` | ${ownerPhone}` : ""}`;
    doc.text(ownerInfo, margins.left, yPosition);
  }

  const generatedText = `Generated on: ${new Date().toLocaleDateString("en-US")} | PropManager Receipt System`;
  doc.text(generatedText, pageWidth - margins.right - 3, yPosition, { align: "right" });

  yPosition += 4;
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated receipt. No signature required.", pageWidth / 2, yPosition, { align: "center" });

  return doc;
}

export async function downloadReceiptPDF(data: ReceiptData, filename?: string) {
  const doc = await generateReceiptPDF(data);
  const defaultFilename = `receipt-${data.invoice.tenantName.replace(/\s+/g, "-")}-${data.invoice.month}.pdf`;
  
  // Create blob and download in browser
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function getReceiptPDFBlob(data: ReceiptData): Promise<Blob> {
  const doc = await generateReceiptPDF(data);
  return doc.output("blob");
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-BD", { year: "numeric", month: "long" });
}
