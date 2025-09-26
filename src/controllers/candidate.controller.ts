import { Request, Response } from "express";
import * as candidateService from "../services/candidate.service";
import { CandidateResponse } from "../interfaces/candidate.interface";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const createCandidate = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const { name, email, phone } = req.body;

    const cvFile = files?.["cvFile"]?.[0]?.path || "";
    const projectFile = files?.["projectFile"]?.[0]?.path || null;

    const candidate = await candidateService.createCandidate({
      name,
      email: email ?? null,
      phone: phone ?? null,
      cvFile,
      projectFile,
    });

    return successResponse<CandidateResponse>(res, candidate, "Candidate created", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create candidate", 500, err);
  }
};

export const listCandidates = async (_: Request, res: Response) => {
  try {
    const candidates = await candidateService.listCandidates();
    return successResponse<CandidateResponse[]>(res, candidates, "Candidates retrieved");
  } catch (err) {
    return errorResponse(res, "Failed to fetch candidates", 500, err);
  }
};

export const getCandidate = async (req: Request<{ id: number }>, res: Response) => {
  try {
    const candidate = await candidateService.getCandidate(req.params.id);
    if (!candidate) return errorResponse(res, "Candidate not found", 404);
    return successResponse<CandidateResponse>(res, candidate, "Candidate retrieved");
  } catch (err) {
    return errorResponse(res, "Failed to fetch candidate", 500, err);
  }
};
