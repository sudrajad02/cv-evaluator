import { PrismaClient } from "@prisma/client";
import { CandidateRequest } from "../interfaces/candidate.interface";

const prisma = new PrismaClient();

export const createCandidate = async (data: CandidateRequest) => {
  return prisma.candidate.create({ data });
};

export const listCandidates = async () => {
  return prisma.candidate.findMany();
};

export const getCandidate = async (id: number) => {
  return prisma.candidate.findFirst({ where: { id } });
};
