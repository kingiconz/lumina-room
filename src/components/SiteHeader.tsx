import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/assets/logo.png" 
            alt="e-Crime Bureau Logo" 
            className="h-10 w-10 object-contain"
          />
          <div>
            <div className="text-xl font-semibold tracking-tight">e-Crime Bureau</div>
            <div className="-mt-1 text-xs text-muted-foreground">Meeting Room Management</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#rooms" className="text-muted-foreground transition-smooth hover:text-foreground">Rooms</a>
          <a href="#schedule" className="text-muted-foreground transition-smooth hover:text-foreground">Schedule</a>
          <a href="#about" className="text-muted-foreground transition-smooth hover:text-foreground">About</a>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success md:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
