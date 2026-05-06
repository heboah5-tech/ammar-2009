import { Switch, Route, Link, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileText, Stethoscope } from "lucide-react";
import NotFound from "@/pages/not-found";
import InvoicesPage from "@/pages/invoices";
import DentalWorkPage from "@/pages/dental-work";

const queryClient = new QueryClient();

function Header() {
  const [location] = useLocation();
  const isInvoices = location === "/" || location.startsWith("/invoices");
  const isDental = location.startsWith("/dental-work");

  return (
    <div className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="container mx-auto py-5 sm:py-7 px-4 relative" dir="rtl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-l from-blue-700 to-indigo-700 bg-clip-text text-transparent leading-tight">
                نظام الفواتير
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">مختبر نورمار للأسنان</p>
            </div>
          </div>

          <nav className="flex gap-1 sm:gap-2 bg-slate-100/80 p-1 rounded-2xl">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                isInvoices
                  ? "bg-white text-blue-700 shadow-md shadow-blue-500/10"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>الفواتير</span>
            </Link>
            <Link
              href="/dental-work"
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                isDental
                  ? "bg-white text-blue-700 shadow-md shadow-blue-500/10"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>الأعمال السنية</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={InvoicesPage} />
      <Route path="/dental-work" component={DentalWorkPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30" dir="rtl">
            <Header />
            <Router />
          </main>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
