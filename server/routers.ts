import { randomUUID } from "crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createProjectFile, listProjectFiles } from "./db";
import { storagePut } from "./storage";

const uploadFileInput = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1).nullable().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  base64: z.string().min(1),
  sizeBytes: z.number().int().positive().max(15 * 1024 * 1024),
});

const listFilesInput = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1).nullable().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  files: router({
    list: protectedProcedure.input(listFilesInput).query(async ({ ctx, input }) => {
      return listProjectFiles(ctx.user.id, input.projectId, input.taskId ?? undefined);
    }),
    upload: protectedProcedure.input(uploadFileInput).mutation(async ({ ctx, input }) => {
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const key = `${ctx.user.openId}/projects/${input.projectId}/${input.taskId ?? "project"}/${Date.now()}-${randomUUID()}-${safeName}`;
      const bytes = Buffer.from(input.base64, "base64");
      const uploaded = await storagePut(key, bytes, input.mimeType);

      return createProjectFile({
        ownerId: ctx.user.id,
        projectId: input.projectId,
        taskId: input.taskId ?? null,
        fileKey: uploaded.key,
        url: uploaded.url,
        originalName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;
