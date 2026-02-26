import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Settings, ArrowLeft, Shield, Loader2, Wrench, FileText, Bell, Eye } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const adminNav = [
  { path: "/admin", label: "Visão Geral", icon: Shield },
  { path: "/admin/users", label: "Usuários", icon: Users },
  { path: "/admin/events", label: "Eventos", icon: Calendar },
  { path: "/admin/predictions", label: "Palpites", icon: Eye },
  { path: "/admin/scoring", label: "Pontuação", icon: Settings },
  { path: "/admin/notifications", label: "Notificações", icon: Bell },
  { path: "/admin/regulamento", label: "Regulamento", icon: FileText },
  { path: "/admin/settings", label: "Configurações", icon: Wrench },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Voltar</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold tracking-wider uppercase">
                Admin<span className="text-primary"> Panel</span>
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {adminNav.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "text-primary-foreground bg-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
};

export default AdminLayout;
