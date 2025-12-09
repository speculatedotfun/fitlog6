"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Settings, Users, Home, Apple, FileText, LogOut, Dumbbell, ChevronRight,
  BarChart3, Trophy
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ============================================
// PAGE TRANSITION COMPONENT
// ============================================
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  return (
    <div 
      className={cn(
        "w-full transition-all duration-500 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {children}
    </div>
  );
};

// ============================================
// BOTTOM NAV ITEM COMPONENT
// ============================================
const BottomNavItem = ({ 
  href, 
  icon: Icon, 
  label, 
  isActive,
  index = 0
}: { 
  href: string; 
  icon: any; 
  label: string; 
  isActive: boolean;
  index?: number;
}) => {
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  };

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className="flex flex-col items-center justify-center gap-1 group relative"
      style={{
        animation: `slideUpNav 0.4s ease-out ${index * 0.05}s both`
      }}
    >
      {/* Ripple Effect */}
      {ripple && (
        <div 
          className="absolute inset-0 rounded-full bg-[#5B7FFF]/20 animate-ping"
          style={{ animationDuration: '0.6s' }}
        />
      )}
      
      {/* Active Indicator */}
      {isActive && (
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#5B7FFF] rounded-full animate-fade-in"
          style={{ boxShadow: '0 0 12px rgba(91, 127, 255, 0.6)' }}
        />
      )}
      
      {/* Icon Container */}
      <div className={cn(
        "relative w-12 h-9 flex items-center justify-center rounded-full transition-all duration-300",
        isActive 
          ? "bg-[#5B7FFF] scale-110 shadow-lg shadow-[#5B7FFF]/40" 
          : "bg-transparent group-hover:bg-[#2D3142] group-active:scale-95"
      )}>
        <Icon className={cn(
          "transition-all duration-300",
          isActive 
            ? "w-6 h-6 text-white" 
            : "w-6 h-6 text-[#9CA3AF] group-hover:text-white group-hover:scale-110"
        )} />
        
        {/* Glow Effect */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-[#5B7FFF] blur-xl opacity-50 animate-pulse" />
        )}
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-xs font-outfit font-medium transition-all duration-300",
        isActive 
          ? "text-[#5B7FFF] font-semibold" 
          : "text-[#9CA3AF] group-hover:text-white"
      )}>
        {label}
      </span>
    </Link>
  );
};

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================
export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string, label: string) => {
    if (label === "דף בית") return pathname === "/trainer";
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/trainer", icon: Home, label: "דף בית" },
    { href: "/trainer/trainees", icon: Users, label: "מתאמנים" },
    { href: "/trainer/nutrition-plans", icon: Apple, label: "תזונה" },
    { href: "/trainer/reports", icon: FileText, label: "דוחות" },
    { href: "/trainer/settings", icon: Settings, label: "הגדרות" },
  ];

  const bottomNavItems = [
    { href: "/trainer", icon: Home, label: "בית" },
    { href: "/trainer/trainees", icon: Users, label: "מתאמנים" },
    { href: "/trainer/reports", icon: BarChart3, label: "דוחות" },
    { href: "/trainer/nutrition-plans", icon: Apple, label: "תזונה" },
    { href: "/trainer/settings", icon: Settings, label: "הגדרות" },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUpNav {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(91, 127, 255, 0.4); }
          50% { box-shadow: 0 0 40px rgba(91, 127, 255, 0.8); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .trainer-bg {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(91, 127, 255, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(91, 127, 255, 0.5);
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-[#1A1D2E] trainer-bg transition-colors duration-300" dir="rtl">
        
        {/* Page Transition Overlay */}
        {isTransitioning && (
          <div className="fixed inset-0 bg-[#1A1D2E] z-50 pointer-events-none animate-fade-in"
            style={{ animation: 'fadeIn 0.2s ease-out reverse' }}
          />
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b border-[#2D3142] bg-[#1A1D2E]/95 backdrop-blur-md animate-fade-in"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}
        >
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 mx-auto max-w-screen-xl">
            <Link 
              href="/trainer" 
              className="flex items-center gap-2.5 group transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="p-1.5 rounded-lg bg-[#2D3142] group-hover:bg-[#3D4058] transition-all"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
              >
                <Dumbbell className="h-5 w-5 text-[#5B7FFF] group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-xl font-outfit font-bold text-white tracking-tight group-hover:text-[#5B7FFF] transition-colors">
                FitLog <span className="text-[#5B7FFF]">Trainer</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none focus:outline-none rounded-full transition-all hover:scale-105 active:scale-95">
                    <Avatar className="h-9 w-9 cursor-pointer border-2 border-[#3D4058] hover:border-[#5B7FFF] transition-all shadow-sm hover:shadow-md">
                      <AvatarFallback className="bg-[#2D3142] text-white font-outfit font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 rounded-xl shadow-2xl border border-[#2D3142] bg-[#1F2233] p-2 animate-fade-in" 
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="px-3 py-3 mb-1">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-outfit font-bold text-white">
                        {user?.name || "משתמש"}
                      </p>
                      <p className="text-xs text-[#9CA3AF] truncate font-outfit">
                        {user?.email || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2D3142] my-1" />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/trainer/settings" 
                      className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm text-white hover:bg-[#2D3142] rounded-lg transition-all font-outfit"
                    >
                      <Settings className="h-4 w-4" />
                      <span>הגדרות</span>
                      <ChevronRight className="h-4 w-4 mr-auto opacity-50" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2D3142] my-1" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-outfit"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>התנתק</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-64 border-l border-[#2D3142] bg-[#2D3142]/70 backdrop-blur-md z-30">
          <nav className="w-full p-4 space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.label);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    active
                      ? "bg-[#5B7FFF] text-white shadow-lg shadow-[#5B7FFF]/30"
                      : "hover:bg-[#3D4058] text-[#9CA3AF]"
                  )}
                  style={{
                    animation: `slideInRight 0.4s ease-out ${index * 0.05}s both`
                  }}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110"
                  )} />
                  <span className="text-sm font-outfit font-medium">{item.label}</span>
                  {active && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-fade-in" />
                  )}
                  {!active && (
                    <ChevronRight className="h-4 w-4 mr-auto opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex max-w-screen-xl mx-auto w-full">
          <main className={cn(
            "flex-1 w-full pb-24 pt-6 px-4 transition-all custom-scrollbar",
            "lg:mr-64"
          )}>
            <ProtectedRoute requiredRole="trainer">
              <PageTransition>
                {children}
              </PageTransition>
            </ProtectedRoute>
          </main>
        </div>

        {/* Enhanced Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
          <div className="relative">
            {/* Gradient Overlay */}
            <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#1A1D2E] to-transparent pointer-events-none" />
            
            {/* Nav Container */}
            <div 
              className="bg-[#1A1D2E] border-t border-[#2D3142]"
              style={{ 
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="max-w-[393px] mx-auto flex items-center justify-around h-20 px-4">
                {bottomNavItems.map((item, index) => (
                  <BottomNavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={
                      item.label === "בית" 
                        ? pathname === "/trainer"
                        : pathname.startsWith(item.href)
                    }
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}