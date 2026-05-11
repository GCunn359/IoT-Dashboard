import { AppShell } from "@/components/AppShell";
import { PageSection } from "@/components/PageSections";
import { SocketControlGrid } from "@/components/SmartControls";
import { getDevicesByCategory } from "@/lib/demo-data";

export default function SocketsPage() {
  return (
    <AppShell
      description="Sonoff and Tuya sockets with on/off controls, power monitoring, and critical socket protection."
      title="Sockets"
    >
      <PageSection
        description="Each socket is shown as a UK faceplate with a tactile rocker switch and clear red/green state."
        title="UK socket controls"
      >
        <SocketControlGrid devices={getDevicesByCategory("socket")} />
      </PageSection>
    </AppShell>
  );
}
