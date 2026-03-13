import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './firestoreUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to profile changes
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            const pendingReferral = sessionStorage.getItem('pendingReferral');
            let referredBy: string | undefined;

            if (pendingReferral) {
              const q = query(collection(db, 'users'), where('referralCode', '==', pendingReferral.toUpperCase()));
              const referralSnap = await getDocs(q);
              if (!referralSnap.empty) {
                const referrerDoc = referralSnap.docs[0];
                referredBy = referrerDoc.id;
                // Give $1 bonus to referrer
                await updateDoc(doc(db, 'users', referredBy), {
                  balance: increment(1)
                });
              }
              sessionStorage.removeItem('pendingReferral');
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              balance: 0,
              role: firebaseUser.email === 'panashekunaka84@gmail.com' ? 'admin' : 'user',
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              referredBy,
              createdAt: new Date().toISOString(),
            };
            setDoc(userDocRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`));
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: profile?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
