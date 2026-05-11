import { AppShell } from "@/components/AppShell";
import { AutomationList } from "@/components/Cards";
import { PageSection } from "@/components/PageSections";
import { automationRules } from "@/lib/demo-data";

export default function AutomationsPage() {
  return (
    <AppShell
      description="Simple, visible, logged rules that connect systems together without hidden behavior."
      title="Automations"
    >
      <PageSection
        description="Normal automation controls do not require a PIN. Security-sensitive actions still require protection."
        title="Rules"
      >
        <AutomationList rules={automationRules} />
      </PageSection>
    </AppShell>
  );
}
