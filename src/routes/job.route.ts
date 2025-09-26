import { Router } from "express";
import * as jobController from "../controllers/job.controller";

const router = Router();

router.post("/", jobController.createJob);
router.get("/", jobController.listJobs);
router.get("/:id", jobController.getJob);

export default router;
