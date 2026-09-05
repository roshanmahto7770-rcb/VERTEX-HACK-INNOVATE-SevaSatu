import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masterComplaintId,
      verified,
      departmentOverride,
      officerName = 'Rohit Sharma (PWD Officer)',
      unlinkGrievanceId,
    } = body;

    const master = mockDb.getMasterComplaintById(masterComplaintId);
    if (!master) {
      return NextResponse.json(
        { success: false, error: 'Master Complaint not found' },
        { status: 404 }
      );
    }

    // Unlinking a false positive child grievance
    if (unlinkGrievanceId) {
      master.linkedGrievanceIds = master.linkedGrievanceIds.filter((id) => id !== unlinkGrievanceId);
      master.complaintCount = master.linkedGrievanceIds.length;
      
      const unlinkedGrievance = mockDb.getGrievanceById(unlinkGrievanceId);
      if (unlinkedGrievance) {
        unlinkedGrievance.masterComplaintId = null;
        unlinkedGrievance.status = 'Assigned';
        unlinkedGrievance.similarityScore = undefined;
      }

      return NextResponse.json({
        success: true,
        message: `Grievance ${unlinkGrievanceId} successfully unlinked from cluster ${master.masterTicketNumber}`,
        master,
      });
    }

    // Confirming and verifying the cluster
    if (verified) {
      master.verifiedBy = officerName;
      master.isAiSuggestedCluster = false;
      master.status = 'Assigned';

      if (departmentOverride) {
        master.department = departmentOverride;
      }

      // Sync all children to Assigned
      for (const childId of master.linkedGrievanceIds) {
        const child = mockDb.getGrievanceById(childId);
        if (child) {
          child.status = 'Assigned';
          if (departmentOverride) child.department = departmentOverride;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cluster ${master.masterTicketNumber} verified and assigned by ${officerName}. Batch dispatch initiated.`,
        master,
      });
    }

    return NextResponse.json({ success: true, master });
  } catch (error: any) {
    console.error('Error verifying cluster:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
