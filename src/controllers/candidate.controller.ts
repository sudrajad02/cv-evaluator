import { Request, Response } from "express";
import * as candidateService from "../services/candidate.service";
import { ApiResponse } from "../interfaces/api-response.interface";
import { CandidateResponse } from "../interfaces/candidate.interface";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const createCandidate = async (req: Request, res: Response<ApiResponse<CandidateResponse>>) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const { name, email, phone } = req.body;

    const cvFile = files?.["cv_file"]?.[0]?.path || "";
    const projectFile = files?.["project_file"]?.[0]?.path || null;

    const candidate = await candidateService.createCandidate({
      name,
      email: email ?? null,
      phone: phone ?? null,
      cvFile,
      projectFile,
    });

    return successResponse(res, candidate, "Candidate created", 201);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const listCandidates = async (_: Request, res: Response<ApiResponse<CandidateResponse>>) => {
  try {
    const candidates = await candidateService.listCandidates();
    if (candidates.length == 0) {
      return errorResponse(res, "Not found", 404);
    }

    return successResponse(res, candidates, "Candidates retrieved");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getCandidate = async (req: Request<{id: string}>, res: Response<ApiResponse<CandidateResponse>>) => {
  try {
    const id = parseInt(req.params.id)
    const candidate = await candidateService.getCandidate(id);
    
    if (!candidate) return errorResponse(res, "Not found", 404)
    
    return successResponse(res, candidate, "Candidates retrieved");
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
