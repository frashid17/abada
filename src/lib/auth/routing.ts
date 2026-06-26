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
    pathname.startsWith("/firma")
  );
}

export function shellForPath(pathname: string): "public" | "founder" | "investor" | "firm" {
  if (pathname.startsWith("/fundador")) return "founder";
  if (pathname.startsWith("/inversionista")) return "investor";
  if (pathname.startsWith("/firma")) return "firm";
  return "public";
}
