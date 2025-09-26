export interface CandidateRequest {
  name: string;
  email?: string;
  phone?: string;
  cvFile: string;
  projectFile: string | null;
}

export interface CandidateResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cvFile: string;
  projectFile: string | null;
  createdAt: Date;
}
