import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Navigation, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/navigate', icon: Navigation, label: 'Navigate', isCenter: true },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label, isCenter }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isCenter ? (
                  <div
                    className={`w-12 h-12 -mt-6 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-bg-secondary text-text-muted border border-border'
                    }`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                ) : (
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                )}
                <span className={`text-[10px] font-medium ${isCenter ? 'mt-0.5' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
