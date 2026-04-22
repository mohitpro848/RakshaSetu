import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { FontSizeProvider } from "@/lib/fontSizeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ClientOnly } from "@/components/ClientOnly";
import { lazy, Suspense } from "react";

const AuthProvider = lazy(() => import("@/hooks/useAuth").then(m => ({ default: m.AuthProvider })));
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RakshaSetu — Every Citizen Safety Platform" },
      { name: "description", content: "RakshaSetu is India’s comprehensive citizen safety platform, featuring SOS alerts, real-time location tracking, emergency contact integration, and community rep" },
      { property: "og:title", content: "RakshaSetu — Every Citizen Safety Platform" },
      { name: "twitter:title", content: "RakshaSetu — Every Citizen Safety Platform" },
      { property: "og:description", content: "RakshaSetu is India’s comprehensive citizen safety platform, featuring SOS alerts, real-time location tracking, emergency contact integration, and community rep" },
      { name: "twitter:description", content: "RakshaSetu is India’s comprehensive citizen safety platform, featuring SOS alerts, real-time location tracking, emergency contact integration, and community rep" },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/41c05604-c587-46f2-91ea-5df2162506e7" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/41c05604-c587-46f2-91ea-5df2162506e7" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <FontSizeProvider>
          <TooltipProvider>
            <Sonner />
            <ClientOnly fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            }>
              <Suspense fallback={null}>
                <Toaster />
                <AuthProvider>
                  <Outlet />
                </AuthProvider>
              </Suspense>
            </ClientOnly>
          </TooltipProvider>
        </FontSizeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
