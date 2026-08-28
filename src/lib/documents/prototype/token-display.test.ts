import { describe, expect, it } from "vitest";
import { formatPrototypeDate, getTokenSample, resolveTokenDisplay } from "./token-display";

describe("token-display", () => {
  it("formats ISO dates for display", () => {
    expect(formatPrototypeDate("2026-09-01", "es")).toBe("1 de septiembre de 2026");
    expect(formatPrototypeDate("2026-09-01", "en")).toBe("September 1, 2026");
  });

  it("shows sample company name when value is empty", () => {
    expect(resolveTokenDisplay("co.nombre", "", "es")).toEqual({
      label: "Acme Colombia",
      isUserValue: false,
    });
  });

  it("shows user value when set", () => {
    expect(resolveTokenDisplay("co.nombre", "Mi Startup", "es")).toEqual({
      label: "Mi Startup",
      isUserValue: true,
    });
  });

  it("returns sample date formatted in the active language", () => {
    expect(getTokenSample("co.fecha", "es")).toBe("1 de septiembre de 2026");
    expect(getTokenSample("co.fecha", "en")).toBe("September 1, 2026");
  });
});
