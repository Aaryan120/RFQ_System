import "./globals.css";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { TopBar } from "@/components/top-bar";
import { RouteProgress } from "@/components/route-progress";

export const metadata: Metadata = {
  title: "British Auction RFQ",
  description: "Simplified RFQ system with British-Auction bidding.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-app">
          <RouteProgress />
          <TopBar
            user={
              session?.user
                ? {
                    name: session.user.name ?? session.user.email ?? "User",
                    email: session.user.email ?? "",
                    role: session.user.role,
                  }
                : null
            }
          />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
