import { PrismaClient } from "@prisma/client";
import { JobRequest } from "../interfaces/job.interface";

const prisma = new PrismaClient();

export const createJob = async (data: JobRequest) => {
  return prisma.jobVacancy.create({ data });
};

export const listJobs = async () => {
  return prisma.jobVacancy.findMany();
};

export const getJob = async (id: number) => {
  return prisma.jobVacancy.findUnique({ where: { id } });
};
