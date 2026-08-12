import { describe, expect, it } from "vitest";
import {
  buildPlaybookPromptContext,
  getPlaybookArea,
  listPlaybookAreas,
  PLAYBOOK_AREAS,
} from "@/lib/dd/playbook";

describe("DD playbook", () => {
  it("exposes review areas aligned to the firm package", () => {
    expect(listPlaybookAreas().length).toBeGreaterThanOrEqual(8);
    expect(PLAYBOOK_AREAS.ip_technology.riskCategory).toBe("propiedad_intelectual");
    expect(getPlaybookArea("equity_compensation")?.uploadCategory).toBe("equity_compensation");
  });

  it("builds prompt context for AI dd_finding", () => {
    const ctx = buildPlaybookPromptContext("en");
    expect(ctx).toContain("DD Playbook");
    expect(ctx).toContain("Information required");
    expect(ctx).toContain("ip_technology");
  });
});
