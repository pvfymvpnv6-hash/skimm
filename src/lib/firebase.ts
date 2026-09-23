import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(config) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      console.warn("Popup blocked/closed, falling back to redirect:", error);
      await signInWithRedirect(auth, googleProvider);
    } else {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Market favorites are 5 fixed, ordered ticker-symbol slots - stored as a
// single array field on the user's document, not a per-item collection
// like Aura's radio favorites (there's no add/remove semantics here, the
// whole list gets replaced together whenever a slot changes).
export const subscribeToMarketFavorites = (
  userId: string,
  onSuccess: (favorites: string[]) => void,
  onError?: (err: unknown) => void
) => {
  return onSnapshot(
    doc(db, "users", userId),
    (snap) => {
      const data = snap.data();
      if (data && Array.isArray(data.marketFavorites)) {
        onSuccess(data.marketFavorites as string[]);
      }
    },
    (err) => {
      console.error("Error listening to market favorites:", err);
      if (onError) onError(err);
    }
  );
};

export const syncMarketFavoritesToCloud = async (
  userId: string,
  favorites: string[],
  userEmail?: string | null,
  displayName?: string | null
) => {
  if (!userId) return;
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        email: userEmail || "",
        displayName: displayName || "",
        marketFavorites: favorites,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to sync market favorites to Cloud Firestore:", err);
  }
};

// One-time migration on first login: if the cloud doc has no
// marketFavorites yet, seed it with whatever is currently in localStorage.
// If the cloud already has a value, it wins - the live subscribe above
// takes over from there.
export const migrateLocalMarketFavoritesIfEmpty = async (
  userId: string,
  localFavorites: string[],
  userEmail?: string | null,
  displayName?: string | null
) => {
  if (!userId || localFavorites.length === 0) return;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    const data = snap.data();
    if (!data || !Array.isArray(data.marketFavorites)) {
      await syncMarketFavoritesToCloud(userId, localFavorites, userEmail, displayName);
    }
  } catch (err) {
    console.error("Failed to migrate local market favorites to cloud:", err);
  }
};

export default app;
