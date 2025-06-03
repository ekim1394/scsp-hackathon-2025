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
} from "../components/ui/sidebar";
import { useAuth } from "../AuthProvider";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const data = {
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

      // Only show Users group if user is present
      ...(user
        ? [
            {
              title: "Comments",
              url: "#",
              items: [
                {
                  title: "Your Comments",
                  url: "/comments/me",
                },
              ],
            },
            {
              title: "User",
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
          ]
        : []),
    ],
  };

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
                    <SidebarMenuButton asChild>
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
