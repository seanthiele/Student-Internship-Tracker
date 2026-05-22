import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import InternshipsList from "@/pages/internships/list";
import InternshipDetail from "@/pages/internships/detail";
import InternshipForm from "@/pages/internships/form";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/internships" component={InternshipsList} />
        <Route path="/internships/new" component={InternshipsFormRouter} />
        <Route path="/internships/:id/edit" component={InternshipsFormRouter} />
        <Route path="/internships/:id" component={InternshipsDetailRouter} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// Wrapper components to handle named vs parameterized routes correctly
function InternshipsFormRouter({ params }: { params: { id?: string } }) {
  const isNew = !params.id || params.id === "new";
  if (isNew) return <InternshipForm key="new" />;
  return <InternshipForm key={params.id} />;
}

function InternshipsDetailRouter({ params }: { params: { id: string } }) {
  if (!params.id || params.id === "new") return <NotFound />;
  return <InternshipDetail />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
