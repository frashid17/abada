import type { UserContext } from "@/types/database";

const contextHome: Record<UserContext, string> = {
  founder: "/fundador",
  investor: "/inversionista",
  firm: "/firma",
};

export function homeForContext(context: UserContext): string {
  return contextHome[context];
}

export function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/fundador") ||
    pathname.startsWith("/inversionista") ||
    pathname.startsWith("/firma") ||
    pathname.startsWith("/admin")
  );
}

export function shellForPath(pathname: string): "public" | "founder" | "investor" | "firm" | "admin" {
  if (pathname.startsWith("/fundador")) return "founder";
  if (pathname.startsWith("/inversionista")) return "investor";
  if (pathname.startsWith("/firma")) return "firm";
  if (pathname.startsWith("/admin")) return "admin";
  return "public";
}
