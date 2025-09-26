import { Request, Response } from "express";
import * as evaluationService from "../services/evaluation.service";
import { EvaluationResponse, EvaluationRequest } from "../interfaces/evaluation.interface";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const createEvaluation = async (
  req: Request<{}, {}, EvaluationRequest>,
  res: Response
) => {
  try {
    const evaluation = await evaluationService.createEvaluation(req.body);
    return successResponse<EvaluationResponse>(res, evaluation, "Evaluation queued", 201);
  } catch (err) {
    return errorResponse(res, "Failed to create evaluation", 500, err);
  }
};

export const getEvaluation = async (req: Request<{ id: number }>, res: Response) => {
  try {
    const evaluation = await evaluationService.getEvaluation(req.params.id);
    if (!evaluation) return errorResponse(res, "Evaluation not found", 404);
    return successResponse<EvaluationResponse>(res, evaluation, "Evaluation retrieved");
  } catch (err) {
    return errorResponse(res, "Failed to fetch evaluation", 500, err);
  }
};
