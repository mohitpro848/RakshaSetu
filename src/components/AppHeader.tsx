import { Menu, X, LogOut, User, Settings, FileText, ChevronDown, Pencil, UserCog } from "lucide-react";
import RakshaSetuLogo from "@/components/RakshaSetuLogo";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const AppHeader = () => {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userEmail = user?.email || "";
  const userPhone = user?.user_metadata?.phone || user?.phone || "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate({ to: "/auth" });
  };

  const menuItems = [
    { label: "View Profile", icon: User, action: () => navigate({ to: "/profile" }) },
    { label: "Edit Profile", icon: UserCog, action: () => navigate({ to: "/profile" }) },
    { label: "My Reports", icon: FileText, action: () => {} },
    { label: "Settings", icon: Settings, action: () => navigate({ to: "/settings" }) },
  ];

  const navItems = [
    { key: "nav.dashboard" },
    { key: "nav.alerts" },
    { key: "nav.map" },
    { key: "nav.training" },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 gap-2">
        {/* Left: Logo + App Name */}
        <div className="flex items-center gap-2 min-w-0">
          <RakshaSetuLogo size={32} className="rounded-lg flex-shrink-0" />
          <div className="leading-tight min-w-0">
            <h1 className="text-sm font-bold text-foreground tracking-tight truncate">{t("app.name")}</h1>
            <p className="text-[10px] text-muted-foreground truncate">{t("app.tagline")}</p>
          </div>
        </div>

        {/* Right side: Profile + Nav + Hamburger */}
        <div className="flex items-center gap-2 min-w-0">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white/10 backdrop-blur-lg border border-white/10 hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(34,197,94,0.35)] transition-all duration-200 active:scale-[0.97] max-w-[180px]"
              >
                <Avatar className="w-[30px] h-[30px] flex-shrink-0 border-2 border-[oklch(0.72_0.19_152)]">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground max-w-[90px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={`w-3 h-3 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl border border-border/50 bg-card/90 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="w-12 h-12 border-2 border-[oklch(0.72_0.19_152)]/30 shadow-md">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <button className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        {userEmail && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{userEmail}</p>
                        )}
                        {userPhone && (
                          <p className="text-[11px] text-muted-foreground truncate">{userPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5 px-1.5">
                    {menuItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/80 rounded-lg hover:bg-accent hover:text-foreground transition-colors duration-150 group"
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border/30 p-1.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="px-4 py-1.5 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors active:scale-[0.97]"
            >
              {t("nav.login")}
            </button>
          )}

          {/* Center: Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                className="px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                {t(item.key)}
              </button>
            ))}
          </nav>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <nav className="flex flex-col p-2 gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.key}
                className="px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent rounded-md text-left transition-colors"
              >
                {t(item.key)}
              </button>
            ))}
            {user && (
              <button
                onClick={handleSignOut}
                className="px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md text-left transition-colors"
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
