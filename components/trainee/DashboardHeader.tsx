"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <>
      {/* Welcome Header with Avatar and Notification - Exact Figma: Frame 19, width 353px, height 56px, gap 38px */}
      <div className="px-5" style={{ paddingTop: '24px', width: '353px' }}>
        <div className="flex flex-row justify-between items-center w-full" style={{ height: '56px', gap: '38px' }}>
          <div className="flex items-center" style={{ gap: '12px', width: '158px', height: '56px' }}>
            <Avatar className="w-14 h-14 flex-shrink-0">
              <AvatarImage src={user?.profile_image_url || undefined} />
              <AvatarFallback className="bg-grey-g5 text-grey-g1">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center items-start" style={{ gap: '2px', width: '90px', height: '48px' }}>
              <div className="text-grey-g1 text-xs font-outfit font-normal leading-[16px]" style={{ width: '50px', height: '16px' }}>
                Welcome
              </div>
              <div className="text-white text-2xl font-outfit font-semibold leading-[30px]" style={{ width: '90px', height: '30px' }}>
                {user?.name || 'Stephen'}
              </div>
            </div>
          </div>
          <div className="w-8 h-8 bg-grey-g5 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </>
  );
}

