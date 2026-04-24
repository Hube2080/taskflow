import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const listProjectFilesMock = vi.fn();
const createProjectFileMock = vi.fn();
const storagePutMock = vi.fn();

vi.mock("./db", () => ({
  createProjectFile: createProjectFileMock,
  listProjectFiles: listProjectFilesMock,
}));

vi.mock("./storage", () => ({
  storagePut: storagePutMock,
}));

async function createCaller() {
  const { appRouter } = await import("./routers");

  const ctx: TrpcContext = {
    user: {
      id: 42,
      openId: "owner-open-id",
      email: "owner@example.com",
      name: "Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return appRouter.createCaller(ctx);
}

describe("files router", () => {
  beforeEach(() => {
    vi.resetModules();
    listProjectFilesMock.mockReset();
    createProjectFileMock.mockReset();
    storagePutMock.mockReset();
  });

  it("lists files for a project task", async () => {
    const createdAt = new Date("2026-03-17T12:00:00Z");
    listProjectFilesMock.mockResolvedValue([
      {
        id: 1,
        ownerId: 42,
        projectId: "p_antigone",
        taskId: "task_0001",
        fileKey: "owner-open-id/projects/p_antigone/task_0001/file.pdf",
        url: "https://cdn.example.com/file.pdf",
        originalName: "briefing.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const caller = await createCaller();
    const result = await caller.files.list({ projectId: "p_antigone", taskId: "task_0001" });

    expect(listProjectFilesMock).toHaveBeenCalledWith(42, "p_antigone", "task_0001");
    expect(result).toHaveLength(1);
    expect(result[0]?.originalName).toBe("briefing.pdf");
  });

  it("uploads a file and persists metadata", async () => {
    storagePutMock.mockResolvedValue({
      key: "owner-open-id/projects/p_antigone/task_0001/generated-briefing.pdf",
      url: "https://cdn.example.com/generated-briefing.pdf",
    });
    createProjectFileMock.mockResolvedValue({
      id: 9,
      ownerId: 42,
      projectId: "p_antigone",
      taskId: "task_0001",
      fileKey: "owner-open-id/projects/p_antigone/task_0001/generated-briefing.pdf",
      url: "https://cdn.example.com/generated-briefing.pdf",
      originalName: "briefing.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12,
      createdAt: new Date("2026-03-17T12:00:00Z"),
      updatedAt: new Date("2026-03-17T12:00:00Z"),
    });

    const caller = await createCaller();
    const result = await caller.files.upload({
      projectId: "p_antigone",
      taskId: "task_0001",
      fileName: "briefing.pdf",
      mimeType: "application/pdf",
      base64: Buffer.from("hello world").toString("base64"),
      sizeBytes: 12,
    });

    expect(storagePutMock).toHaveBeenCalledTimes(1);
    expect(createProjectFileMock).toHaveBeenCalledTimes(1);
    expect(createProjectFileMock.mock.calls[0]?.[0]).toMatchObject({
      ownerId: 42,
      projectId: "p_antigone",
      taskId: "task_0001",
      originalName: "briefing.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12,
    });
    expect(result.originalName).toBe("briefing.pdf");
  });
});
