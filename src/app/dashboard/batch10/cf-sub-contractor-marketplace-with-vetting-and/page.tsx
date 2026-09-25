'use client';
import CapabilityPanel from '@/components/CapabilityPanel';

export default function SubcontractorPage() {
  return (
    <CapabilityPanel
      title={JSON.stringify("Subcontractor roster & referrals").slice(1,-1)}
      description={JSON.stringify("Internal roster and referral ledger with acceptance history and margin visibility.").slice(1,-1)}
      endpoint={JSON.stringify("/api/subcontractors").slice(1,-1)}
      method={"GET"}
      assumptions={["Scoped deliberately: no public discovery, no bidding, no payouts.","Acceptance rate excludes referrals still awaiting a response."]}
    />
  );
}
