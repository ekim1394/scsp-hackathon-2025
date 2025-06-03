import { createRootRoute, Outlet } from "@tanstack/react-router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { AuthProvider } from "../AuthProvider";
import { Toaster } from "../components/ui/sonner";

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <Toaster richColors position="top-center" />

        <div className="w-full">
          <Header />
          <main className="min-h-screen flex flex-col items-center justify-start bg-black">
            <Outlet />
          </main>
          <Footer />
        </div>
      </SidebarProvider>
    </AuthProvider>
  ),
});
