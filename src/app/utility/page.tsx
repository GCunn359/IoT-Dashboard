import { AppShell } from "@/components/AppShell";
import { HomeDeviceStrip, SummaryGrid } from "@/components/Cards";
import { EnergyFlowDiagram } from "@/components/EnergyFlowDiagram";
import { PageSection } from "@/components/PageSections";
import { devices } from "@/lib/demo-data";

const cards = [
  {
    detail: "Read-only eSolar AIO3 monitoring",
    icon: "☀️",
    title: "Solar generation",
    tone: "good" as const,
    value: "3.8 kW",
  },
  {
    detail: "2 x 5 kWh modules, 10 kWh total",
    icon: "🔋",
    title: "Battery",
    tone: "info" as const,
    value: "74%",
  },
  {
    detail: "Future Irish utility smart meter data will appear here",
    icon: "⚡",
    title: "Grid",
    tone: "warning" as const,
    value: "0.4 kW import",
  },
];

export default function UtilityPage() {
  return (
    <AppShell
      description="Solar, battery, grid import/export, and future Irish smart meter data."
      title="Utility power"
    >
      <SummaryGrid cards={cards} />
      <EnergyFlowDiagram />
      <PageSection
        description="The inverter and batteries are monitor-only in the first version."
        title="Energy devices"
      >
        <HomeDeviceStrip
          devices={devices.filter((device) => device.category === "solar")}
        />
      </PageSection>
    </AppShell>
  );
}
