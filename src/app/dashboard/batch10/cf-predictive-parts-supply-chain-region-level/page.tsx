'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function PredictivePartsPage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("Predictive parts replenishment").slice(1,-1)}
      description={JSON.stringify("Reorder suggestions from actual job consumption, with confidence based on sample depth.").slice(1,-1)}
      endpoint={JSON.stringify("/api/fieldops?action=reorder").slice(1,-1)}
      method={"GET"}
      query={"lookbackDays=90&targetWeeksCover=6"}
      assumptions={["Usage measured from job part consumption, not purchase history.","Below the sample threshold the suggestion is suppressed and reported as insufficient-history."]}
    />
  );
}
