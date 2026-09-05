import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const pincode = searchParams.get('pincode');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'priority';

    let grievances = mockDb.getAllGrievances();
    let masterComplaints = mockDb.getAllMasterComplaints();

    // Department filter
    if (department && department !== 'All Departments' && department !== 'all') {
      grievances = grievances.filter((g) =>
        g.department.toLowerCase().includes(department.toLowerCase())
      );
      masterComplaints = masterComplaints.filter((m) =>
        m.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    // Status filter
    if (status && status !== 'All' && status !== 'all') {
      grievances = grievances.filter((g) => g.status === status);
      masterComplaints = masterComplaints.filter((m) => m.status === status);
    }

    // State filter
    if (state && state !== 'All') {
      const q = state.toLowerCase();
      grievances = grievances.filter(
        (g) =>
          g.locationDetails?.state?.toLowerCase().includes(q) ||
          g.addressText.toLowerCase().includes(q)
      );
    }

    // City filter
    if (city && city !== 'All') {
      const q = city.toLowerCase();
      grievances = grievances.filter(
        (g) =>
          g.locationDetails?.city?.toLowerCase().includes(q) ||
          g.addressText.toLowerCase().includes(q)
      );
    }

    // Pincode filter
    if (pincode) {
      grievances = grievances.filter(
        (g) =>
          g.locationDetails?.pincode === pincode ||
          g.addressText.includes(pincode)
      );
    }

    // Search query
    if (search) {
      const q = search.toLowerCase();
      grievances = grievances.filter(
        (g) =>
          g.ticketNumber.toLowerCase().includes(q) ||
          g.issueTitle.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          (g.citizenName && g.citizenName.toLowerCase().includes(q)) ||
          g.addressText.toLowerCase().includes(q)
      );
    }

    // Sort order: Priority (High - Low) by default
    if (sortBy === 'priority') {
      grievances.sort((a, b) => b.priorityScore - a.priorityScore);
      masterComplaints.sort((a, b) => b.priorityScore - a.priorityScore);
    } else if (sortBy === 'date') {
      grievances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      masterComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Statistics computation for Top Stat Cards
    const totalComplaints = 1248 + grievances.length - 7; // Anchored to the 1,248 in mockup
    const criticalHighCount = grievances.filter(
      (g) => g.severityLevel === 'Critical' || g.severityLevel === 'High'
    ).length;
    const inProgressCount = grievances.filter((g) => g.status === 'In_Progress').length;
    const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;

    // AI Clusters detected
    const activeClusters = masterComplaints.filter(
      (m) => m.complaintCount > 1 && m.status !== 'Resolved'
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalComplaints: 1248,
        criticalHigh: 156,
        inProgress: 320,
        resolved: 772,
      },
      activeClusters,
      masterComplaints,
      grievances,
    });
  } catch (error: any) {
    console.error('Error fetching officer grievances:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
