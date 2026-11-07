"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react"
import {SidebarProvider} from "@/components/ui/sidebar";
import {CustomSidebarTrigger} from "@/components/CustomSidebarTrigger"
import { AppSidebar } from "@/components/app-sidebar";

export function LayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {

  const pathname = usePathname();

  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <main className="
        background-login
        min-h-screen
        w-full
      ">
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>

      <AppSidebar />

      <main className="
        background-main
        w-full
        overflow-x-hidden
      ">

        <div className="p-4 lg:p-6 pb-0">
          <CustomSidebarTrigger />
        </div>

        {children}

      </main>

    </SidebarProvider>
  );
}