import { Request, Response } from "express";
import * as evaluationService from "../services/evaluation.service";
import { ApiResponse } from "../interfaces/api-response.interface";
import { evaluationQueue } from "../queues/evaluation.queue";
import { EvaluationResponse, EvaluationRequest } from "../interfaces/evaluation.interface";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const createEvaluation = async (req: Request<{}, {}, EvaluationRequest>,res: Response<ApiResponse<EvaluationResponse>>) => {
  try {
    const evaluation = await evaluationService.createEvaluation(req.body);
    await evaluationQueue.add("evaluate", { evaluationId: evaluation.id });
    return successResponse(res, {id: evaluation.id, status: evaluation.status}, "Evaluation in progress", 200);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};

export const getEvaluation = async (req: Request<{ id: string }>, res: Response<ApiResponse<EvaluationResponse>>) => {
  try {
    const id = parseInt(req.params.id)
    const evaluation = await evaluationService.getEvaluation(id);
    if (!evaluation) return errorResponse(res, "Not found", 404);

    if (evaluation.status == "QUEUED" || evaluation.status == "PROCESSING") {
      const minimalResult = {
        id: evaluation.id,
        status: evaluation.status,
      };
      return successResponse(res, minimalResult, "Evaluation in progress", 200);
    }

    return successResponse(res, evaluation, "Evaluation retrieved", 200);
  } catch (err: any) {
    return errorResponse(res, err.message, 500);
  }
};
