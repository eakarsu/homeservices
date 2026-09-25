'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function FleetGpsFuelPage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("Fleet GPS + fuel card").slice(1,-1)}
      description={JSON.stringify("Record a GPS position or fuel-card transaction; report cost per mile.").slice(1,-1)}
      endpoint={JSON.stringify("/api/fieldops?action=fuel-card").slice(1,-1)}
      method={"POST"}
      fields={[{"name":"truckId","label":"Truck ID","required":true},{"name":"cardLast4","label":"Card last 4","required":true},{"name":"vendor","label":"Vendor","required":true},{"name":"gallons","label":"Gallons","type":"number","required":true},{"name":"amount","label":"Amount","type":"number","required":true},{"name":"externalRef","label":"External ref (idempotency)","required":true}]}
      assumptions={["externalRef makes ingestion idempotent — a replayed statement line cannot double-count.","GPS pings use /api/fieldops?action=gp-ping with the same truck validation."]}
    />
  );
}
