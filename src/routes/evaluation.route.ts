import { Router } from "express";
import * as evaluationController from "../controllers/evaluation.controller";
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post("/", 
  authMiddleware.authenticate,
  evaluationController.createEvaluation
);

router.get("/result/:id", 
  authMiddleware.authenticate,
  evaluationController.getEvaluation
);

export default router;
