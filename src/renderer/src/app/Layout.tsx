import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../lib/utils';

const tabs = [
  { to: '/resumes', label: 'Resumes' },
  { to: '/ai-settings', label: 'AI Settings' },
];

export default function Layout() {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-3">
          <div className="mr-6 font-semibold tracking-tight">SG Resume Enhancer</div>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-foreground/5 text-foreground'
                      : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
