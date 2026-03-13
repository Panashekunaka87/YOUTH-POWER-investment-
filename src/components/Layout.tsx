import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, Users, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/tasks', icon: ClipboardList, label: 'Task' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/account', icon: User, label: 'Account' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans text-neutral-900">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <span className="text-xl font-bold">YP</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-emerald-900">YOUTHS POWER 🫂</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-white px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-colors duration-200",
                isActive ? "text-emerald-600" : "text-neutral-400 hover:text-neutral-600"
              )
            }
          >
            <item.icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
