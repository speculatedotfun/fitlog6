// app/layout.tsx

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

// Enhanced Outfit font with all weights we use
const outfit = Outfit({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "FitLog Pro",
  description: "Professional Fitness Training Management Platform",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#1A1D2E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          /* Global CSS Variables */
          :root {
            /* Colors */
            --color-background: #1A1D2E;
            --color-card: #2D3142;
            --color-border: #3D4058;
            --color-primary: #5B7FFF;
            --color-success: #4CAF50;
            --color-warning: #FF8A00;
            --color-error: #EF4444;
            --color-purple: #9C27B0;
            --color-text-primary: #FFFFFF;
            --color-text-secondary: #9CA3AF;
            --color-gold: #FFD700;
            
            /* Shadows */
            --shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.2);
            --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.4);
            --shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.5);
            --shadow-primary: 0 12px 48px rgba(91, 127, 255, 0.4);
            --shadow-success: 0 12px 48px rgba(76, 175, 80, 0.4);
            --shadow-warning: 0 12px 48px rgba(255, 138, 0, 0.4);
            --shadow-error: 0 12px 48px rgba(239, 68, 68, 0.4);
            
            /* Spacing */
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;
            
            /* Border Radius */
            --radius-sm: 0.5rem;
            --radius-md: 0.75rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;
            
            /* Transitions */
            --transition-fast: 150ms ease;
            --transition-base: 300ms ease;
            --transition-slow: 500ms ease;
          }
          
          /* Enhanced Scrollbar */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(91, 127, 255, 0.3) transparent;
          }
          
          *::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          *::-webkit-scrollbar-track {
            background: transparent;
          }
          
          *::-webkit-scrollbar-thumb {
            background: rgba(91, 127, 255, 0.3);
            border-radius: 3px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: rgba(91, 127, 255, 0.5);
          }
          
          /* Smooth Scroll */
          html {
            scroll-behavior: smooth;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Better Text Rendering */
          body {
            text-rendering: optimizeLegibility;
            font-feature-settings: "kern" 1;
            font-kerning: normal;
          }
          
          /* Remove Tap Highlight on Mobile */
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Better Focus Visible */
          *:focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
          }
          
          /* Disable Selection Styling on Buttons */
          button, a {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Global Animations */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideLeft {
            from { 
              opacity: 0; 
              transform: translateX(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          
          @keyframes slideRight {
            from { 
              opacity: 0; 
              transform: translateX(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          
          @keyframes scaleIn {
            from { 
              opacity: 0; 
              transform: scale(0.9); 
            }
            to { 
              opacity: 1; 
              transform: scale(1); 
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.9; 
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes glow {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(91, 127, 255, 0.4); 
            }
            50% { 
              box-shadow: 0 0 40px rgba(91, 127, 255, 0.8); 
            }
          }
          
          /* Utility Classes */
          .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
          }
          
          .animate-slide-up {
            animation: slideUp 0.6s ease-out forwards;
          }
          
          .animate-slide-down {
            animation: slideDown 0.6s ease-out forwards;
          }
          
          .animate-slide-left {
            animation: slideLeft 0.6s ease-out forwards;
          }
          
          .animate-slide-right {
            animation: slideRight 0.6s ease-out forwards;
          }
          
          .animate-scale-in {
            animation: scaleIn 0.4s ease-out forwards;
          }
          
          .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          .animate-glow {
            animation: glow 2s ease-in-out infinite;
          }
          
          /* Background Texture */
          .bg-texture {
            background-image: 
              radial-gradient(circle at 20% 30%, rgba(91, 127, 255, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(91, 127, 255, 0.02) 0%, transparent 50%);
          }
          
          /* Hover Lift Effect */
          .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-4px);
          }
          
          /* Glass Effect */
          .glass {
            background: rgba(45, 49, 66, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          /* Hide Scrollbar */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Prevent Content Shift */
          .no-shift {
            min-height: 100vh;
            min-height: 100dvh;
          }
          
          /* Safe Area Padding for Mobile */
          .safe-area-top {
            padding-top: env(safe-area-inset-top);
          }
          
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          /* Prevent Text Selection on Drag */
          .no-select {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Loading Skeleton */
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
          
          .skeleton {
            background: linear-gradient(
              90deg,
              rgba(61, 64, 88, 0.4) 0%,
              rgba(61, 64, 88, 0.6) 50%,
              rgba(61, 64, 88, 0.4) 100%
            );
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}} />
      </head>
      <body 
        className={`${outfit.variable} font-outfit antialiased bg-[#1A1D2E] text-white min-h-screen overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}