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

export const getEvaluation = async (id: number) => {
  return prisma.evaluation.findUnique({ where: { id } });
};