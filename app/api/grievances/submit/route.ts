import { NextRequest, NextResponse } from 'next/server';
import { triageGrievance, compareGrievanceSimilarity } from '@/lib/gemini';
import { mockDb } from '@/lib/mock-db';
import { Grievance, MasterComplaint, GrievanceSubmissionPayload } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const payload: GrievanceSubmissionPayload = await req.json();

    const {
      title,
      description = '',
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
      latitude = 28.6304,
      longitude = 77.2177,
      addressText = 'MG Road, Delhi',
      citizenPhone = '+91 98765 43210',
      citizenName = 'Citizen Reporter',
      citizenAddress,
      complaintLocation,
    } = payload;

    // Combine text inputs
    const combinedText = [title, description].filter(Boolean).join('. ');

    // Auto-save citizen profile if address provided
    if (citizenAddress && citizenName && citizenPhone) {
      mockDb.saveCitizenProfile({
        name: citizenName,
        phone: citizenPhone,
        address: citizenAddress,
        savedLat: latitude,
        savedLng: longitude,
      });
    }

    // 1. Multimodal Gemini Triage Pipeline
    const triageResult = await triageGrievance({
      text: combinedText,
      imageBase64,
      imageMimeType,
      audioBase64,
      audioMimeType,
      latitude,
      longitude,
      addressText,
    });

    // If AI detects invalid/non-civic grievance (spam/personal), reject early
    if (!triageResult.is_valid_grievance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complaint rejected by AI Triage Engine',
          rejectionReason: triageResult.rejection_reason || 'Does not qualify as a valid public infrastructure issue.',
          triage: triageResult,
        },
        { status: 422 }
      );
    }

    const ticketNumber = `#C-${Math.floor(1000 + Math.random() * 9000)}`;
    const grievanceId = `g-${Date.now()}`;

    // 2. Spatial & Temporal Clustering Engine (<= 50m, <= 48h)
    const nearbyMatches = mockDb.findNearbyMasterComplaints(
      latitude,
      longitude,
      triageResult.category,
      50, // 50 meters
      48  // 48 hours
    );

    let masterTicket: MasterComplaint | null = null;
    let isClustered = false;
    let similarityScore = 0;
    let clusterReasoning = '';

    if (nearbyMatches.length > 0) {
      // Pick closest open master ticket
      const closest = nearbyMatches[0];
      
      // 3. Gemini Semantic Deep Similarity Comparison
      const similarityCheck = await compareGrievanceSimilarity(
        {
          title: triageResult.issue_title,
          description: triageResult.summary,
          category: triageResult.category,
          addressText,
          distanceMeters: closest.distanceMeters,
        },
        {
          masterTicketNumber: closest.master.masterTicketNumber,
          category: closest.master.category,
          aiSummary: closest.master.aiSummary,
          addressText: closest.master.primaryLocation.addressText,
        }
      );

      similarityScore = similarityCheck.confidence_score;
      clusterReasoning = similarityCheck.reasoning;

      // Match threshold: >= 80% confidence
      if (similarityCheck.is_duplicate || similarityCheck.confidence_score >= 80) {
        masterTicket = closest.master;
        isClustered = true;
      }
    }

    // 4. Construct Grievance Record
    const newGrievance: Grievance = {
      id: grievanceId,
      ticketNumber,
      citizenId: `user-${Date.now()}`,
      citizenName,
      citizenPhone,
      citizenAddress,
      masterComplaintId: masterTicket ? masterTicket.id : null,
      issueTitle: triageResult.issue_title,
      description: triageResult.summary || description,
      imageUrl: imageBase64 ? imageBase64 : undefined,
      attachments: imageBase64 ? [imageBase64] : [],
      detectedLanguage: triageResult.detected_language || 'en',
      latitude,
      longitude,
      addressText,
      locationDetails: complaintLocation,
      priorityScore: triageResult.severity_score,
      severityLevel: triageResult.severity_level,
      severityReasoning: triageResult.severity_reasoning,
      department: triageResult.department,
      category: triageResult.category,
      similarityScore: isClustered ? similarityScore : undefined,
      status: isClustered ? 'Linked_To_Master' : 'Pending_Verification',
      isValidGrievance: true,
      summary: triageResult.summary,
      recommendedAction: triageResult.recommended_action,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Store Grievance and update or create Master Ticket
    if (isClustered && masterTicket) {
      mockDb.addGrievance(newGrievance);
      mockDb.linkGrievanceToMaster(newGrievance.id, masterTicket.id, similarityScore);
    } else {
      // Create new Master Complaint
      const newMasterId = `mst-${Date.now()}`;
      const newMasterTicket: MasterComplaint = {
        id: newMasterId,
        masterTicketNumber: `MST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        department: triageResult.department,
        category: triageResult.category,
        priorityScore: triageResult.severity_score,
        severityLevel: triageResult.severity_level,
        status: 'Pending_Verification',
        primaryLocation: {
          latitude,
          longitude,
          addressText,
          locationDetails: complaintLocation,
        },
        complaintCount: 1,
        aiSummary: triageResult.summary,
        recommendedAction: triageResult.recommended_action,
        isAiSuggestedCluster: false,
        linkedGrievanceIds: [newGrievance.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newGrievance.masterComplaintId = newMasterId;
      mockDb.createMasterComplaint(newMasterTicket);
      mockDb.addGrievance(newGrievance);
      masterTicket = newMasterTicket;
    }

    return NextResponse.json({
      success: true,
      grievance: newGrievance,
      masterTicket,
      isClustered,
      clusterMatchScore: similarityScore,
      clusterReasoning,
      triage: triageResult,
    });
  } catch (error: any) {
    console.error('Error submitting grievance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
