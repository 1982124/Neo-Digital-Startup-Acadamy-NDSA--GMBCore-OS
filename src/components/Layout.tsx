import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, HeartPulse, Wallet, Bot, Settings, LogOut } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  user: any;
  distributor: any;
}

export default function Layout({ user, distributor }: LayoutProps) {
  const location = useLocation();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => auth.signOut();

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#131317] shadow-[0_40px_40px_-5px_rgba(0,219,231,0.08)] bg-gradient-to-b from-[#1b1b1f] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center">
            <Bot className="w-5 h-5 text-on-primary" />
          </div>
          <span className="text-xl font-black tracking-widest text-[#e1fdff] font-headline uppercase leading-none">GMBC-OS</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-primary">{user.displayName}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                  {distributor ? distributor.plan : 'Public'}
                </p>
              </div>
              <img 
                src={user.photoURL || ''} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-outline-variant/30"
              />
              <button 
                onClick={handleLogout}
                className="p-2 text-on-surface-variant hover:text-error transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-4 py-2 bg-primary-container text-on-primary font-label text-xs font-bold uppercase tracking-widest rounded-sm hover:brightness-110 transition-all"
            >
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#131317]/80 backdrop-blur-xl border-t border-[#3a494b]/15 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-lg">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 duration-200",
            isActive ? "text-[#00f2ff] bg-[#1f1f24] rounded-md shadow-[0_0_15px_rgba(0,242,255,0.2)]" : "text-[#3a494b] hover:text-[#e1fdff]"
          )}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="font-headline text-[10px] uppercase tracking-[0.1em] font-medium">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/coach" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 duration-200",
            isActive ? "text-[#00f2ff] bg-[#1f1f24] rounded-md shadow-[0_0_15px_rgba(0,242,255,0.2)]" : "text-[#3a494b] hover:text-[#e1fdff]"
          )}
        >
          <Bot className="w-6 h-6 mb-1" />
          <span className="font-headline text-[10px] uppercase tracking-[0.1em] font-medium">Coach José</span>
        </NavLink>

        <NavLink 
          to="/" 
          end
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 duration-200",
            isActive ? "text-[#00f2ff] bg-[#1f1f24] rounded-md shadow-[0_0_15px_rgba(0,242,255,0.2)]" : "text-[#3a494b] hover:text-[#e1fdff]"
          )}
        >
          <HeartPulse className="w-6 h-6 mb-1" />
          <span className="font-headline text-[10px] uppercase tracking-[0.1em] font-medium">Santé</span>
        </NavLink>

        <NavLink 
          to="/onboarding" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 duration-200",
            isActive ? "text-[#00f2ff] bg-[#1f1f24] rounded-md shadow-[0_0_15px_rgba(0,242,255,0.2)]" : "text-[#3a494b] hover:text-[#e1fdff]"
          )}
        >
          <Wallet className="w-6 h-6 mb-1" />
          <span className="font-headline text-[10px] uppercase tracking-[0.1em] font-medium">Business</span>
        </NavLink>
      </nav>
    </div>
  );
}
