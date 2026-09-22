import { Card, Pill } from '../../../components/platform/app-shell';

export default function SettingsPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Settings</span><h1>Configure workspace behavior.</h1><p>Security, theme, notifications, storage, and integration settings.</p></div><button className="button button-primary">Save settings</button></header>
      <section className="grid-2"><Card><h2>Security</h2><div className="timeline"><div className="timeline-item"><strong>Firebase Authentication</strong><Pill tone="green">Enabled</Pill></div><div className="timeline-item"><strong>JWT Sessions</strong><Pill tone="green">Enabled</Pill></div><div className="timeline-item"><strong>Project Ownership</strong><Pill tone="green">Enabled</Pill></div></div></Card><Card><h2>Preferences</h2><p>Dark mode, dashboard layout, and notification routing will live here.</p></Card></section>
    </div>
  );
}
