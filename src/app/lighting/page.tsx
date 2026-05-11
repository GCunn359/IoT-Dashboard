import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSections";
import { LightSwitchGrid } from "@/components/SmartControls";
import { getDevicesByCategory } from "@/lib/demo-data";

export default function LightingPage() {
  return (
    <AppShell
      description="Sonoff and Tuya lights grouped by room with direct on/off control where integrations allow."
      title="Lighting"
    >
      <PageSection
        description="Low-risk lighting controls look and feel like real wall switches with warm visual feedback."
        title="Room light switches"
      >
        <LightSwitchGrid devices={getDevicesByCategory("lighting")} />
      </PageSection>
    </AppShell>
  );
}
