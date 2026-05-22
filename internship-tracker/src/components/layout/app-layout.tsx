import { Link, useLocation } from "wouter";
import { BookOpen, BriefcaseBusiness, LayoutDashboard, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/internships", label: "Applications", icon: BriefcaseBusiness },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>InternQuest</span>
        </div>
        <nav className="flex items-center gap-6 ml-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/internships/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New App</span>
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
