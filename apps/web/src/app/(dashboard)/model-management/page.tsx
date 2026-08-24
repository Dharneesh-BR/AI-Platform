import { ModelManagementPanel } from '../../../features/platform-data/components/model-management-panel';

export default function ModelManagementPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Model Management</span><h1>Route AI work by capability, not provider.</h1><p>LiteLLM will let future models be added through configuration without changing application code.</p></div><button className="button button-primary">Add model</button></header>
      <ModelManagementPanel />
    </div>
  );
}
