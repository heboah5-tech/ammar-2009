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
    <div className="border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto py-6 sm:py-8 px-4">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1 sm:mb-2">
            نظام الفواتير
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600">إنشاء وإدارة الفواتير</p>
        </div>
        <nav className="flex justify-center gap-2 sm:gap-3" dir="rtl">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
              isInvoices
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الفواتير</span>
          </Link>
          <Link
            href="/dental-work"
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
              isDental
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>الأعمال السنية</span>
          </Link>
        </nav>
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
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
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
