import { Router } from "express";
import * as evaluationController from "../controllers/evaluation.controller";

const router = Router();

router.post("/", evaluationController.createEvaluation);
router.get("/:id", evaluationController.getEvaluation);

export default router;
