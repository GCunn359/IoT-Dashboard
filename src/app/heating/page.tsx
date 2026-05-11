import { AppShell } from "@/components/AppShell";
import { HomeDeviceStrip, SummaryGrid } from "@/components/Cards";
import { HeatingFlowDiagram } from "@/components/HeatingFlowDiagram";
import { PageSection } from "@/components/PageSections";
import { devices } from "@/lib/demo-data";

const cards = [
  {
    detail: "Nest thermostat and boiler module",
    icon: "🔥",
    title: "Central heating",
    tone: "good" as const,
    value: "Idle",
  },
  {
    detail: "Tuya TRV604 schedule and target controls planned",
    icon: "🌡️",
    title: "Radiator valves",
    tone: "info" as const,
    value: "On schedule",
  },
  {
    detail: "Selected valves close during hot-water-only boiler mode",
    icon: "☀️",
    title: "Hot water",
    tone: "good" as const,
    value: "54°C",
  },
];

export default function HeatingPage() {
  return (
    <AppShell
      description="Nest heating, hot water, and Tuya TRV604 radiator valves with summer mode."
      title="Heating and water"
    >
      <SummaryGrid cards={cards} />
      <HeatingFlowDiagram />
      <PageSection
        description="Nest, TRVs, cylinder temperature, and the Anttory WiFi immersion smart MCB are displayed together with explicit safe controls."
        title="Heating devices"
      >
        <HomeDeviceStrip
          devices={devices.filter((device) =>
            ["heating", "radiator", "water"].includes(device.category),
          )}
        />
      </PageSection>
    </AppShell>
  );
}
