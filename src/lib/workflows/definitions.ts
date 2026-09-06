export type Field = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
};
type Definition = {
  name: string;
  description: string;
  statuses: string[];
  fields: Field[];
};
export const recordModules: Record<string, Definition> = {
  leads: {
    name: "Leads & referrals",
    description:
      "Track enquiries and referrals, qualify opportunities, and convert them to customers.",
    statuses: ["NEW", "QUALIFIED", "WON", "LOST"],
    fields: [
      { key: "firstName", label: "First name", type: "text", required: true },
      { key: "lastName", label: "Last name", type: "text", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "source", label: "Source", type: "text" },
      { key: "referral", label: "Referred by", type: "text" },
      { key: "expectedValue", label: "Expected value", type: "money" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  vendors: {
    name: "Vendors",
    description: "Maintain supplier contacts and purchasing lead times.",
    statuses: ["ACTIVE", "INACTIVE"],
    fields: [
      { key: "contact", label: "Contact name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "leadDays", label: "Lead time in days", type: "number" },
      { key: "notes", label: "Ordering notes", type: "textarea" },
    ],
  },
  subcontractors: {
    name: "Subcontractors",
    description:
      "Record skills, credential evidence, insurance, and an office approval decision.",
    statuses: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"],
    fields: [
      {
        key: "trade",
        label: "Trade",
        type: "select",
        options: ["HVAC", "PLUMBING", "ELECTRICAL", "GENERAL"],
        required: true,
      },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "license", label: "License evidence / reference", type: "text" },
      {
        key: "insurance",
        label: "Insurance evidence / reference",
        type: "text",
      },
      {
        key: "insuranceExpiresAt",
        label: "Insurance expires",
        type: "datetime-local",
      },
      { key: "notes", label: "Review notes", type: "textarea" },
    ],
  },
  warranties: {
    name: "Warranty claims",
    description:
      "Track equipment coverage, supplier claim references, decisions, and resolution.",
    statuses: ["OPEN", "SUBMITTED", "APPROVED", "DENIED", "CLOSED"],
    fields: [
      {
        key: "equipmentId",
        label: "Equipment",
        type: "equipment",
        required: true,
      },
      { key: "vendorId", label: "Vendor", type: "vendors" },
      { key: "expiresAt", label: "Coverage expires", type: "datetime-local" },
      { key: "claimReference", label: "Claim reference", type: "text" },
      {
        key: "notes",
        label: "Claim evidence and resolution",
        type: "textarea",
        required: true,
      },
    ],
  },
  maintenance: {
    name: "Recurring maintenance",
    description:
      "Plan service intervals and create the next visit for office scheduling.",
    statuses: ["ACTIVE", "PAUSED", "CLOSED"],
    fields: [
      {
        key: "propertyId",
        label: "Property",
        type: "properties",
        required: true,
      },
      {
        key: "serviceTypeId",
        label: "Service type",
        type: "serviceTypes",
        required: true,
      },
      {
        key: "cadenceDays",
        label: "Interval in days",
        type: "number",
        required: true,
      },
      {
        key: "nextAt",
        label: "Next visit",
        type: "datetime-local",
        required: true,
      },
      { key: "notes", label: "Work scope", type: "textarea" },
    ],
  },
  documents: {
    name: "Knowledge library",
    description:
      "Store company procedures and equipment reference text for search and cited AI answers.",
    statuses: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    fields: [
      {
        key: "source",
        label: "Source / document reference",
        type: "text",
        required: true,
      },
      {
        key: "content",
        label: "Document text",
        type: "textarea",
        required: true,
      },
    ],
  },
};
export type RecordModule = keyof typeof recordModules;
export const operationsModules = [
  {
    slug: "workforce",
    name: "Working hours & leave",
    description: "Technician availability and time off",
  },
  {
    slug: "stock",
    name: "Stock movements",
    description: "Transfers, adjustments and warehouse history",
  },
  {
    slug: "bookings",
    name: "Bookings",
    description: "Requests, availability, rescheduling and cancellations",
  },
  {
    slug: "timesheets",
    name: "Timesheets",
    description: "Clock entries, office review and payroll CSV",
  },
  {
    slug: "purchasing",
    name: "Purchasing",
    description: "Orders, approvals, partial receipts and inventory",
  },
  {
    slug: "communications",
    name: "Communications",
    description: "Reviewed messages, reminders and delivery history",
  },
  {
    slug: "portal",
    name: "Customer portal",
    description: "Expiring access links, appointments, invoices and reviews",
  },
  {
    slug: "reviews",
    name: "Customer reviews",
    description: "Feedback from completed jobs",
  },
  {
    slug: "integrations",
    name: "Integrations",
    description: "Company provider connections and sync history",
  },
  {
    slug: "finance",
    name: "Finance operations",
    description: "Payment reconciliation, refunds and accounting exports",
  },
  {
    slug: "fleet",
    name: "Fleet & dispatch",
    description: "Consented locations and assignment planning",
  },
  {
    slug: "ai-usage",
    name: "AI history & usage",
    description: "Saved drafts, model receipts and usage",
  },
  ...Object.entries(recordModules).map(([slug, d]) => ({
    slug,
    name: d.name,
    description: d.description,
  })),
];
