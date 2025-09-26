import { Router } from "express";
import * as jobController from "../controllers/job.controller";
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post("/", 
  authMiddleware.authenticate,
  jobController.createJob
);

router.get("/", 
  authMiddleware.authenticate,
  jobController.listJobs
);

router.get("/:id", 
  authMiddleware.authenticate,
  jobController.getJob
);

export default router;
