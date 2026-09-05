export type UserRole = 'CITIZEN' | 'FIELD_OFFICER' | 'DEPT_ADMIN' | 'SYSTEM_ADMIN';

export type ComplaintStatus = 
  | 'Pending_Verification'
  | 'Linked_To_Master'
  | 'Assigned'
  | 'In_Progress'
  | 'Resolved'
  | 'Rejected';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

export interface GeolocationPoint {
  latitude: number;
  longitude: number;
  addressText: string;
}

export interface Grievance {
  id: string;
  ticketNumber: string; // e.g. '#C-1248'
  citizenId?: string;
  citizenName?: string;
  citizenPhone?: string;
  masterComplaintId?: string | null;
  issueTitle: string;
  description: string;
  imageUrl?: string;
  audioUrl?: string;
  rawTranscript?: string;
  detectedLanguage: string;
  latitude: number;
  longitude: number;
  addressText: string;
  priorityScore: number; // 1 - 10
  severityLevel: SeverityLevel;
  severityReasoning?: string;
  department: string;
  category: string;
  similarityScore?: number; // Match score percentage with Master
  status: ComplaintStatus;
  isValidGrievance: boolean;
  rejectionReason?: string;
  recommendedAction?: string;
  summary?: string;
  attachments?: string[];
  officerComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterComplaint {
  id: string;
  masterTicketNumber: string; // e.g. 'MST-2025-0841'
  department: string;
  category: string;
  priorityScore: number; // 1 - 10
  severityLevel: SeverityLevel;
  status: ComplaintStatus;
  primaryLocation: {
    latitude: number;
    longitude: number;
    addressText: string;
  };
  complaintCount: number;
  aiSummary: string;
  recommendedAction?: string;
  verifiedBy?: string;
  isAiSuggestedCluster?: boolean;
  linkedGrievanceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusLog {
  id: string;
  masterComplaintId?: string;
  grievanceId?: string;
  changedBy?: string;
  officerName: string;
  oldStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  comment?: string;
  proofImageUrl?: string;
  createdAt: string;
}

// Gemini Structured Output Schema Interface
export interface GeminiTriageOutput {
  is_valid_grievance: boolean;
  rejection_reason: string;
  detected_language: string;
  issue_title: string;
  department: string;
  category: string;
  severity_score: number; // 1-10
  severity_level: 'Low' | 'Medium' | 'High' | 'Critical';
  severity_reasoning: string;
  summary: string;
  recommended_action: string;
}

export interface GeminiSimilarityOutput {
  is_duplicate: boolean;
  confidence_score: number; // 0 - 100
  reasoning: string;
  shared_key_indicators: string[];
}

export interface GrievanceSubmissionPayload {
  title?: string;
  description?: string;
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  latitude: number;
  longitude: number;
  addressText?: string;
  citizenPhone?: string;
  citizenName?: string;
}
