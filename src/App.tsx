import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const PredictionsPage = lazy(() => import("./pages/PredictionsPage"));
const EventPredictionsPage = lazy(() => import("./pages/EventPredictionsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const LineupPage = lazy(() => import("./pages/LineupPage"));
const InputShowcase = lazy(() => import("./pages/InputShowcase"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminScoring = lazy(() => import("./pages/admin/AdminScoring"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminFights = lazy(() => import("./pages/admin/AdminFights"));
const AdminResults = lazy(() => import("./pages/admin/AdminResults"));
const AdminRegulamento = lazy(() => import("./pages/admin/AdminRegulamento"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminPredictions = lazy(() => import("./pages/admin/AdminPredictions"));
const AdminFighters = lazy(() => import("./pages/admin/AdminFighters"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min stale time to reduce refetches
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/predictions/:eventId" element={<EventPredictionsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/lineup" element={<LineupPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/components/input" element={<InputShowcase />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/fighters" element={<AdminFighters />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/events/:eventId/card" element={<AdminFights />} />
              <Route path="/admin/events/:eventId/fights" element={<AdminFights />} />
              <Route path="/admin/events/:eventId/results" element={<AdminResults />} />
              <Route path="/admin/predictions" element={<AdminPredictions />} />
              <Route path="/admin/scoring" element={<AdminScoring />} />
              <Route path="/admin/regulamento" element={<AdminRegulamento />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
