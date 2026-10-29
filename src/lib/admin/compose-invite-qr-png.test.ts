import { describe, expect, it } from "vitest";
import { wrapCanvasText, wrapUrlForCanvas } from "@/lib/admin/compose-invite-qr-png";

describe("wrapCanvasText", () => {
  it("keeps short text on one line", () => {
    const measure = (text: string) => text.length * 10;
    expect(wrapCanvasText(measure, "Hello world", 200)).toEqual(["Hello world"]);
  });

  it("wraps when words exceed max width", () => {
    const measure = (text: string) => text.length * 10;
    expect(wrapCanvasText(measure, "one two three four", 50)).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });
});

describe("wrapUrlForCanvas", () => {
  it("returns the url unchanged when it fits", () => {
    const measure = (text: string) => text.length;
    expect(wrapUrlForCanvas(measure, "https://abada.co/x", 40)).toEqual(["https://abada.co/x"]);
  });

  it("chunks a long url to fit the width", () => {
    const measure = (text: string) => text.length;
    const url = "https://example.com/registro?context=founder&redirect_url=/fundador/documentos";
    const lines = wrapUrlForCanvas(measure, url, 24);
    expect(lines.join("")).toBe(url);
    expect(lines.every((line) => line.length <= 24)).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });
});
