import { Request, Response } from "express";
import * as jobService from "../services/job.service";
import { ApiResponse } from "../interfaces/api-response.interface";
import { JobResponse, JobRequest } from "../interfaces/job.interface";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const createJob = async (
  req: Request<{}, {}, JobRequest>,
  res: Response<ApiResponse<JobResponse>>
) => {
  try {
    const job = await jobService.createJob(req.body);
    return successResponse(res, job, "Job created", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create job", 500, err);
  }
};

export const listJobs = async (_: Request, res: Response<ApiResponse<JobResponse[]>>) => {
  try {
    const jobs = await jobService.listJobs();
    return successResponse(res, jobs, "Jobs retrieved");
  } catch (err) {
    return errorResponse(res, "Failed to fetch jobs", 500, err);
  }
};

export const getJob = async (req: Request<{ id: number }>, res: Response<ApiResponse<JobResponse>>) => {
  try {
    const job = await jobService.getJob(req.params.id);
    if (!job) return errorResponse(res, "Job not found", 404);
    return successResponse(res, job, "Job retrieved");
  } catch (err) {
    return errorResponse(res, "Failed to fetch job", 500, err);
  }
};
