"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Settings, Home, Apple, FileText, LogOut, Dumbbell, ChevronRight, BarChart3,
  TrendingUp, Trophy, User
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardHeader } from "@/components/trainee/DashboardHeader";
import { BottomNavigation } from "@/components/trainee/BottomNavigation";
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
// ENHANCED BOTTOM NAV ITEM
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
// GESTURE HINT COMPONENT
// ============================================
const GestureHint = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
      <div className="bg-[#2D3142] px-4 py-2 rounded-full text-white text-xs font-outfit flex items-center gap-2"
        style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="w-2 h-2 bg-[#5B7FFF] rounded-full animate-pulse" />
        Swipe to navigate
      </div>
    </div>
  );
};

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================
export default function TraineeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showGestureHint, setShowGestureHint] = useState(false);

  useEffect(() => {
    // Show gesture hint on first visit
    const hasSeenHint = localStorage.getItem('hasSeenGestureHint');
    if (!hasSeenHint) {
      setShowGestureHint(true);
      localStorage.setItem('hasSeenGestureHint', 'true');
    }
  }, []);

  useEffect(() => {
    // Page transition effect
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string, label: string) => {
    if (label === "Home") return pathname === "/trainee/dashboard";
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/trainee/dashboard", icon: Home, label: "Home" },
    { href: "/trainee/workout", icon: Dumbbell, label: "Workout" },
    { href: "/trainee/nutrition", icon: Apple, label: "Nutrition" },
    { href: "/trainee/history", icon: BarChart3, label: "Progress" },
    { href: "/trainee/settings", icon: Settings, label: "Settings" },
  ];

  // Bottom nav items (different from sidebar)
  const bottomNavItems = [
    { href: "/trainee/dashboard", icon: Home, label: "בית" },
    { href: "/trainee/workouts", icon: TrendingUp, label: "אימונים" },
    { href: "/trainee/history", icon: BarChart3, label: "היסטוריה" },
    { href: "/trainee/achievements", icon: Trophy, label: "הישגים" },
    { href: "/trainee/settings", icon: User, label: "פרופיל" },
  ];

  const isTraineePage = pathname.startsWith("/trainee");
  const isDashboard = pathname === "/trainee/dashboard";
  const isWorkoutPage = pathname === "/trainee/workout" || pathname.startsWith("/trainee/workout/");
  const isWorkoutsPage = pathname === "/trainee/workouts";
  const isSettingsPage = pathname === "/trainee/settings";
  const isAchievementsPage = pathname === "/trainee/achievements";
  const isHistoryPage = pathname === "/trainee/history";

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
        
        .page-transition-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .page-transition-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease-out;
        }
        
        /* Background texture for trainee pages */
        .trainee-bg {
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
        }
        
        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }
        
        /* Hide scrollbar but keep functionality */
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

      <div className={cn(
        "min-h-screen flex flex-col transition-colors duration-300",
        isTraineePage ? 'bg-[#1A1D2E] trainee-bg' : 'bg-gray-50 dark:bg-slate-950'
      )} 
      dir={isTraineePage ? 'ltr' : 'rtl'}>
        
        {/* Page Transition Overlay */}
        {isTransitioning && (
          <div className="fixed inset-0 bg-[#1A1D2E] z-50 pointer-events-none animate-fade-in"
            style={{ animation: 'fadeIn 0.2s ease-out reverse' }}
          />
        )}

        {/* Gesture Hint */}
        {isTraineePage && showGestureHint && <GestureHint />}

        {/* Dashboard Header */}
        {isTraineePage && !isDashboard && !isWorkoutPage && !isWorkoutsPage && !isSettingsPage && !isAchievementsPage && !isHistoryPage && (
          <div className="animate-fade-in">
            <DashboardHeader />
          </div>
        )}

        {/* Desktop Sidebar Navigation */}
        {!isTraineePage && (
          <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-64 border-l border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30">
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
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                    style={{
                      animation: `slideInRight 0.4s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      active && "scale-110"
                    )} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {active && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full animate-fade-in" />
                    )}
                    {!active && (
                      <ChevronRight className="h-4 w-4 mr-auto opacity-0 group-hover:opacity-50 transition-opacity duration-200" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex w-full",
          isTraineePage ? "w-full relative" : "max-w-screen-xl mx-auto"
        )}>
          <main className={cn(
            "flex-1 w-full transition-all custom-scrollbar",
            isTraineePage 
              ? (isDashboard ? "p-0" : "pb-20") 
              : "pb-24 pt-6 px-4 lg:mr-64"
          )}>
            <ProtectedRoute requiredRole="trainee">
              <PageTransition>
                {children}
              </PageTransition>
            </ProtectedRoute>
          </main>
        </div>

        {/* Enhanced Bottom Navigation for Trainee Pages */}
        {isTraineePage && (
          <div className="fixed bottom-0 left-0 right-0 z-30 animate-fade-in">
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
                          ? pathname === "/trainee/dashboard"
                          : pathname.startsWith(item.href)
                      }
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}