import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });

const COLLECTION = process.env.QDRANT_COLLECTION || "cv_evaluate";

export async function ensureCollection(vectorSize: number) {
  try {
    const exists = await qdrant.getCollection(COLLECTION);
    if (exists.status) {
      console.log(`[Qdrant] Collection ${COLLECTION} sudah ada, skip.`);
      return exists;
    }
  } catch (err: any) {
    if (err.response?.status === 404 || err?.status === 404) {
      console.log(`[Qdrant] Collection ${COLLECTION} belum ada, membuat baru...`);
      return await qdrant.createCollection(COLLECTION, {
        vectors: { size: vectorSize, distance: "Cosine" },
      });
    }
    throw err;
  }
}

/**
 * Upsert multiple points: points = [{ id, vector, payload }]
 */
export async function upsertPoints(points: Array<{ id: string | number; vector: number[]; payload?: any }>) {
  try {
    const result = await qdrant.upsert(COLLECTION, {
      points,
    });
    console.log("Upsert result:", result);
    return result;
  } catch (err: any) {
    console.log("Error upserting points:", err);
    throw err;
  }
}

/**
 * store job doc to vector db: save job description & rubric as payload
 */
export async function upsertJobToVector(jobId: number, text: string, embedding: number[]) {
  await ensureCollection(embedding.length);

  await upsertPoints([
    { 
      id: jobId, 
      vector: embedding, 
      payload: { 
        jobId, 
        text, 
        type: "job",
        originalId: `job_${jobId}` // Keep original ID in payload for reference
      } 
    },
  ]); 
}
