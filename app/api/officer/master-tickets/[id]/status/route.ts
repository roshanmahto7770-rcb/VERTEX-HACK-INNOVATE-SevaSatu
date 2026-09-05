import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import { ComplaintStatus } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      officerComment,
      proofImageUrl,
      officerName = 'Rohit Sharma (PWD Officer)',
    } = body as {
      status: ComplaintStatus;
      officerComment?: string;
      proofImageUrl?: string;
      officerName?: string;
    };

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status field is required' },
        { status: 400 }
      );
    }

    // Check if target is a Master Complaint or an individual grievance
    const master = mockDb.getMasterComplaintById(id);

    if (master) {
      const result = mockDb.updateMasterStatus(
        master.id,
        status,
        officerComment,
        proofImageUrl,
        officerName
      );

      if (!result) {
        return NextResponse.json({ success: false, error: 'Failed to update Master ticket' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Master Ticket ${master.masterTicketNumber} updated to ${status}. Cascaded to ${result.updatedChildrenCount} linked complaints.`,
        master: result.master,
        updatedChildrenCount: result.updatedChildrenCount,
      });
    }

    // If target is an individual grievance
    const grievance = mockDb.getGrievanceById(id);
    if (grievance) {
      const updated = mockDb.updateGrievanceStatus(
        grievance.id,
        status,
        officerComment,
        officerName
      );
      return NextResponse.json({
        success: true,
        message: `Grievance ${grievance.ticketNumber} status updated to ${status}.`,
        grievance: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ticket not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
