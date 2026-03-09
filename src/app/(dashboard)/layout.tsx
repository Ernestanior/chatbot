import { Sidebar } from "@/components/sidebar";
import { UserNav } from "@/components/user-nav";
import { BrandProvider } from "@/components/brand-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-end border-b px-6">
            <UserNav />
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
