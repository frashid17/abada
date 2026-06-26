import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intl = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  "/fundador(.*)",
  "/inversionista(.*)",
  "/firma(.*)",
  "/cuenta(.*)",
  "/onboarding(.*)",
]);

/**
 * Locale negotiation + Clerk session guard. Pending sessions (session tasks) are
 * not treated as signed-in — matches auth({ treatPendingAsSignedOut: true }).
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return intl(request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
