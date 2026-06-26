import { describe, expect, it } from "vitest";
import { toAbsoluteAppUrl } from "@/lib/auth/app-url";

describe("toAbsoluteAppUrl", () => {
  it("prefixes relative paths with the public app URL", () => {
    expect(toAbsoluteAppUrl("/firma")).toBe("http://localhost:3000/firma");
    expect(toAbsoluteAppUrl("sso-callback")).toBe("http://localhost:3000/sso-callback");
  });
});
