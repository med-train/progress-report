export enum Status {
  Completed = "Completed",
  InProgress = "In Progress",
  NoProgress = "No Progress",
}

// Represents a raw row from the uploaded Excel sheet.
export interface RawCandidateData {
  [key: string]: any;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  completedChapters: number;
  totalChapters: number;
  marks: number;
  maxMarks: number;
  skipped: number;
  ocs1: string;
  ocs2: string;
  ocs3?: string;
  status: Status;
}
