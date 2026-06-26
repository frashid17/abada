import { describe, expect, it } from "vitest";
import {
  clearBrainCache,
  listPendingBrainSlots,
  loadBrainDocuments,
  loadBrainSystemPrompt,
  loadCorpusInventory,
  summarizeCorpusInventory,
} from "./loader";

describe("brain loader", () => {
  it("loads manifest brain documents in order", () => {
    clearBrainCache();
    const docs = loadBrainDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(3);
    expect(docs[0]?.id).toBe("01-context");
    expect(docs[1]?.id).toBe("02-voice");
    expect(docs[2]?.id).toBe("03-memory");
    expect(docs[0]?.content).toMatch(/Context|brain series/i);
  });

  it("assembles a combined system prompt", () => {
    clearBrainCache();
    const prompt = loadBrainSystemPrompt();
    expect(prompt.combined).toContain("## Context");
    expect(prompt.combined).toContain("## Voice and Communication");
    expect(prompt.combined).toContain("## Memory");
    expect(prompt.missingRequired).toEqual([]);
  });

  it("loads corpus inventory metadata", () => {
    const inventory = loadCorpusInventory();
    expect(inventory).not.toBeNull();
    expect(inventory?.summary?.total).toBeGreaterThan(100);
    const summary = summarizeCorpusInventory(inventory!);
    expect(summary).toContain("TODO(legal)");
  });

  it("lists pending brain slots for future documents", () => {
    const pending = listPendingBrainSlots();
    expect(pending.some((p) => p.id.includes("system-operating"))).toBe(true);
  });
});
