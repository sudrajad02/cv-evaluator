import { Router } from "express";
import * as candidateController from "../controllers/candidate.controller";
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from "multer";

const router = Router();
const upload = multer({ dest: "src/uploads/" });

router.post(
  "/",
  authMiddleware.authenticate,
  upload.fields([{ name: "cv_file" }, { name: "project_file" }]),
  candidateController.createCandidate
);

router.post(
  "/upload",
  authMiddleware.authenticate,
  upload.fields([{ name: "cv_file" }, { name: "project_file" }]),
  candidateController.createCandidate
);

router.get("/", 
  authMiddleware.authenticate,
  candidateController.listCandidates
);

router.get("/:id", 
  authMiddleware.authenticate,
  candidateController.getCandidate
);

export default router;
