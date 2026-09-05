import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticket: string }> }
) {
  try {
    const { ticket } = await params;
    const cleanTicket = decodeURIComponent(ticket).trim();

    // Check individual grievance
    const grievance = mockDb.getGrievanceById(cleanTicket);
    if (grievance) {
      const logs = mockDb.getStatusLogs(grievance.id);
      let master = null;
      if (grievance.masterComplaintId) {
        master = mockDb.getMasterComplaintById(grievance.masterComplaintId);
      }

      return NextResponse.json({
        success: true,
        type: 'grievance',
        data: grievance,
        master,
        logs,
      });
    }

    // Check master ticket
    const master = mockDb.getMasterComplaintById(cleanTicket);
    if (master) {
      const logs = mockDb.getStatusLogs(master.id);
      const childGrievances = master.linkedGrievanceIds
        .map((id) => mockDb.getGrievanceById(id))
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        type: 'master',
        data: master,
        childGrievances,
        logs,
      });
    }

    return NextResponse.json(
      { success: false, error: `No grievance found matching ticket "${cleanTicket}"` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
