export interface EvaluationRequest {
  candidateId: string;
  jobId: string;
}

export interface EvaluationResponse {
  id: string;
  candidateId: string;
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED";
  cvMatchRate: number | null;
  cvFeedback: string | null;
  projectScore: number | null;
  projectFeedback: string | null;
  overallSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}