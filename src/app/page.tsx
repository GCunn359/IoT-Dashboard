import { AppShell } from "@/components/AppShell";
import { HomeDeviceStrip, RoomSceneGrid, SummaryGrid } from "@/components/Cards";
import { PageSection } from "@/components/PageSections";
import { devices, summaryCards } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell
      description="A friendly local overview for energy, heating, security, sockets, lighting, and device health."
      title="Home dashboard"
    >
      <SummaryGrid cards={summaryCards} />
      <PageSection
        description="Compact live tiles for the systems you are most likely to touch from the dashboard or Nest Hub."
        title="Favourite controls"
      >
        <HomeDeviceStrip devices={devices.slice(0, 7)} />
      </PageSection>
      <PageSection
        description="A calmer home-automation view grouped by how you use the house, not by technical device records."
        title="Rooms at a glance"
      >
        <RoomSceneGrid />
      </PageSection>
    </AppShell>
  );
}
