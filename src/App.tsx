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
import LeadsPage from "./pages/dashboard/LeadsPage";
import CampaignsPage from "./pages/dashboard/CampaignsPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import AutomationPage from "./pages/dashboard/AutomationPage";
import AIChatPage from "./pages/dashboard/AIChatPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
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
          <Route path="/dashboard/leads" element={<Layout><LeadsPage /></Layout>} />
          <Route path="/dashboard/campaigns" element={<Layout><CampaignsPage /></Layout>} />
          <Route path="/dashboard/analytics" element={<Layout><AnalyticsPage /></Layout>} />
          <Route path="/dashboard/automation" element={<Layout><AutomationPage /></Layout>} />
          <Route path="/dashboard/ai-chat" element={<Layout><AIChatPage /></Layout>} />
          <Route path="/dashboard/settings" element={<Layout><SettingsPage /></Layout>} />
          <Route path="/dashboard/profile" element={<Layout><ProfilePage /></Layout>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
