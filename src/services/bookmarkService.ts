import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Bookmark } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const bookmarkService = {
  getBookmarks: async (): Promise<Bookmark[]> => {
    if (!auth.currentUser) return [];
    const path = `users/${auth.currentUser.uid}/bookmarks`;
    try {
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bookmark[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  addBookmark: async (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/bookmarks`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...bookmark,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  removeBookmark: async (id: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/bookmarks/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
