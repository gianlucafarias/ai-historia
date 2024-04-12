import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { join } from 'path';
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

const VECTOR_STORE_PATH = join(process.cwd(), 'vectorstore');
let vectorStore: HNSWLib | null = null;

export async function getLocalVectorStore(): Promise<HNSWLib > {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings();
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
  }
  return vectorStore;
}

export async function addDocumentsToVectorStore(documents: Document[]) {
  const store = await getLocalVectorStore();
  await store.addDocuments(documents);
}