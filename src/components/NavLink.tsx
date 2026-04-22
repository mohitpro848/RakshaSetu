import { Link } from "@tanstack/react-router";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  className?: string;
  activeClassName?: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, to, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        className={className}
        activeProps={{ className: cn(className, activeClassName) }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
