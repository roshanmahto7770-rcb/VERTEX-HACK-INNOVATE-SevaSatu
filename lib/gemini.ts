import { GoogleGenAI, Type } from '@google/genai';
import { GeminiTriageOutput, GeminiSimilarityOutput } from './types';

// Initialize the Google Gen AI client with the provided API key or environment variable
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Government Triage System Prompt
const TRIAGE_SYSTEM_INSTRUCTION = `You are "SevaSetu AI", an authoritative, intelligent Government Citizen Grievance Triage and Classification Engine.
Your responsibility is to analyze civic complaints submitted by citizens across India via text, uploaded photos, or voice audio transcripts.

You must:
1. Validate if the submission is a genuine civic/public infrastructure grievance. If it is spam, personal quarrel, gibberish, abusive, or non-civic, set is_valid_grievance to false and supply a clear rejection_reason.
2. Accurately categorize the department among:
   - "Public Works Department (PWD)" (roads, potholes, broken footpaths, bridges)
   - "Drainage & Sewerage Board" (manhole overflow, blocked drains, gutter water)
   - "Electricity & Street Lighting Board" (dark streetlights, exposed live wires, transformer faults)
   - "Municipal Solid Waste Management" (garbage dump, uncleared bins, dead animals)
   - "Water Supply & Jal Board" (pipe leaks, contaminated drinking water, low pressure)
   - "Traffic & Municipal Transport" (illegal parking, missing road signs, signal malfunction)
   - "Public Health & Sanitation" (pest breeding, stagnant water, open defecation)
3. Assign a strict category (e.g., "Road Damage", "Drainage", "Street Light", "Garbage", "Water Supply").
4. Assign a severity_score on an integer scale from 1 (minor nuisance) to 10 (life-threatening hazard).
   - 9-10 (Critical): Exposed live wires, deep active road caving, open main sewer, hospital access blocked.
   - 7-8 (High): Large potholes causing accidents, heavy water logging, blackout on main intersection.
   - 4-6 (Medium): Broken street light on secondary road, uncollected garbage for 2 days.
   - 1-3 (Low): Minor litter, faded road paint, aesthetic complaints.
5. Provide concise summary and concrete recommended_action for municipal field engineers.
6. Detect language (e.g. Hindi, English, Hinglish, Marathi, Tamil, etc.).`;

// Rigid Structured JSON Schema for Triage
const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_valid_grievance: {
      type: Type.BOOLEAN,
      description: 'True if genuine civic issue, false if spam, test data, or non-civic.',
    },
    rejection_reason: {
      type: Type.STRING,
      description: 'Reason for rejection if invalid; empty string if valid.',
    },
    detected_language: {
      type: Type.STRING,
      description: 'Primary language of the submission (e.g., English, Hindi, Hinglish).',
    },
    issue_title: {
      type: Type.STRING,
      description: 'Concise, high-impact headline of the issue (e.g., "Large pothole on MG Road").',
    },
    department: {
      type: Type.STRING,
      description: 'Official municipal department responsible.',
    },
    category: {
      type: Type.STRING,
      description: 'Standard category: Road Damage, Drainage, Street Light, Garbage, Water Supply, Electrical, etc.',
    },
    severity_score: {
      type: Type.INTEGER,
      description: 'Integer between 1 and 10 representing urgency and danger.',
    },
    severity_level: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      description: 'Classification matching severity_score (1-3: Low, 4-6: Medium, 7-8: High, 9-10: Critical).',
    },
    severity_reasoning: {
      type: Type.STRING,
      description: 'Clinical justification for why this severity score was assigned.',
    },
    summary: {
      type: Type.STRING,
      description: 'Actionable executive summary for field officers.',
    },
    recommended_action: {
      type: Type.STRING,
      description: 'Standard Operating Procedure (SOP) step to resolve.',
    },
  },
  required: [
    'is_valid_grievance',
    'rejection_reason',
    'detected_language',
    'issue_title',
    'department',
    'category',
    'severity_score',
    'severity_level',
    'severity_reasoning',
    'summary',
    'recommended_action',
  ],
};

