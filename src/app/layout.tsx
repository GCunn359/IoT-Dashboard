import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IoT Dashboard",
  },
  description:
    "A local TrueNAS Scale smart-home dashboard for IoT, energy, heating, lighting, sockets, alarm monitoring, and automations.",
  formatDetection: {
    telephone: false,
  },
  title: "IoT Dashboard",
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#eef3f7",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
