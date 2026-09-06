import { date, fail, integer, money, object, text } from "./core";
// Browser-safe definitions are exported separately from server validators.
import { recordModules, type RecordModule } from "./definitions";
export { recordModules };
export function validateRecord(module: string, body: Record<string, unknown>) {
  const definition = recordModules[module as RecordModule];
  if (!definition) return fail("Workflow not found", 404);
  const source = object(body.data),
    data: Record<string, string | number> = {};
  for (const f of definition.fields) {
    const value = source[f.key];
    if ((value === "" || value === undefined || value === null) && !f.required)
      continue;
    if (f.type === "number")
      data[f.key] = integer(Number(value), f.label, 0, 1000000);
    else if (f.type === "money") data[f.key] = money(value) / 100;
    else if (f.type === "datetime-local")
      data[f.key] = date(value, f.label).toISOString();
    else {
      const str = text(
        value,
        f.label,
        f.type === "textarea" ? 20000 : 500,
        !!f.required,
      );
      if (f.type === "email" && str && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
        fail("Invalid email");
      if (f.options && !f.options.includes(str)) fail(`Invalid ${f.label}`);
      data[f.key] = str;
    }
  }
  const status = text(body.status, "status", 30);
  if (!definition.statuses.includes(status)) fail("Invalid status");
  if (module === "maintenance" && Number(data.cadenceDays) < 1)
    fail("Visit interval must be at least one day");
  if (
    module === "subcontractors" &&
    status === "APPROVED" &&
    (!data.license ||
      !data.insurance ||
      !data.insuranceExpiresAt ||
      new Date(String(data.insuranceExpiresAt)) <= new Date())
  )
    fail(
      "Approval requires a license reference and current insurance evidence",
    );
  return {
    title: text(body.title, "title", 200),
    status,
    data,
    customerId: text(body.customerId, "customer", 100, false) || null,
    jobId: text(body.jobId, "job", 100, false) || null,
  };
}
