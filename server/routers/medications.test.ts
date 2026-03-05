import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Create a test context
function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Medications Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("list", () => {
    it("should return paginated medications", async () => {
      const result = await caller.medications.list({
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter by search query", async () => {
      const result = await caller.medications.list({
        page: 1,
        limit: 10,
        search: "dipirona",
      });

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should filter by category", async () => {
      const result = await caller.medications.list({
        page: 1,
        limit: 10,
        category: "medicamento",
      });

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should filter by status", async () => {
      const result = await caller.medications.list({
        page: 1,
        limit: 10,
        status: "ativo",
      });

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should handle pagination correctly", async () => {
      const page1 = await caller.medications.list({
        page: 1,
        limit: 5,
      });

      const page2 = await caller.medications.list({
        page: 2,
        limit: 5,
      });

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
      expect(page1.limit).toBe(5);
      expect(page2.limit).toBe(5);
    });
  });

  describe("search", () => {
    it("should return search results", async () => {
      const result = await caller.medications.search({
        query: "dipirona",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should limit results to 10", async () => {
      const result = await caller.medications.search({
        query: "a",
      });

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe("stats", () => {
    it("should return medication statistics", async () => {
      const result = await caller.medications.stats();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("active");
      expect(result).toHaveProperty("updated");
      expect(result).toHaveProperty("inactive");
      expect(typeof result.total).toBe("number");
      expect(typeof result.active).toBe("number");
      expect(typeof result.updated).toBe("number");
      expect(typeof result.inactive).toBe("number");
      expect(result.total).toBeGreaterThan(0);
    });

    it("should return non-negative counts", async () => {
      const result = await caller.medications.stats();

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.active).toBeGreaterThanOrEqual(0);
      expect(result.updated).toBeGreaterThanOrEqual(0);
      expect(result.inactive).toBeGreaterThanOrEqual(0);
    });
  });

  describe("recentUpdates", () => {
    it("should return recent updates", async () => {
      const result = await caller.medications.recentUpdates({
        days: 7,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should limit results to 20", async () => {
      const result = await caller.medications.recentUpdates({
        days: 30,
      });

      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe("getById", () => {
    it("should return medication by id", async () => {
      const result = await caller.medications.getById({
        id: 1,
      });

      if (result) {
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("registrationNumber");
        expect(result.id).toBe(1);
      }
    });

    it("should return null for non-existent medication", async () => {
      const result = await caller.medications.getById({
        id: 999999,
      });

      expect(result).toBeNull();
    });
  });
});
