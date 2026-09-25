'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function TechSafetyPage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("Technician quality & safety signals").slice(1,-1)}
      description={JSON.stringify("Flags derived from job completion and photo-evidence records — each flag names what it counted.").slice(1,-1)}
      endpoint={JSON.stringify("/api/fieldops?action=safety").slice(1,-1)}
      method={"GET"}
      query={"windowDays=30"}
      assumptions={["Flags are counted conditions, not model judgements.","No wearable or telematics data is included."]}
    />
  );
}
