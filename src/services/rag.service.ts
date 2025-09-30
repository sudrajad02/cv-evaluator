import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from 'uuid';

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

// upsert point
export async function upsertPoints(points: Array<{ id: string; vector: number[]; payload?: any }>) {
  try {
    const result = await qdrant.upsert(COLLECTION, {
      points: points.map(point => ({
        ...point,
        id: point.id
      })),
    });
    console.log("Upsert result:", result);
    return result;
  } catch (err: any) {
    console.log("Error upserting points:", err);
    throw err;
  }
}

// upsert job to vector
export async function upsertJobToVector(
  identifier: string,
  content: string, 
  embedding: number[], 
  metadata?: any
) {
  await ensureCollection(embedding.length);

  // Generate UUID for Qdrant ID
  const vectorId = uuidv4();

  const payload = {
    identifier,
    content,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  await upsertPoints([
    { 
      id: vectorId,
      vector: embedding, 
      payload 
    },
  ]); 

  console.log(`[Qdrant] Stored ${identifier} with UUID: ${vectorId}, type: ${metadata?.type || 'unknown'}`);
  return { success: true, id: vectorId, identifier, type: metadata?.type };
}

// search with filter by identifier
export async function searchSimilarVectors(
  queryVector: number[],
  limit: number = 5,
  filter?: any
) {
  try {
    await ensureCollection(queryVector.length);

    const searchParams: any = {
      vector: queryVector,
      limit,
      with_payload: true,
      with_vector: false,
    };

    if (filter) {
      searchParams.filter = {
        must: Object.entries(filter).map(([key, value]) => ({
          key: `payload.${key}`,
          match: { value }
        }))
      };
    }

    const searchResult = await qdrant.search(COLLECTION, searchParams);

    return searchResult.map((result: any) => ({
      id: result.id,
      identifier: result.payload?.identifier,
      content: result.payload?.content || '',
      score: result.score,
      metadata: result.payload,
      type: result.payload?.type
    }));

  } catch (error) {
    console.log("[Qdrant Search Error]", error);
    throw error;
  }
}

// delete by identifier pattern
export async function deleteJobVectors(jobId: number) {
  try {
    const deleteResult = await qdrant.delete(COLLECTION, {
      filter: {
        must: [
          { key: "payload.jobId", match: { value: jobId } }
        ]
      }
    });

    console.log(`[Qdrant] Deleted vectors for job ${jobId}:`, deleteResult);
    return deleteResult;
  } catch (error) {
    console.log("[Delete Job Vectors Error]", error);
    throw error;
  }
}

// search by type
export async function searchByType(
  queryVector: number[],
  type: string,
  jobId?: number,
  limit: number = 3
) {
  const filter: any = { type };
  if (jobId) {
    filter.jobId = jobId;
  }

  return await searchSimilarVectors(queryVector, limit, filter);
}

// get job context
export async function getJobContext(jobId: number) {
  try {
    const jobDescResult = await qdrant.scroll(COLLECTION, {
      filter: {
        must: [
          { key: "payload.type", match: { value: "job_description" } },
          { key: "payload.jobId", match: { value: jobId } }
        ]
      },
      limit: 1,
      with_payload: true
    });

    const rubricResult = await qdrant.scroll(COLLECTION, {
      filter: {
        must: [
          { key: "payload.type", match: { value: "scoring_rubric" } },
          { key: "payload.jobId", match: { value: jobId } }
        ]
      },
      limit: 1,
      with_payload: true
    });

    return {
      jobDescription: jobDescResult.points[0]?.payload?.content || '',
      scoringRubric: rubricResult.points[0]?.payload?.content || '',
      found: {
        jobDesc: jobDescResult.points.length > 0,
        rubric: rubricResult.points.length > 0
      }
    };

  } catch (error) {
    console.log("[Get Job Context Error]", error);
    return {
      jobDescription: '',
      scoringRubric: '',
      found: { jobDesc: false, rubric: false }
    };
  }
}
