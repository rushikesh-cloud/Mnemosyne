import { MaterialIcon } from "@/components/material-icon";
import { AppShell, PrimaryButton, SecondaryButton, StatusBadge, TopIconButton } from "@/features/app/app-shell";

const mcpServers = [
  ["Jira Cloud", "https://mcp-jira.internal.mnemosyne.io/v1", "Active", "success"],
  ["Confluence", "https://mcp-confluence.internal.mnemosyne.io/v1", "Active", "success"],
  ["GitHub Repo", "https://mcp-github.internal.mnemosyne.io/v1", "Inactive", "inactive"]
] as const;

function SecretInput({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-md text-label-md text-on-surface" htmlFor={label}>
        {label}
      </label>
      <div className="flex h-row-height-md items-center rounded border border-outline-variant bg-surface px-3">
        <MaterialIcon className="mr-2 text-on-surface-variant" size={18}>key</MaterialIcon>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent font-body-md text-body-md outline-none"
          id={label}
          placeholder="••••••••••••••••"
          type="password"
        />
      </div>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  children
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md">
        <MaterialIcon className="text-primary">{icon}</MaterialIcon>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPageView() {
  return (
    <AppShell active="Settings">
      <main className="flex h-full flex-1 flex-col bg-surface-container-lowest">
        <header className="flex h-row-height-md items-center justify-between border-b border-outline-variant px-padding-standard">
          <h1 className="font-headline-sm text-headline-sm">Settings</h1>
          <div className="flex items-center gap-2">
            <TopIconButton icon="notifications" label="Notifications" />
            <TopIconButton icon="help_outline" label="Help" />
            <SecondaryButton>Discard Changes</SecondaryButton>
            <PrimaryButton>Save Configuration</PrimaryButton>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <div className="mb-6">
            <h2 className="font-headline-lg text-headline-lg">Environment Configuration</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage API keys, external integrations, and core service connections for the Mnemosyne workbench.
            </p>
          </div>
          <div className="grid gap-5">
            <SettingsSection icon="psychology" title="Language Models">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <SecretInput label="Google Gemini API Key" />
                <div className="flex items-end">
                  <SecondaryButton icon="swap_horiz">Test</SecondaryButton>
                </div>
              </div>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                Required for reasoning operations and text generation tasks.
              </p>
              <label className="mt-4 block font-label-md text-label-md" htmlFor="embedding-model">
                Primary Embeddings Model
              </label>
              <select
                className="mt-1 h-row-height-md w-full rounded border border-outline-variant bg-surface px-3 font-body-md text-body-md"
                id="embedding-model"
              >
                <option>models/text-embedding-004 (Google)</option>
                <option>text-embedding-3-small (OpenAI)</option>
                <option>text-embedding-3-large (OpenAI)</option>
                <option>nomic-embed-text (Local)</option>
              </select>
            </SettingsSection>
            <SettingsSection icon="database" title="Vector Storage (Pinecone)">
              <div className="mb-4">
                <StatusBadge tone="success">Connected</StatusBadge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="font-label-md text-label-md" htmlFor="index-name">
                    Index Name
                  </label>
                  <input
                    className="mt-1 h-row-height-md w-full rounded border border-outline-variant bg-surface px-3"
                    id="index-name"
                    placeholder="mnemosyne-prod"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md" htmlFor="pinecone-host">
                    Environment / Host
                  </label>
                  <input
                    className="mt-1 h-row-height-md w-full rounded border border-outline-variant bg-surface px-3"
                    id="pinecone-host"
                    placeholder="us-east-1"
                  />
                </div>
                <SecretInput label="API Key" />
              </div>
              <div className="mt-4">
                <SecondaryButton icon="sync">Verify</SecondaryButton>
              </div>
            </SettingsSection>
            <SettingsSection icon="monitoring" title="Observability (LangSmith)">
              <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
                Tracing is currently active. LLM calls and agent executions are being logged.
              </p>
              <SecretInput label="LangSmith API Key" />
            </SettingsSection>
            <SettingsSection icon="dns" title="MCP Servers">
              <div className="mb-4 flex justify-end">
                <SecondaryButton icon="add">Add Server</SecondaryButton>
              </div>
              <div className="overflow-hidden rounded border border-outline-variant">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-container-low font-label-bold text-label-bold text-on-surface-variant">
                    <tr>
                      {["Name", "Endpoint URL", "Status", "Actions"].map((heading) => (
                        <th className="h-row-height-sm border-b border-outline-variant px-3" key={heading}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {mcpServers.map(([name, endpoint, status, tone]) => (
                      <tr className="h-row-height-md border-b border-outline-variant last:border-b-0" key={name}>
                        <td className="px-3 font-medium">{name}</td>
                        <td className="px-3 text-on-surface-variant">{endpoint}</td>
                        <td className="px-3">
                          <StatusBadge tone={tone}>{status}</StatusBadge>
                        </td>
                        <td className="px-3">
                          <div className="flex items-center gap-2">
                            <button aria-label={`Edit ${name}`} className="text-on-surface-variant" type="button">
                              <MaterialIcon size={18}>edit</MaterialIcon>
                            </button>
                            <button aria-label={`Delete ${name}`} className="text-on-surface-variant" type="button">
                              <MaterialIcon size={18}>delete</MaterialIcon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SettingsSection>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