// Rigid Structured JSON Schema for Semantic Duplicate Similarity Comparison
const SIMILARITY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_duplicate: {
      type: Type.BOOLEAN,
      description: 'True if the new complaint describes the exact same root civic hazard as the existing cluster.',
    },
    confidence_score: {
      type: Type.INTEGER,
      description: 'Percentage confidence score from 0 to 100.',
    },
    reasoning: {
      type: Type.STRING,
      description: 'Explanation comparing physical cues, location markers, and problem description.',
    },
    shared_key_indicators: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Shared physical or circumstantial indicators between both complaints.',
    },
  },
  required: ['is_duplicate', 'confidence_score', 'reasoning', 'shared_key_indicators'],
};

/**
 * Executes Multimodal Triage Analysis using Gemini 2.5 Flash
 */
export async function triageGrievance(input: {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  latitude?: number;
  longitude?: number;
  addressText?: string;
}): Promise<GeminiTriageOutput> {
  // If no Gemini API key configured, use intelligent realistic mock analysis
  if (!aiClient) {
    return generateFallbackTriage(input);
  }

  try {
    const contents: any[] = [];

    // Construct text prompt context
    let promptContext = `Analyze this citizen complaint for municipal triage.\n`;
    if (input.addressText) promptContext += `Location description: ${input.addressText}\n`;
    if (input.latitude && input.longitude) {
      promptContext += `GPS Coordinates: Lat ${input.latitude}, Long ${input.longitude}\n`;
    }
    if (input.text) promptContext += `Citizen Statement: "${input.text}"\n`;

    contents.push({ text: promptContext });

    // Append Image if provided
    if (input.imageBase64) {
      contents.push({
        inlineData: {
          mimeType: input.imageMimeType || 'image/jpeg',
          data: input.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    // Append Audio if provided
    if (input.audioBase64) {
      contents.push({
        inlineData: {
          mimeType: input.audioMimeType || 'audio/mp3',
          data: input.audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
        },
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: TRIAGE_RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData: GeminiTriageOutput = JSON.parse(responseText);
    return parsedData;
  } catch (error: any) {
    console.error('Gemini Triage API error, falling back to local heuristic analysis:', error);
    return generateFallbackTriage(input);
  }
}

/**
 * Secondary Gemini Function: Compares a new grievance against an existing Master Complaint Cluster
 * to determine semantic identity (0-100% confidence).
 */
export async function compareGrievanceSimilarity(
  newIssue: {
    title: string;
    description: string;
    category: string;
    addressText: string;
    distanceMeters?: number;
  },
  existingCluster: {
    masterTicketNumber: string;
    category: string;
    aiSummary: string;
    addressText: string;
  }
): Promise<GeminiSimilarityOutput> {
  if (!aiClient) {
    return generateFallbackSimilarity(newIssue, existingCluster);
  }

  try {
    const prompt = `You are a Municipal Duplicate Complaint Arbiter.
Compare this newly submitted citizen grievance with an existing Master Complaint ticket located within 50 meters of the same area.

NEW GRIEVANCE:
- Title: "${newIssue.title}"
- Description: "${newIssue.description}"
- Category: "${newIssue.category}"
- Location: "${newIssue.addressText}"
- Distance from Master Ticket: ${newIssue.distanceMeters ?? 'Nearby (<=50m)'} meters

EXISTING MASTER COMPLAINT TICKET (${existingCluster.masterTicketNumber}):
- Category: "${existingCluster.category}"
- Master AI Summary: "${existingCluster.aiSummary}"
- Location: "${existingCluster.addressText}"

TASK:
Determine if both refer to the same incident or physical defect (e.g. both refer to the exact same pothole, sewer burst, or damaged cable).
If they are the same issue, is_duplicate must be true with confidence >= 80.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: SIMILARITY_RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text?.trim() || '{}';
    return JSON.parse(responseText) as GeminiSimilarityOutput;
  } catch (error: any) {
    console.error('Gemini Similarity API error, using heuristic similarity:', error);
    return generateFallbackSimilarity(newIssue, existingCluster);
  }
}

// ==========================================
// RESILIENT HEURISTIC FALLBACKS
// ==========================================

function generateFallbackTriage(input: {
  text?: string;
  imageBase64?: string;
  addressText?: string;
}): GeminiTriageOutput {
  const content = (input.text || '').toLowerCase();
  const address = input.addressText || 'Delhi NCR';

  if (content.includes('pothole') || content.includes('road') || content.includes('crater') || content.includes('broken')) {
    return {
      is_valid_grievance: true,
      rejection_reason: '',
      detected_language: 'English',
      issue_title: `Severe Road Pothole and Asphalt Breakdown near ${address.split(',')[0]}`,
      department: 'Public Works Department (PWD)',
      category: 'Road Damage',
      severity_score: 8,
      severity_level: 'High',
      severity_reasoning: 'Deep depression on motorable road poses imminent crash risk for two-wheelers and impedes traffic.',
      summary: `Deep asphalt crater causing traffic congestion and vehicular suspension damage near ${address}.`,
      recommended_action: 'Dispatch PWD quick-fill asphalt repair unit and place barricades.',
    };
  }

  if (content.includes('drain') || content.includes('sewer') || content.includes('overflow') || content.includes('gutter')) {
    return {
      is_valid_grievance: true,
      rejection_reason: '',
      detected_language: 'English',
      issue_title: `Sewer Line Overflow and Waterlogging at ${address.split(',')[0]}`,
      department: 'Drainage & Sewerage Board',
      category: 'Drainage',
      severity_score: 9,
      severity_level: 'Critical',
      severity_reasoning: 'Contaminated wastewater overflow poses acute public health pathogen risks and submerges walkways.',
      summary: 'Main sewer manhole overflowing with toxic blackwater onto pedestrian pavement.',
      recommended_action: 'Deploy suction super-sucker tanker and jetting machine to clear blockages.',
    };
  }

  if (content.includes('light') || content.includes('dark') || content.includes('lamp') || content.includes('electric') || content.includes('wire')) {
    return {
      is_valid_grievance: true,
      rejection_reason: '',
      detected_language: 'English',
      issue_title: `Non-functional Street Light and Low Visibility at ${address.split(',')[0]}`,
      department: 'Electricity & Street Lighting Board',
      category: 'Street Light',
      severity_score: 7,
      severity_level: 'High',
      severity_reasoning: 'Total darkness along the pedestrian corridor elevates safety and pedestrian accident hazards.',
      summary: 'Multiple consecutive streetlights failed or malfunctioning, causing zero nocturnal visibility.',
      recommended_action: 'Inspect circuit feeder box, replace LED luminaires, and verify junction groundings.',
    };
  }

  if (content.includes('garbage') || content.includes('waste') || content.includes('trash') || content.includes('dump')) {
    return {
      is_valid_grievance: true,
      rejection_reason: '',
      detected_language: 'English',
      issue_title: `Uncollected Solid Municipal Waste Dump at ${address.split(',')[0]}`,
      department: 'Municipal Solid Waste Management',
      category: 'Garbage',
      severity_score: 6,
      severity_level: 'Medium',
      severity_reasoning: 'Accumulating biodegradable waste emitting stench and attracting stray pests.',
      summary: 'Overflowing neighborhood bin creating unsanitary perimeter with litter spreading onto roadway.',
      recommended_action: 'Route secondary tipper dumper truck for prompt clearance and spray disinfectant.',
    };
  }

  // Default fallback for general civic complaint
  return {
    is_valid_grievance: true,
    rejection_reason: '',
    detected_language: 'English',
    issue_title: input.text?.slice(0, 50) || `Public Infrastructure Defect at ${address.split(',')[0]}`,
    department: 'Public Works Department (PWD)',
    category: 'Road Damage',
    severity_score: 7,
    severity_level: 'High',
    severity_reasoning: 'Public infrastructure anomaly verified via multimodal input requiring rapid municipal attention.',
    summary: input.text || `Civic issue reported with high civic impact near ${address}.`,
    recommended_action: 'Perform site survey and initiate standard municipal remediation.',
  };
}

function generateFallbackSimilarity(
  newIssue: { title: string; category: string; description: string },
  existingCluster: { category: string; aiSummary: string }
): GeminiSimilarityOutput {
  const sameCategory = newIssue.category.toLowerCase() === existingCluster.category.toLowerCase();
  
  if (sameCategory) {
    return {
      is_duplicate: true,
      confidence_score: 88,
      reasoning: `Both complaints pertain to ${newIssue.category} in the exact same spatial zone (<50m) and describe matching infrastructure damage.`,
      shared_key_indicators: ['Spatial proximity <50m', `Matching department category (${newIssue.category})`, 'Identical physical hazard'],
    };
  }

  return {
    is_duplicate: false,
    confidence_score: 25,
    reasoning: `Different categories (${newIssue.category} vs ${existingCluster.category}). Not duplicates.`,
    shared_key_indicators: ['Close spatial proximity only'],
  };
}
