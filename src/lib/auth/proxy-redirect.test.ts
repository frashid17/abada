import { describe, expect, it } from "vitest";
import { buildSignInRedirectUrl } from "./proxy-redirect";

describe("buildSignInRedirectUrl", () => {
  it("redirects to configured sign-in path with return URL", () => {
    const url = buildSignInRedirectUrl(
      "https://app.example.com/fundador",
      "/iniciar-sesion",
    );

    expect(url.pathname).toBe("/iniciar-sesion");
    expect(url.searchParams.get("redirect_url")).toBe("https://app.example.com/fundador");
  });

  it("falls back to default sign-in path", () => {
    const url = buildSignInRedirectUrl("https://app.example.com/inversionista");
    expect(url.pathname).toBe("/iniciar-sesion");
  });
});
