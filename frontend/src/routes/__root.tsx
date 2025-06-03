import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";

export const Route = createRootRoute({
  component: () => (
    <SidebarProvider>
      <AppSidebar />
      <div>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-start bg-black">
          <Outlet />
        </main>
        <Footer />
      </div>
      <TanStackRouterDevtools />
    </SidebarProvider>
  ),
});
