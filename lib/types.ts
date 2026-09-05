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

export interface StructuredAddress {
  houseNo?: string;     // House / Flat / Building No. (Optional)
  building?: string;    // Building / Society / Colony (Optional)
  street: string;       // Street / Road / Area / Landmark
  city: string;         // City / District
  state: string;        // State
  pincode: string;      // 6-digit PIN code
}

export interface CitizenProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: StructuredAddress;
  savedLat?: number;
  savedLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeolocationPoint {
  latitude: number;
  longitude: number;
  addressText: string;
  structuredAddress?: StructuredAddress;
}

export interface Grievance {
  id: string;
  ticketNumber: string; // e.g. '#C-1248'
  citizenId?: string;
  citizenName?: string;
  citizenPhone?: string;
  citizenAddress?: StructuredAddress;
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
  locationDetails?: StructuredAddress;
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
  assignedOfficer?: string;
  assignedOfficerContact?: string;
  assignedDepartment?: string;
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
    locationDetails?: StructuredAddress;
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
  citizenAddress?: StructuredAddress;
  complaintLocation?: StructuredAddress;
}

export interface OfficerStats {
  totalGrievances: number;
  resolvedGrievances: number;
  pendingGrievances: number;
  inProgressGrievances: number;
  activeMasterClusters: number;
  criticalCases: number;
  avgResolutionHours: number;
  cityBreakdown: Record<string, number>;
  stateBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
}
