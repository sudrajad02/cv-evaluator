import { Router } from "express";
import * as candidateController from "../controllers/candidate.controller";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  upload.fields([{ name: "cvFile" }, { name: "projectFile" }]),
  candidateController.createCandidate
);

router.get("/", candidateController.listCandidates);
router.get("/:id", candidateController.getCandidate);

export default router;
