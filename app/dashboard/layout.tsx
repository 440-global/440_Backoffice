import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashTop, Sidebar } from "@/components/ui"
import { RouteGuard } from "@/lib/route-access";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Merchant Back Office",
  },
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <div className="h-screen bg-(--background) flex flex-col md:flex-row md:overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full">
          <DashTop breadcrumb />
          <RouteGuard>
            <div className="p-4 pt-20 md:pt-4 overflow-y-auto">
              {children}
            </div>
          </RouteGuard>
        </div>
      </div>
    </AuthGuard>
  )
}

export default DashboardLayout
