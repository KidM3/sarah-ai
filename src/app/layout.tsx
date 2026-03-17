import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vapi Integration",
  description: "Next.js + Vapi webhook integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
