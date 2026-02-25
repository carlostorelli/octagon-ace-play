import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Trophy, Calendar, BarChart3, Menu, X, Shield, User } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/events", label: "Eventos", icon: Calendar },
  { path: "/predictions", label: "Palpites", icon: Swords },
  { path: "/leaderboard", label: "Ranking", icon: Trophy },
  { path: "/profile", label: "Perfil", icon: User },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAdmin();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-wider uppercase">
              OSS<span className="text-primary"> Fantasy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-primary-foreground bg-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-primary-foreground bg-primary"
                    : "text-accent hover:bg-secondary"
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-border bg-background p-4 space-y-1"
          >
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-primary-foreground bg-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-primary-foreground bg-primary"
                    : "text-accent hover:bg-secondary"
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </motion.nav>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
};

export default AppLayout;
