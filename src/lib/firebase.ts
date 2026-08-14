import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Sermon } from "./sermons";

// ─── Firebase App Singleton ─────────────────────────────────────────────────

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  if (!_app) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!apiKey || !projectId) {
      console.warn("Firebase env vars missing (VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID)");
      return null;
    }

    // Avoid re-initializing if already done
    if (getApps().length > 0) {
      _app = getApps()[0];
    } else {
      _app = initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      });
    }
  }

  return _app;
}

// ─── Firestore Instance ─────────────────────────────────────────────────────

let _db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (typeof window === "undefined") return null;

  if (!_db) {
    const app = getFirebaseApp();
    if (!app) return null;
    _db = getFirestore(app);
  }

  return _db;
}

// ─── Serializar Sermon → documento Firestore ────────────────────────────────

function sermonToDoc(s: Sermon) {
  return {
    id: s.id,
    title: s.title,
    baseVerse: s.baseVerse,
    theme: s.theme,
    introduction: s.introduction,
    conclusion: s.conclusion,
    appeal: s.appeal || "",
    tags: s.tags,
    topics: s.topics,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    deleted: s.deleted || false,
  };
}

function docToSermon(data: Record<string, unknown>): Sermon {
  return {
    id: data.id as string,
    title: (data.title as string) || "",
    baseVerse: (data.baseVerse as string) || "",
    theme: (data.theme as string) || "",
    introduction: (data.introduction as string) || "",
    conclusion: (data.conclusion as string) || "",
    appeal: (data.appeal as string) || "",
    tags: (data.tags as string[]) || [],
    topics:
      typeof data.topics === "string"
        ? JSON.parse(data.topics)
        : (data.topics as Sermon["topics"]) || [],
    createdAt: Number(data.createdAt),
    updatedAt: Number(data.updatedAt),
    deleted: (data.deleted as boolean) || false,
  };
}

// ─── Sincronização Bidirecional (Local-First) ──────────────────────────────

export async function syncSermonsWithCloud(
  localSermons: Sermon[],
  userId: string | null,
): Promise<{
  syncedSermons: Sermon[];
  changesApplied: boolean;
}> {
  const db = getDb();

  if (!db || !userId) {
    return { syncedSermons: localSermons, changesApplied: false };
  }

  // 1. Buscar esboços da nuvem
  const sermonsRef = collection(db, "users", userId, "sermons");
  const snapshot = await getDocs(sermonsRef);

  const cloudSermons: Sermon[] = snapshot.docs.map((d) =>
    docToSermon(d.data() as Record<string, unknown>),
  );

  const localMap = new Map<string, Sermon>();
  localSermons.forEach((s) => localMap.set(s.id, s));

  const cloudMap = new Map<string, Sermon>();
  cloudSermons.forEach((s) => cloudMap.set(s.id, s));

  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
  const mergedSermons: Sermon[] = [];
  const toUpload: Sermon[] = [];
  let changesApplied = false;

  for (const id of allIds) {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);

    if (local && !cloud) {
      // Existe apenas localmente: enviar para a nuvem
      mergedSermons.push(local);
      toUpload.push(local);
      changesApplied = true;
    } else if (!local && cloud) {
      // Existe apenas na nuvem: baixar
      mergedSermons.push(cloud);
      changesApplied = true;
    } else if (local && cloud) {
      // Existe em ambos: comparar timestamp de atualização
      if (local.updatedAt > cloud.updatedAt) {
        mergedSermons.push(local);
        toUpload.push(local);
        changesApplied = true;
      } else if (cloud.updatedAt > local.updatedAt) {
        mergedSermons.push(cloud);
        changesApplied = true;
      } else {
        mergedSermons.push(local);
      }
    }
  }

  // 2. Upload de novos/atualizados esboços para a nuvem (batched)
  if (toUpload.length > 0) {
    const batch = writeBatch(db);

    for (const s of toUpload) {
      const docRef = doc(db, "users", userId, "sermons", s.id);
      batch.set(docRef, sermonToDoc(s));
    }

    await batch.commit();
  }

  return {
    syncedSermons: mergedSermons,
    changesApplied,
  };
}
