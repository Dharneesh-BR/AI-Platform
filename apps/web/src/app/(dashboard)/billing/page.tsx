import { BillingPanel } from '../../../features/platform-data/components/billing-panel';

export default function BillingPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Billing</span><h1>Track usage and subscription health.</h1><p>Billing will meter AI executions, document processing, reports, and storage.</p></div><button className="button button-primary">Manage plan</button></header>
      <BillingPanel />
    </div>
  );
}
