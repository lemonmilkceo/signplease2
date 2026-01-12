import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupportChat } from "@/components/SupportChat";
import NotFound from "./pages/NotFound";

// Pages
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import SelectRole from "./pages/SelectRole";
import EmployerDashboard from "./pages/employer/Dashboard";
import CreateContract from "./pages/employer/CreateContract";
import ContractPreview from "./pages/employer/ContractPreview";
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerContractView from "./pages/worker/ContractView";
import WorkerOnboarding from "./pages/WorkerOnboarding";
import EmployerChat from "./pages/employer/Chat";
import WorkerChat from "./pages/worker/Chat";
import Pricing from "./pages/Pricing";
import LegalReviewPricing from "./pages/LegalReviewPricing";
import BundlePricing from "./pages/BundlePricing";
import Profile from "./pages/Profile";
import PaymentHistory from "./pages/PaymentHistory";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="max-w-md mx-auto min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/select-role" element={<SelectRole />} />
              
{/* Employer Routes */}
              <Route path="/employer" element={<EmployerDashboard />} />
              <Route path="/employer/create" element={<CreateContract />} />
              <Route path="/employer/preview/:id" element={<ContractPreview />} />
              <Route path="/employer/chat" element={<EmployerChat />} />
              <Route path="/employer/contract/:id" element={<ContractPreview />} />
              
{/* Worker Routes */}
              <Route path="/worker" element={<WorkerDashboard />} />
              <Route path="/worker/onboarding" element={<WorkerOnboarding />} />
              <Route path="/worker/chat" element={<WorkerChat />} />
              <Route path="/worker/contract/:id" element={<WorkerContractView />} />
              
              {/* Common Routes */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/legal-review-pricing" element={<LegalReviewPricing />} />
              <Route path="/bundle-pricing" element={<BundlePricing />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Floating Support Chat */}
            <SupportChat />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
