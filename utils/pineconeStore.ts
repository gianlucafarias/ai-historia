import * as dotenv from "dotenv";
import { PineconeStore } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { Document } from "langchain/document";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { join } from 'path';

dotenv.config();

import { PineconeClient } from "@pinecone-database/pinecone";

const VECTOR_STORE_PATH = join(process.cwd(), 'vectorstore')

const pineconeStore = async () => {
  const pinecone = new PineconeClient();
  const embedder = new OpenAIEmbeddings();

  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT as string,
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX as string);

  const pineconeStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex,
  });

  return pineconeStore;
};

export default pineconeStore;
