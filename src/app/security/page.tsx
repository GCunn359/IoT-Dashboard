import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSections";
import { SecurityConsole } from "@/components/SmartControls";
import { getDevicesByCategory } from "@/lib/demo-data";

export default function SecurityPage() {
  return (
    <AppShell
      description="Monitoring-first AJAX alarm view for hub state, events, batteries, tampers, and offline sensors."
      title="AJAX alarm"
    >
      <PageSection
        description="A security-console view for AJAX hub state, zones, events, batteries, tampers, and sync health."
        title="Alarm command panel"
      >
        <SecurityConsole devices={getDevicesByCategory("security")} />
      </PageSection>
    </AppShell>
  );
}
