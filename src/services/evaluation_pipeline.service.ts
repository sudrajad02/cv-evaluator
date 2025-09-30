import { PrismaClient } from "@prisma/client";
import { callChat, createEmbedding } from "../utils/openRouter";
import { upsertJobToVector, searchSimilarVectors } from "./rag.service";
import { readFileContent } from "../utils/fileReader";

const prisma = new PrismaClient();

export class EvaluationPipeline {
  
  // save job description & rubric to vector DB
  static async storeJobAndRubric(jobId: number) {
    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId }
    });

    if (!job) throw new Error("Job not found");

    // scoring rubric template
    const scoringRubric = `
    SCORING RUBRIC FOR ${job.title}:
    
    CV EVALUATION CRITERIA:
    - Technical Skills Match (40%): Evaluate based on job requirements and description
    - Experience Level (25%): Assess relevant work experience and project history
    - Relevant Achievements (20%): Impact and measurable outcomes from past work
    - Cultural/Collaboration Fit (15%): Communication skills and teamwork indicators
    
    PROJECT EVALUATION CRITERIA:
    - Correctness (30%): LLM implementation, prompt design, RAG implementation
    - Code Quality (25%): Structure, modularity, testing, best practices
    - Resilience (20%): Error handling, edge cases, production readiness
    - Documentation (15%): README clarity, setup instructions, code comments
    - Creativity (10%): Extra features beyond basic requirements
    
    JOB POSITION: ${job.title}
    
    JOB REQUIREMENTS & DESCRIPTION:
    ${job.description}
    
    STUDY CASE BRIEF:
    ${job.studyCaseBrief}
    `;

    // create embeddings for job title, description, and study case brief
    const jobContent = `
    Job Title: ${job.title}
    
    Job Description: ${job.description}
    
    Study Case Brief: ${job.studyCaseBrief}
    `;

    const jobEmbedding = await createEmbedding(
      process.env.COHERE_MODEL_EMBED as string,
      `JOB_DESC: ${jobContent}`
    );

    // create embeddings untuk scoring rubric
    const rubricEmbedding = await createEmbedding(
      process.env.COHERE_MODEL_EMBED as string,
      `SCORING_RUBRIC: ${scoringRubric}`
    );

    await upsertJobToVector(
      `job_desc_${jobId}`,
      jobContent,
      jobEmbedding.embeddings.float[0],
      { 
        type: 'job_description', 
        jobId,
        title: job.title,
        createdAt: job.createdAt?.toISOString(),
        updatedAt: job.updatedAt?.toISOString()
      }
    );

    await upsertJobToVector(
      `rubric_${jobId}`,
      scoringRubric,
      rubricEmbedding.embeddings.float[0],
      { 
        type: 'scoring_rubric', 
        jobId,
        title: job.title,
        createdAt: job.createdAt?.toISOString(),
        updatedAt: job.updatedAt?.toISOString()
      }
    );

    console.log(`✅ Stored job description and rubric for: ${job.title} (ID: ${jobId})`);
  }


  // method for retrieve relevant context
  static async getRelevantContext(query: string, jobId: number) {
    const queryEmbedding = await createEmbedding(
      process.env.COHERE_MODEL_EMBED as string,
      query
    );

    // search for relevant job descriptions and rubrics
    const relevantContexts = await searchSimilarVectors(
      queryEmbedding.embeddings.float[0],
      5,
      { jobId }
    );

    return relevantContexts;
  }

  static async run(evaluationId: number) {
    // 1. Get evaluation data
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      candidate: true,
      job: true,
    },
  });

  if (!evaluation) throw new Error("Evaluation not found");
  const { candidate, job } = evaluation;

  // 2. Ensure job and rubric are stored in vector DB
  await this.storeJobAndRubric(job.id);

  // Read content from files
  const cvContent = candidate.cvFile 
    ? await readFileContent(candidate.cvFile)
    : '';
  
  const projectContent = candidate.projectFile 
    ? await readFileContent(candidate.projectFile)
    : '';

  // Validation
  const hasValidCV = cvContent && cvContent.trim().length > 50;
  const hasValidProject = projectContent && projectContent.trim().length > 50;
  const hasValidJob = job.description && job.description.trim().length > 50;
  const hasValidStudyCase = job.studyCaseBrief && job.studyCaseBrief.trim().length > 50;

  if (!hasValidCV || !hasValidProject || !hasValidJob) {
    console.warn(`Missing content - CV: ${hasValidCV}, Project: ${hasValidProject}, Job: ${hasValidJob}, StudyCase: ${hasValidStudyCase}`);
  }

  // 3. Retrieve relevant context for CV evaluation
  const cvContext = await this.getRelevantContext(
    `CV evaluation for ${job.title}: ${cvContent.substring(0, 500)}`,
    job.id
  );

  // 4. Retrieve relevant context for project evaluation  
  const projectContext = await this.getRelevantContext(
    `Project evaluation for ${job.title} study case: ${job.studyCaseBrief.substring(0, 300)} - Project: ${projectContent.substring(0, 500)}`,
    job.id
  );

  // 5. Create dynamic prompt with retrieved context
  const prompt = `
You are an expert technical evaluator for recruitment.

### RETRIEVED RELEVANT CONTEXT:
${cvContext.map(ctx => ctx.content).join('\n\n')}
${projectContext.map(ctx => ctx.content).join('\n\n')}

### JOB POSITION: ${job.title}

### STUDY CASE BRIEF:
${job.studyCaseBrief}

### EVALUATION CRITERIA (Scale 1-5 for each parameter)
[Use the scoring rubric from the retrieved context above]

#### CV Match Evaluation
- **Technical Skills Match (40%)**: Based on job requirements retrieved above
- **Experience Level (25%)**: Based on experience requirements in context
- **Relevant Achievements (20%)**: Impact of past work
- **Cultural/Collaboration Fit (15%)**: Communication, learning mindset

#### Project Deliverable Evaluation  
- **Correctness (30%)**: LLM implementation, prompt design, RAG
- **Code Quality (25%)**: Clean, modular, tested code
- **Resilience (20%)**: Error handling, production readiness
- **Documentation (15%)**: README clarity, setup instructions
- **Creativity (10%)**: Extra features beyond requirements

### INPUTS TO EVALUATE:

**Candidate CV Content:**
${cvContent || 'No CV content provided'}

**Project Report Content:**
${projectContent || 'No project report provided'}

### OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact schema:
{
  "cv": {
    "technicalSkills": { "score": number (1-5), "reason": "explanation" },
    "experienceLevel": { "score": number (1-5), "reason": "explanation" },
    "achievements": { "score": number (1-5), "reason": "explanation" },
    "collaborationFit": { "score": number (1-5), "reason": "explanation" },
    "weightedScore": number,
    "matchRate": number,
    "feedback": "3-5 sentences"
  },
  "project": {
    "correctness": { "score": number (1-5), "reason": "explanation" },
    "codeQuality": { "score": number (1-5), "reason": "explanation" },
    "resilience": { "score": number (1-5), "reason": "explanation" },
    "documentation": { "score": number (1-5), "reason": "explanation" },
    "creativity": { "score": number (1-5), "reason": "explanation" },
    "weightedScore": number,
    "feedback": "3-5 sentences"
  },
  "summary": "3-5 sentences overall assessment"
}
`;

    // 5. Call LLM with enhanced context
    let result;
    try {
      const response = await callChat(
        process.env.OPENROUTER_MODEL as string,
        [{ role: "user", content: prompt }]
      );
      result = JSON.parse(response);
    } catch (error) {
      console.log("[LLM Generate Error]", error);
      return;
    }

    // 6. Save evaluation results to DB
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
      return;
    }

    // 🆕 7. Store evaluation result with enhanced metadata
    try {
      const resultEmbedding = await createEmbedding(
        process.env.COHERE_MODEL_EMBED as string,
        `EVALUATION_RESULT: ${JSON.stringify(result)}`
      );

      await upsertJobToVector(
        `eval_${evaluationId}`,
        `Evaluation Result: ${job.title} - ${candidate.name}`,
        resultEmbedding.embeddings.float[0],
        { 
          type: 'evaluation_result', 
          jobId: job.id, 
          candidateId: candidate.id,
          evaluationId,
          cvMatchRate: result.cv?.matchRate,
          projectScore: result.project?.weightedScore
        }
      );

      console.log("Evaluation result stored in vector DB");
    } catch (error) {
      console.log("[Qdrant Save Error]", error);
      return;
    }
  }
}
