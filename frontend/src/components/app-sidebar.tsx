import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarFooter } from "./ui/sidebar";
import { useAuth } from "../AuthProvider";
import { Button } from "./ui/button";

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Posts",
      url: "/",
      items: [
        {
          title: "All Posts",
          url: "/posts",
        },
      ],
    },
    {
      title: "Comments",
      url: "#",
      items: [
        {
          title: "Your Comments",
          url: "/comments/me",
        },
        {
          title: "Top Comments",
          url: "/comments/top",
        },
      ],
    },
    {
      title: "Users",
      url: "#",
      items: [
        {
          title: "Profile",
          url: "/users/me",
        },
        {
          title: "All Users",
          url: "/users",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  return (
    <Sidebar {...props}>
      <SidebarContent className="bg-gray-800 ">
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-white">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
