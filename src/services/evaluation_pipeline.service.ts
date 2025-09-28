// src/services/evaluation_pipeline.service.ts
import { PrismaClient } from "@prisma/client";
import { QdrantClient } from "@qdrant/js-client-rest";
import { callChat, createEmbedding } from "../utils/openRouter";
import { upsertJobToVector } from "./rag.service";
import { readFileContent } from "../utils/fileReader";

const prisma = new PrismaClient();

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

    // read content from path
    const cvContent = candidate.cvFile 
      ? await readFileContent(candidate.cvFile)
      : '';
    
    const projectContent = candidate.projectFile 
      ? await readFileContent(candidate.projectFile)
      : '';

    // validation
    const hasValidCV = cvContent && cvContent.trim().length > 50;
    const hasValidProject = projectContent && projectContent.trim().length > 50;
    const hasValidJob = job.description && job.description.trim().length > 50;

    if (!hasValidCV || !hasValidProject || !hasValidJob) {
    console.warn(`Missing content - CV: ${hasValidCV}, Project: ${hasValidProject}, Job: ${hasValidJob}`);
    }

    // 2. Buat prompt untuk LLM
    const prompt = `
You are an expert technical evaluator for recruitment following the official scoring rubric.

### EVALUATION CRITERIA (Scale 1-5 for each parameter)

#### CV Match Evaluation
- **Technical Skills Match (40%)**: Alignment with job requirements (backend, databases, APIs, cloud, AI/LLM)
  - 1 = Irrelevant skills, 2 = Few overlaps, 3 = Partial match, 4 = Strong match, 5 = Excellent match + AI/LLM exposure
- **Experience Level (25%)**: Years of experience and project complexity
  - 1 = <1 yr/trivial projects, 2 = 1-2 yrs, 3 = 2-3 yrs with mid-scale projects, 4 = 3-4 yrs solid track record, 5 = 5+ yrs/high-impact projects
- **Relevant Achievements (20%)**: Impact of past work (scaling, performance, adoption)
  - 1 = No clear achievements, 2 = Minimal improvements, 3 = Some measurable outcomes, 4 = Significant contributions, 5 = Major measurable impact
- **Cultural/Collaboration Fit (15%)**: Communication, learning mindset, teamwork/leadership
  - 1 = Not demonstrated, 2 = Minimal, 3 = Average, 4 = Good, 5 = Excellent and well-demonstrated

#### Project Deliverable Evaluation
- **Correctness (Prompt & Chaining) (30%)**: Implements prompt design, LLM chaining, RAG context injection
  - 1 = Not implemented, 2 = Minimal attempt, 3 = Works partially, 4 = Works correctly, 5 = Fully correct + thoughtful
- **Code Quality & Structure (25%)**: Clean, modular, reusable, tested
  - 1 = Poor, 2 = Some structure, 3 = Decent modularity, 4 = Good structure + some tests, 5 = Excellent quality + strong tests
- **Resilience & Error Handling (20%)**: Handles long jobs, retries, randomness, API failures
  - 1 = Missing, 2 = Minimal, 3 = Partial handling, 4 = Solid handling, 5 = Robust, production-ready
- **Documentation & Explanation (15%)**: README clarity, setup instructions, trade-off explanations
  - 1 = Missing, 2 = Minimal, 3 = Adequate, 4 = Clear, 5 = Excellent + insightful
- **Creativity/Bonus (10%)**: Extra features beyond requirements
  - 1 = None, 2 = Very basic, 3 = Useful extras, 4 = Strong enhancements, 5 = Outstanding creativity

### INPUTS TO EVALUATE:

**Job Description:**
${job.description || 'No job description provided'}

**Candidate CV Content:**
${cvContent || 'No CV content provided'}

**Project Report Content:**
${projectContent || 'No project report provided'}

### OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact schema:

{
  "cv": {
    "technicalSkills": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on CV content vs job requirements" 
    },
    "experienceLevel": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on experience level" 
    },
    "achievements": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on achievements mentioned" 
    },
    "collaborationFit": { 
      "score": number (1-5), 
      "reason": "Specific explanation based on collaboration evidence" 
    },
    "weightedScore": number (calculated: technicalSkills*0.4 + experienceLevel*0.25 + achievements*0.2 + collaborationFit*0.15),
    "matchRate": number (percentage: weightedScore * 20),
    "feedback": "3-5 sentences highlighting strengths and improvement areas"
  },
  "project": {
    "correctness": { 
      "score": number (1-5), 
      "reason": "Specific explanation of prompt design and LLM implementation" 
    },
    "codeQuality": { 
      "score": number (1-5), 
      "reason": "Specific explanation of code structure and practices" 
    },
    "resilience": { 
      "score": number (1-5), 
      "reason": "Specific explanation of error handling and robustness" 
    },
    "documentation": { 
      "score": number (1-5), 
      "reason": "Specific explanation of documentation quality" 
    },
    "creativity": { 
      "score": number (1-5), 
      "reason": "Specific explanation of extra features and creativity" 
    },
    "weightedScore": number (calculated: correctness*0.3 + codeQuality*0.25 + resilience*0.2 + documentation*0.15 + creativity*0.1),
    "feedback": "3-5 sentences on technical implementation and areas for improvement"
  },
  "summary": "3-5 sentences providing overall assessment with strengths, gaps, and recommendations"
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
