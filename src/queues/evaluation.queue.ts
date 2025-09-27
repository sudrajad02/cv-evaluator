import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { EvaluationPipeline } from "../services/evaluation_pipeline.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

export const evaluationQueue = new Queue("evaluation", { connection });

new Worker(
  "evaluation",
  async job => {
    const { evaluationId } = job.data;

    // set processing state
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { status: "PROCESSING" },
    });

    try {
      await EvaluationPipeline.run(evaluationId);
    } catch (err) {
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: "FAILED" },
      });
      throw err;
    }
  },
  { connection }
);
