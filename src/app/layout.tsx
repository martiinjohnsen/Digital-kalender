import type { Metadata, Viewport } from "next";
import { Provider } from "@/components/provider";
import { PwaProvider } from "@/components/pwa";
import { Shell } from "@/components/shell";
import { AccountProvider } from "@/components/account-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Luke · Små øyeblikk, litt nærmere",
    template: "%s · Luke",
  },
  description:
    "Lag en personlig adventskalender til noen du er glad i. 24 små øyeblikk med hilsener, bilder, quiz og opplevelser.",
  applicationName: "Luke",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Luke" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f7f2",
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body>
        <PwaProvider>
          <AccountProvider>
            <Provider>
              <Shell>{children}</Shell>
            </Provider>
          </AccountProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
