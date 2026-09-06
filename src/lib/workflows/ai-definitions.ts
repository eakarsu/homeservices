export const aiModes = [
  {
    slug: "job-summary",
    name: "Job summary",
    instruction:
      "Summarize recorded work, time and parts. Distinguish job notes from verified completion.",
  },
  {
    slug: "diagnostics",
    name: "Diagnostics assistant",
    instruction:
      "Prepare potential causes, missing evidence and questions for a qualified technician. Flag reported imminent hazards for professional escalation.",
  },
  {
    slug: "dispatch-optimizer",
    name: "Dispatch suggestions",
    instruction:
      "Compare the selected job to technician trades and schedules; identify conflicts and suggest candidate IDs for office review.",
  },
  {
    slug: "smart-scheduling",
    name: "Smart scheduling",
    instruction:
      "Suggest candidate times from the provided working hours and appointments. State assumptions and conflicts.",
  },
  {
    slug: "route-optimizer",
    name: "Route planning",
    instruction:
      "Suggest job order while preserving appointment windows. Coordinate distance is not road travel time; do not invent travel savings.",
  },
  {
    slug: "predictive-maintenance",
    name: "Maintenance review",
    instruction:
      "Identify due or overdue service from equipment history and dates; do not invent failure probabilities.",
  },
  {
    slug: "customer-insights",
    name: "Customer insights",
    instruction:
      "Summarize the selected customer history, preferences and possible follow-up opportunities.",
  },
  {
    slug: "inventory-forecast",
    name: "Inventory forecast",
    instruction:
      "Calculate suggested stock review from supplied stock levels, reorder levels and 90-day recorded usage. State data gaps.",
  },
  {
    slug: "photo-intake",
    name: "Photo intake",
    instruction:
      "Read the attached equipment image. Extract visible make, model and serial number into the draft; use unknown for illegible fields. Saving equipment requires separate confirmation.",
  },
  {
    slug: "subscription-health",
    name: "Service agreement health",
    instruction:
      "Compare agreement expiry, visits and equipment service dates and suggest review tasks.",
  },
  {
    slug: "voice-intake",
    name: "Voice intake",
    instruction:
      "Transcribe the attached audio, then extract customer-requested service, timing and unanswered questions into a draft. Do not book or contact anyone.",
  },
  {
    slug: "intake",
    name: "Request intake",
    instruction:
      "Extract a structured service request from supplied notes. Identify missing booking information.",
  },
  {
    slug: "customer-message",
    name: "Customer message",
    instruction:
      "Draft a concise customer message based on recorded facts. Respect the supplied contact preferences.",
  },
  {
    slug: "document-search",
    name: "Knowledge search",
    instruction:
      "Answer from the supplied published source documents, citing document IDs. If the documents do not answer the question, say so.",
  },
  {
    slug: "invoice-anomalies",
    name: "Invoice review",
    instruction:
      "Check the supplied invoice arithmetic and outstanding balances; explain discrepancies without alleging misconduct.",
  },
  {
    slug: "margin-analysis",
    name: "Job margin review",
    instruction:
      "Explain recorded revenue and parts costs; list missing labor or overhead costs instead of inventing profit.",
  },
  {
    slug: "renewals",
    name: "Renewal assistant",
    instruction:
      "Identify service agreements needing renewal review and draft next-step suggestions.",
  },
];
