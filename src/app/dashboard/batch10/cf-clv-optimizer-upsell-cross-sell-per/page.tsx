'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function ClvOptimizerPage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("CLV optimizer").slice(1,-1)}
      description={JSON.stringify("Customer lifetime value, upsell and cross-sell signals computed from service history.").slice(1,-1)}
      endpoint={JSON.stringify("/api/ai/clv-optimizer").slice(1,-1)}
      method={"GET"}
      query={"limit=25"}
      assumptions={["Sourced from the customer and job history the application already holds.","No model inference is used for the value figures."]}
    />
  );
}
