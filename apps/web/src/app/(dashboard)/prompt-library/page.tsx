import { PromptLibraryPanel } from '../../../features/platform-data/components/prompt-library-panel';

export default function PromptLibraryPage() {
  return (
    <div>
      <header className="topbar"><div><span className="eyebrow">Prompt Library</span><h1>Govern reusable consulting prompts.</h1><p>Versioned prompt templates support approval workflows and future model routing.</p></div><button className="button button-primary">New prompt</button></header>
      <PromptLibraryPanel />
    </div>
  );
}
