import { PrismaClient, EvaluationStatus } from "@prisma/client";
import { EvaluationRequest } from "../interfaces/evaluation.interface";

const prisma = new PrismaClient();

export const createEvaluation = async (data: EvaluationRequest) => {
  return prisma.evaluation.create({
    data: {
      candidateId: data.candidateId,
      jobId: data.jobId,
      status: EvaluationStatus.QUEUED,
    },
  });
};

export const getEvaluation = async (id: string) => {
  return prisma.evaluation.findUnique({ where: { id } });
};

// Dummy update evaluator: simulate async processing
export const completeEvaluation = async (id: string) => {
  return prisma.evaluation.update({
    where: { id },
    data: {
      status: EvaluationStatus.COMPLETED,
      cvMatchRate: Math.random().toFixed(2) as unknown as number,
      cvFeedback: "Strong backend experience, needs more AI exposure.",
      projectScore: 7.5,
      projectFeedback: "Meets chaining requirements, limited error handling.",
      overallSummary: "Good candidate fit, recommend for shortlist.",
    },
  });
};
