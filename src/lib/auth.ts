import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
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
  }

  return _auth;
}

// ─── Auth actions ───────────────────────────────────────────────────────────

const _googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const auth = getAuthInstance();
  if (!auth) throw new Error("Firebase não configurado.");

  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Usamos Redirect no mobile pois Popup falha dentro do WebView e UserAgent foi modificado
    await signInWithRedirect(auth, _googleProvider);
  } else {
    // Usamos Popup no PC para melhor experiência
    await signInWithPopup(auth, _googleProvider);
  }
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

  // Captura o retorno do redirecionamento do Google (mobile)
  getRedirectResult(auth).catch((error) => {
    console.error("Erro no redirecionamento do Google Auth:", error);
  });

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

  const handleSignIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  return {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!user,
  };
}
