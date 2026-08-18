import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "./firebase";
import { useCallback, useSyncExternalStore } from "react";

// Re-export User type for convenience
export type { User } from "firebase/auth";

// ─── Singleton Firebase Auth ────────────────────────────────────────────────
let _auth: Auth | null = null;

export function getAuthInstance(): Auth | null {
  if (typeof window === "undefined") return null;

  if (!_auth) {
    const app = getFirebaseApp();
    if (!app) return null;
    _auth = getAuth(app);
    // Força a persistência no localStorage (resolve problemas de reload e WebView)
    setPersistence(_auth, browserLocalPersistence).catch(console.error);
  }

  return _auth;
}

// ─── Auth actions (PIN Sync) ───────────────────────────────────────────────────────────

function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export async function generateSyncCode(): Promise<string> {
  const auth = getAuthInstance();
  if (!auth) throw new Error("Firebase não configurado.");

  const code = generateRandomCode();
  const email = `${code.replace("-", "").toLowerCase()}@sync.preacher-hub.app`;
  const password = code.replace("-", ""); // Password sem traço

  await createUserWithEmailAndPassword(auth, email, password);
  return code;
}

export async function connectSyncCode(code: string): Promise<void> {
  const auth = getAuthInstance();
  if (!auth) throw new Error("Firebase não configurado.");

  const cleanCode = code.replace(/[^A-Z0-9]/ig, "").toLowerCase();
  if (cleanCode.length !== 6) {
    throw new Error("O código deve ter 6 caracteres.");
  }

  const email = `${cleanCode}@sync.preacher-hub.app`;
  const password = cleanCode.toUpperCase();

  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  const auth = getAuthInstance();
  if (!auth) return;
  await firebaseSignOut(auth);
}

// ─── External store for auth state (React 18+ friendly) ────────────────────
// This avoids tearing and works correctly with concurrent mode.

type AuthSnapshot = {
  user: User | null;
  loading: boolean;
};

let _snapshot: AuthSnapshot = { user: null, loading: true };
const _listeners = new Set<() => void>();

function emitChange(next: AuthSnapshot) {
  _snapshot = next;
  _listeners.forEach((l) => l());
}

// Initialize listener once
let _subscriptionActive = false;

function ensureAuthListener() {
  if (_subscriptionActive) return;
  _subscriptionActive = true;

  const auth = getAuthInstance();
  if (!auth) {
    emitChange({ user: null, loading: false });
    return;
  }

  // onAuthStateChanged fires immediately with current state, then on every change
  onAuthStateChanged(auth, (user) => {
    emitChange({ user, loading: false });
  });
}

function subscribe(callback: () => void) {
  ensureAuthListener();
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

function getSnapshot(): AuthSnapshot {
  ensureAuthListener();
  return _snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return { user: null, loading: true };
}

// ─── useAuth hook ───────────────────────────────────────────────────────────

export function useAuth() {
  const { user, loading } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  return {
    user,
    loading,
    generateSyncCode,
    connectSyncCode,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };
}
