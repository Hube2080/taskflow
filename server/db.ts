import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertProjectFile, InsertUser, projectFiles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listProjectFiles(ownerId: number, projectId: string, taskId?: string | null) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const filters = [eq(projectFiles.ownerId, ownerId), eq(projectFiles.projectId, projectId)];

  if (taskId === null) {
    filters.push(eq(projectFiles.taskId, null as unknown as string));
  } else if (typeof taskId === "string" && taskId.length > 0) {
    filters.push(eq(projectFiles.taskId, taskId));
  }

  return db
    .select()
    .from(projectFiles)
    .where(and(...filters))
    .orderBy(desc(projectFiles.createdAt), desc(projectFiles.id));
}

export async function createProjectFile(file: InsertProjectFile) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(projectFiles).values(file);

  const inserted = await db
    .select()
    .from(projectFiles)
    .where(
      and(
        eq(projectFiles.ownerId, file.ownerId),
        eq(projectFiles.projectId, file.projectId),
        eq(projectFiles.fileKey, file.fileKey)
      )
    )
    .limit(1);

  if (!inserted[0]) {
    throw new Error("Datei-Metadaten konnten nicht gespeichert werden");
  }

  return inserted[0];
}
