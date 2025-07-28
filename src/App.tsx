import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import NotFound from "./pages/NotFound";

// Layout
import { Layout } from "./components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<Layout><DashboardOverview /></Layout>} />
          <Route path="/dashboard/leads" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Leads Pipeline - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/campaigns" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Campaign Manager - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/analytics" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Analytics Hub - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/automation" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Automation Studio - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/ai-chat" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">AI Copilot - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/settings" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Settings - Coming Soon</h1></div></Layout>} />
          <Route path="/dashboard/profile" element={<Layout><div className="p-6"><h1 className="text-2xl font-bold">Profile - Coming Soon</h1></div></Layout>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
