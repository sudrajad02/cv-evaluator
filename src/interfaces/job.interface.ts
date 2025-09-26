export interface JobRequest {
  title: string;
  description: string;
  studyCaseBrief: string;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  studyCaseBrief: string;
  createdAt: Date;
  updatedAt: Date;
}
