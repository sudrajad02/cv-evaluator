export interface EvaluationRequest {
  candidateId: number;
  jobId: number;
}

export interface EvaluationResponse {
  id: number;
  candidateId?: number;
  jobId?: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED";
  cvMatchRate?: number | null;
  cvFeedback?: string | null;
  projectScore?: number | null;
  projectFeedback?: string | null;
  overallSummary?: string | null;
}