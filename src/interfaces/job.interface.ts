export interface JobRequest {
  title: string;
  description: string;
  studyCaseBrief: string;
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  studyCaseBrief: string;
  createdAt: Date;
  updatedAt: Date;
}
