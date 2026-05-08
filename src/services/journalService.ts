import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { JournalEntry } from '../types';

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

export const journalService = {
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    if (!auth.currentUser) return [];
    const path = `users/${auth.currentUser.uid}/journal`;
    try {
      const q = query(
        collection(db, path),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JournalEntry[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  createEntry: async (entry: Partial<JournalEntry>): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/journal`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...entry,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  updateEntry: async (id: string, entry: Partial<JournalEntry>): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/journal/${id}`;
    try {
      const docRef = doc(db, path);
      await updateDoc(docRef, {
        ...entry,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteEntry: async (id: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/journal/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  pinVerse: async (entryId: string, reference: string, text: string): Promise<void> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const path = `users/${auth.currentUser.uid}/journal/${entryId}`;
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error('Entry not found');
      
      const currentPinned = docSnap.data().pinnedVerses || [];
      const alreadyPinned = currentPinned.some((v: any) => v.reference === reference);
      
      if (!alreadyPinned) {
        await updateDoc(docRef, {
          pinnedVerses: [...currentPinned, { reference, text }]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
