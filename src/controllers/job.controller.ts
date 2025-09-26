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
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const listJobs = async (_: Request, res: Response<ApiResponse<JobResponse[]>>) => {
  try {
    const jobs = await jobService.listJobs();
    return successResponse(res, jobs, "Jobs retrieved");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getJob = async (req: Request<{ id: string }>, res: Response<ApiResponse<JobResponse>>) => {
  try {
    const id = parseInt(req.params.id);
    const job = await jobService.getJob(id);
    if (!job) return errorResponse(res, "Not found", 404)

    return successResponse(res, job, "Job retrieved");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
