'use server';

import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DocumentMetadata {
  summary: string;
  keywords: string[];
  category: string;
}

export async function saveDocumentToKnowledgeBase(
  fileName: string,
  fileUrl: string,
  storagePath: string,
  metadata: DocumentMetadata
): Promise<string> {
  console.log(`🟢 [DB]: Saving metadata to Firestore path: knowledge_base`);
  const knowledgeBaseRef = collection(db, 'knowledge_base');
  const docRef = await addDoc(knowledgeBaseRef, {
    fileName,
    fileUrl,
    storagePath,
    metadata: {
      summary: metadata.summary,
      keywords: metadata.keywords,
      category: metadata.category,
    },
    createdAt: serverTimestamp(),
  });

  console.log(`Document saved to Firestore with ID: ${docRef.id}`);
  return docRef.id;
}

export async function getDocumentById(docId: string): Promise<{
  fileName: string;
  fileUrl: string;
  storagePath: string;
  metadata: DocumentMetadata;
} | null> {
  const docRef = doc(db, 'knowledge_base', docId);
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    return docSnapshot.data() as {
      fileName: string;
      fileUrl: string;
      storagePath: string;
      metadata: DocumentMetadata;
    };
  }

  return null;
}
