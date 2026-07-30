"use client";

import { useEffect } from "react";
import NextError from "next/error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
    const enableInDev = process.env.NEXT_PUBLIC_SENTRY_DEV === "true";
    const enabled =
      Boolean(dsn) && (process.env.NODE_ENV === "production" || enableInDev);
    if (!enabled) return;
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="es-CO">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
