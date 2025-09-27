// src/services/evaluation_pipeline.service.ts
import { PrismaClient } from "@prisma/client";
import { QdrantClient } from "@qdrant/js-client-rest";
import { callChat, createEmbedding } from "../utils/openRouter";
import { upsertJobToVector } from "./rag.service";

const prisma = new PrismaClient();

// Qdrant vector DB
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});

export class EvaluationPipeline {
  static async run(evaluationId: number) {
    // 1. Ambil data evaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        candidate: true,
        job: true,
      },
    });

    if (!evaluation) throw new Error("Evaluation not found");

    const { candidate, job } = evaluation;

    // validation
    const hasValidCV = candidate.cvFile && candidate.cvFile.trim().length > 50;
    const hasValidProject = candidate.projectFile && candidate.projectFile.trim().length > 50;
    const hasValidJob = job.description && job.description.trim().length > 50;

    if (!hasValidCV || !hasValidProject || !hasValidJob) {
    console.warn(`Missing content - CV: ${hasValidCV}, Project: ${hasValidProject}, Job: ${hasValidJob}`);
    }

    // 2. Buat prompt untuk LLM
    const prompt = `
You are an expert technical evaluator. You must STRICTLY evaluate based ONLY on the actual content provided.

CRITICAL INSTRUCTIONS:
1. If any input (CV or Project Report) is empty, null, or contains no meaningful content, you MUST set all related scores to 1 and clearly state "No content provided" in the reason.
2. Base your evaluation ONLY on what is explicitly written in the provided content.
3. Do NOT make assumptions or fill gaps with generic positive statements.
4. If content is insufficient for proper evaluation, reflect this in low scores and clear reasoning.

### EVALUATION CRITERIA

#### CV Match Evaluation (Weight: 100%)
- **Technical Skills Match (40%)**: Direct match between candidate's listed technical skills and job requirements
- **Experience Level (25%)**: Years of experience and seniority level alignment with job requirements  
- **Relevant Achievements (20%)**: Specific accomplishments that demonstrate job-relevant capabilities
- **Cultural/Collaboration Fit (15%)**: Evidence of teamwork, communication, and cultural alignment

#### Project Deliverable Evaluation (Weight: 100%)
- **Correctness (30%)**: Solution correctly addresses the given prompt and requirements
- **Code Quality & Structure (25%)**: Clean, maintainable, well-organized code following best practices
- **Resilience & Error Handling (20%)**: Proper error handling, input validation, edge case management
- **Documentation & Explanation (15%)**: Clear documentation, comments, and explanation of approach
- **Creativity/Bonus (10%)**: Innovative solutions, additional features, or exceptional implementation

### SCORING GUIDELINES:
- **Score 5**: Exceptional - Exceeds expectations significantly
- **Score 4**: Strong - Meets expectations with some excellence
- **Score 3**: Adequate - Meets basic expectations
- **Score 2**: Below Average - Partially meets expectations with notable gaps
- **Score 1**: Poor - Does not meet expectations or no content provided

### INPUTS TO EVALUATE:

**Job Description:**
${job.description || 'No job description provided'}

**Candidate CV Content:**
${candidate.cvFile || 'No CV content provided'}

**Project Report Content:**
${candidate.projectFile || 'No project report provided'}

### VALIDATION CHECKS:
Before proceeding with evaluation, check:
1. Is the job description meaningful and detailed? 
2. Does the CV contain actual resume content (skills, experience, education)?
3. Does the project report contain actual project work (code, documentation, explanation)?

If any of these are missing or insufficient, reflect this accurately in your scoring and reasoning.

### OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact schema. Do not include any text before or after the JSON:

{
  "cv": {
    "technicalSkills": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual CV content vs job requirements" 
    },
    "experienceLevel": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual experience vs job requirements" 
    },
    "achievements": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual achievements mentioned" 
    },
    "collaborationFit": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual collaboration evidence" 
    },
    "weightedScore": number (calculated: technicalSkills*0.4 + experienceLevel*0.25 + achievements*0.2 + collaborationFit*0.15),
    "matchRate": number (percentage: weightedScore/5 * 100),
    "feedback": "3-5 sentences summarizing CV evaluation, highlighting key strengths and areas for improvement based on actual content provided. If no content available, clearly state this limitation."
  },
  "project": {
    "correctness": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual project solution" 
    },
    "codeQuality": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual code structure and practices" 
    },
    "resilience": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual error handling implementation" 
    },
    "documentation": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual documentation quality" 
    },
    "creativity": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on actual innovative elements" 
    },
    "weightedScore": number (calculated: correctness*0.3 + codeQuality*0.25 + resilience*0.2 + documentation*0.15 + creativity*0.1),
    "feedback": "3-5 sentences summarizing project evaluation, highlighting technical strengths and areas needing improvement based on actual implementation provided. If no content available, clearly state this limitation."
  },
  "summary": "3-5 sentences providing honest assessment based on actual content provided. If content is missing or insufficient, clearly state this limitation."
}
`;

    // 3. Panggil OpenRouter (LLM)
    let result
    try {
        const response = await callChat(
            process.env.OPENROUTER_MODEL as string,
            [{ role: "user", content: prompt }]
        );
        result = JSON.parse(response);
    } catch (error) {
        console.log("[LLM Generate Error]")
        return
    }

    console.log(111, result);
    

    // 4. Simpan hasil scoring ke DB
    try {
        const update_eval = await prisma.evaluation.update({
            where: { id: evaluationId },
            data: {
                status: "COMPLETED",
                cvMatchRate: result.cv?.matchRate || 0,
                cvFeedback: result.cv?.feedback || "",
                projectScore: result.project?.weightedScore || 0,
                projectFeedback: result.project?.feedback || "",
                overallSummary: result.summary || "",
            },
        });
        console.log(update_eval);
    } catch (error) {
        console.log("[Prisma Update Error]", error);
        return
    }

    // 5. Opsional: simpan ke Qdrant untuk RAG future retrieval
    try {
        const embedding = await createEmbedding(
            process.env.COHERE_MODEL_EMBED as string,
            JSON.stringify(result)
        )

        const save_qdrant = await upsertJobToVector(
            embedding.id,
            `Embedding For Job ${job.title} and For Candidate ${candidate.name}`,
            embedding.embeddings.float[0]
        );

        console.log(save_qdrant);
    } catch (error) {
        console.log("[Qdrant Save Error]", error);
        return
    }
  }
}
