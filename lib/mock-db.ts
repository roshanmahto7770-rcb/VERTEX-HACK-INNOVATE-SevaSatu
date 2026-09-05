import { Grievance, MasterComplaint, StatusLog, ComplaintStatus } from './types';

// Haversine formula to compute great-circle distance between two GPS coordinates in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Initial sample images for realistic inspection
const SAMPLE_POTHOLE_IMAGES = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584463699039-448a60ff960a?w=600&auto=format&fit=crop&q=80',
];

const SAMPLE_DRAINAGE_IMAGE = 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=600&auto=format&fit=crop&q=80';
const SAMPLE_STREETLIGHT_IMAGE = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80';
const SAMPLE_GARBAGE_IMAGE = 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80';

// In-Memory Database Singleton to support demo and seamless local mutations
class MockDatabase {
  private grievances: Grievance[] = [];
  private masterComplaints: MasterComplaint[] = [];
  private statusLogs: StatusLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Master Complaint for MG Road pothole cluster
    const masterTicketId = 'mst-uuid-001';
    const master1: MasterComplaint = {
      id: masterTicketId,
      masterTicketNumber: 'MST-2025-0841',
      department: 'Public Works Department (PWD)',
      category: 'Road Damage',
      priorityScore: 10,
      severityLevel: 'Critical',
      status: 'Assigned',
      primaryLocation: {
        latitude: 28.6304,
        longitude: 77.2177,
        addressText: 'MG Road, Delhi (Lat: 28.6304, Long: 77.2177)',
      },
      complaintCount: 3,
      aiSummary: 'There is a huge pothole causing severe traffic jam, vehicle breakdown, and imminent two-wheeler crash hazard on MG Road near Metro Pillar 142.',
      recommendedAction: 'Deploy urgent asphalt cold-mix repair team and cordon off lane.',
      verifiedBy: 'Rohit Sharma (PWD Officer)',
      isAiSuggestedCluster: true,
      linkedGrievanceIds: ['c-1248', 'c-1248-b', 'c-1248-c'],
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };

    // 2. The Primary Grievance from the screenshot (#C-1248)
    const g1: Grievance = {
      id: 'c-1248',
      ticketNumber: '#C-1248',
      citizenId: 'user-001',
      citizenName: 'Amit Verma',
      citizenPhone: '+91 98765 43210',
      masterComplaintId: masterTicketId,
      issueTitle: 'Large pothole on MG Road',
      description: 'There is a huge pothole causing traffic jam and vehicle damage. Vehicles are suddenly swerving to avoid it.',
      imageUrl: SAMPLE_POTHOLE_IMAGES[0],
      attachments: SAMPLE_POTHOLE_IMAGES,
      detectedLanguage: 'English',
      latitude: 28.6304,
      longitude: 77.2177,
      addressText: 'MG Road, Delhi',
      priorityScore: 10,
      severityLevel: 'Critical',
      severityReasoning: 'Critical depth crater on high-speed lane causing severe traffic bottleneck and extreme hazard to motorbikes.',
      department: 'Public Works Department (PWD)',
      category: 'Road Damage',
      similarityScore: 100,
      status: 'Assigned',
      isValidGrievance: true,
      summary: 'Huge pothole causing traffic jam and vehicle damage.',
      recommendedAction: 'Immediate asphalt patching and safety cones.',
      officerComment: 'Team is on the way for inspection.',
      createdAt: '2025-05-16T10:30:00.000Z',
      updatedAt: '2025-05-16T10:35:00.000Z',
    };

    // 3. Child Grievance 2 in the same cluster (nearby on MG Road, 18 meters away)
    const g1b: Grievance = {
      id: 'c-1248-b',
      ticketNumber: '#C-1248-B',
      citizenId: 'user-002',
      citizenName: 'Pooja Sundaram',
      citizenPhone: '+91 98112 34567',
      masterComplaintId: masterTicketId,
      issueTitle: 'Deep road crater near Metro Pillar 142',
      description: 'Dangerous crater on road right in front of metro pillar 142. Car tire got punctured this morning.',
      imageUrl: SAMPLE_POTHOLE_IMAGES[1],
      attachments: [SAMPLE_POTHOLE_IMAGES[1]],
      detectedLanguage: 'English',
      latitude: 28.6305,
      longitude: 77.2178,
      addressText: 'MG Road Metro Pillar 142, Delhi',
      priorityScore: 9,
      severityLevel: 'Critical',
      severityReasoning: 'Same spatial crater verified within 18 meters.',
      department: 'Public Works Department (PWD)',
      category: 'Road Damage',
      similarityScore: 94,
      status: 'Linked_To_Master',
      isValidGrievance: true,
      summary: 'Dangerous road crater punctured car tire.',
      recommendedAction: 'Covered under Master Ticket MST-2025-0841.',
      createdAt: '2025-05-16T10:45:00.000Z',
      updatedAt: '2025-05-16T10:45:00.000Z',
    };

    // 4. Child Grievance 3 in the same cluster (submitted via Hindi voice note)
    const g1c: Grievance = {
      id: 'c-1248-c',
      ticketNumber: '#C-1248-C',
      citizenId: 'user-003',
      citizenName: 'Rajesh Kumar',
      citizenPhone: '+91 99554 11223',
      masterComplaintId: masterTicketId,
      issueTitle: 'MG Road par bahut bada gaddha hai',
      description: 'यहाँ एमजी रोड पर मेट्रो पिलर के सामने सड़क धंस गई है, कभी भी बड़ा हादसा हो सकता है।',
      rawTranscript: 'यहाँ एमजी रोड पर मेट्रो पिलर के सामने सड़क धंस गई है, कभी भी बड़ा हादसा हो सकता है।',
      imageUrl: SAMPLE_POTHOLE_IMAGES[2],
      attachments: [SAMPLE_POTHOLE_IMAGES[2]],
      detectedLanguage: 'Hindi',
      latitude: 28.6303,
      longitude: 77.2176,
      addressText: 'MG Road, Delhi',
      priorityScore: 9,
      severityLevel: 'Critical',
      severityReasoning: 'Audio transcript translated and mapped to MG road cave-in.',
      department: 'Public Works Department (PWD)',
      category: 'Road Damage',
      similarityScore: 91,
      status: 'Linked_To_Master',
      isValidGrievance: true,
      summary: 'Road cave-in reported in Hindi via voice note.',
      recommendedAction: 'Linked to Master Ticket MST-2025-0841.',
      createdAt: '2025-05-16T11:05:00.000Z',
      updatedAt: '2025-05-16T11:05:00.000Z',
    };

    // 5. #C-1247: Sewer overflow near Park
    const g2: Grievance = {
      id: 'c-1247',
      ticketNumber: '#C-1247',
      citizenId: 'user-004',
      citizenName: 'Sunita Sharma',
      citizenPhone: '+91 97123 98765',
      masterComplaintId: null,
      issueTitle: 'Sewer overflow near Park',
      description: 'Black sewer water overflowing from open manhole into park walking track. Stench is unbearable.',
      imageUrl: SAMPLE_DRAINAGE_IMAGE,
      attachments: [SAMPLE_DRAINAGE_IMAGE],
      detectedLanguage: 'English',
      latitude: 28.5678,
      longitude: 77.2433,
      addressText: 'Lajpat Nagar, Delhi',
      priorityScore: 8,
      severityLevel: 'High',
      severityReasoning: 'Pathogenic wastewater running into public recreational park.',
      department: 'Drainage & Sewerage Board',
      category: 'Drainage',
      status: 'In_Progress',
      isValidGrievance: true,
      summary: 'Sewer overflow near Park creating health risk and stench.',
      recommendedAction: 'Deploy suction tanker to clear manhole blockage.',
      officerComment: 'Sanitation tanker team deployed to Lajpat Nagar block B.',
      createdAt: '2025-05-16T09:15:00.000Z',
      updatedAt: '2025-05-16T09:30:00.000Z',
    };

    // 6. #C-1246: Street light not working
    const g3: Grievance = {
      id: 'c-1246',
      ticketNumber: '#C-1246',
      citizenId: 'user-005',
      citizenName: 'Vikram Mehta',
      citizenPhone: '+91 98101 22334',
      masterComplaintId: null,
      issueTitle: 'Street light not working',
      description: 'Three consecutive street lights are pitch dark for the past 4 nights. Dark stretch near main road.',
      imageUrl: SAMPLE_STREETLIGHT_IMAGE,
      attachments: [SAMPLE_STREETLIGHT_IMAGE],
      detectedLanguage: 'English',
      latitude: 28.6415,
      longitude: 77.1211,
      addressText: 'Rajouri Garden, Delhi',
      priorityScore: 7,
      severityLevel: 'High',
      severityReasoning: 'Zero nocturnal illumination on busy neighborhood intersection.',
      department: 'Electricity & Street Lighting Board',
      category: 'Street Light',
      status: 'Assigned',
      isValidGrievance: true,
      summary: 'Street light not working for 4 nights causing darkness.',
      recommendedAction: 'Replace blown 120W LED fixtures and inspect switchbox.',
      officerComment: 'Line engineer assigned for evening inspection.',
      createdAt: '2025-05-16T08:40:00.000Z',
      updatedAt: '2025-05-16T08:45:00.000Z',
    };

    // 7. #C-1245: Garbage not collected
    const g4: Grievance = {
      id: 'c-1245',
      ticketNumber: '#C-1245',
      citizenId: 'user-006',
      citizenName: 'Gurpreet Singh',
      citizenPhone: '+91 98711 55667',
      masterComplaintId: null,
      issueTitle: 'Garbage not collected',
      description: 'Community garbage dumpster has not been cleared for 3 days. Trash spilled all over sidewalk.',
      imageUrl: SAMPLE_GARBAGE_IMAGE,
      attachments: [SAMPLE_GARBAGE_IMAGE],
      detectedLanguage: 'English',
      latitude: 28.6366,
      longitude: 77.0963,
      addressText: 'Tilak Nagar, Delhi',
      priorityScore: 6,
      severityLevel: 'Medium',
      severityReasoning: 'Uncollected municipal solid waste causing pedestrian blockage and foul smell.',
      department: 'Municipal Solid Waste Management',
      category: 'Garbage',
      status: 'Assigned',
      isValidGrievance: true,
      summary: 'Garbage not collected for 3 days spilling on road.',
      recommendedAction: 'Dispatch hydraulic waste compactor truck.',
      officerComment: 'Assigned to Ward 14 sanitation supervisor.',
      createdAt: '2025-05-16T07:50:00.000Z',
      updatedAt: '2025-05-16T08:00:00.000Z',
    };

    // 8. #C-1244: Water leakage on road
    const g5: Grievance = {
      id: 'c-1244',
      ticketNumber: '#C-1244',
      citizenId: 'user-007',
      citizenName: 'Ananya Roy',
      citizenPhone: '+91 98200 44556',
      masterComplaintId: null,
      issueTitle: 'Water leakage on road',
      description: 'Underground potable water supply line cracked. Fresh water gushing across the road and getting wasted.',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=600&auto=format&fit=crop&q=80',
      attachments: ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=600&auto=format&fit=crop&q=80'],
      detectedLanguage: 'English',
      latitude: 28.6219,
      longitude: 77.0878,
      addressText: 'Janakpuri, Delhi',
      priorityScore: 5,
      severityLevel: 'Medium',
      severityReasoning: 'Water wastage and surface erosion caused by municipal main pipe rupture.',
      department: 'Water Supply & Jal Board',
      category: 'Water Supply',
      status: 'In_Progress',
      isValidGrievance: true,
      summary: 'Water leakage on road from cracked supply line.',
      recommendedAction: 'Shut isolation valve and clamp broken segment.',
      officerComment: 'Valve team deployed to stem pressure.',
      createdAt: '2025-05-16T07:20:00.000Z',
      updatedAt: '2025-05-16T07:35:00.000Z',
    };

    this.masterComplaints = [master1];
    this.grievances = [g1, g2, g3, g4, g5, g1b, g1c];

    this.statusLogs = [
      {
        id: 'log-001',
        masterComplaintId: masterTicketId,
        grievanceId: 'c-1248',
        officerName: 'Rohit Sharma (PWD)',
        oldStatus: 'Pending_Verification',
        newStatus: 'Assigned',
        comment: 'Assigned to Ward 12 Road Maintenance Quick-Response Unit.',
        createdAt: '2025-05-16T10:35:00.000Z',
      },
    ];
  }

  // Find existing open Master Complaints within radius (default 50m) and temporal window (48h)
  public findNearbyMasterComplaints(
    lat: number,
    lng: number,
    category: string,
    radiusMeters: number = 50,
    windowHours: number = 48
  ): Array<{ master: MasterComplaint; distanceMeters: number }> {
    const now = new Date().getTime();
    const windowMs = windowHours * 60 * 60 * 1000;

    const results: Array<{ master: MasterComplaint; distanceMeters: number }> = [];

    for (const master of this.masterComplaints) {
      if (master.status === 'Resolved' || master.status === 'Rejected') continue;

      const createdTime = new Date(master.createdAt).getTime();
      if (now - createdTime > windowMs) continue;

      const dist = calculateDistanceMeters(
        lat,
        lng,
        master.primaryLocation.latitude,
        master.primaryLocation.longitude
      );

      if (dist <= radiusMeters) {
        results.push({ master, distanceMeters: Math.round(dist) });
      }
    }

    return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  public getAllGrievances(): Grievance[] {
    return [...this.grievances];
  }

  public getGrievanceById(id: string): Grievance | undefined {
    return this.grievances.find(
      (g) => g.id.toLowerCase() === id.toLowerCase() || g.ticketNumber.toLowerCase() === id.toLowerCase()
    );
  }

  public getAllMasterComplaints(): MasterComplaint[] {
    return [...this.masterComplaints];
  }

  public getMasterComplaintById(id: string): MasterComplaint | undefined {
    return this.masterComplaints.find(
      (m) => m.id === id || m.masterTicketNumber.toLowerCase() === id.toLowerCase()
    );
  }

  public addGrievance(grievance: Grievance): void {
    this.grievances.unshift(grievance);
  }

  public createMasterComplaint(master: MasterComplaint): void {
    this.masterComplaints.unshift(master);
  }

  public linkGrievanceToMaster(
    grievanceId: string,
    masterId: string,
    similarityScore: number
  ): boolean {
    const grievance = this.grievances.find((g) => g.id === grievanceId);
    const master = this.masterComplaints.find((m) => m.id === masterId);

    if (!grievance || !master) return false;

    grievance.masterComplaintId = masterId;
    grievance.similarityScore = similarityScore;
    grievance.status = 'Linked_To_Master';

    if (!master.linkedGrievanceIds.includes(grievanceId)) {
      master.linkedGrievanceIds.push(grievanceId);
      master.complaintCount = master.linkedGrievanceIds.length;
      master.isAiSuggestedCluster = true;
    }

    this.statusLogs.push({
      id: `log-${Date.now()}`,
      masterComplaintId: masterId,
      grievanceId: grievanceId,
      officerName: 'AI Clustering Engine',
      oldStatus: 'Pending_Verification',
      newStatus: 'Linked_To_Master',
      comment: `Linked to Master Ticket ${master.masterTicketNumber} with ${similarityScore}% AI confidence match.`,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  // Cascading status sync: When Master status changes, all child complaints sync automatically
  public updateMasterStatus(
    masterId: string,
    newStatus: ComplaintStatus,
    officerComment?: string,
    proofImageUrl?: string,
    officerName: string = 'Rohit Sharma (PWD)'
  ): { master: MasterComplaint; updatedChildrenCount: number } | null {
    const master = this.masterComplaints.find((m) => m.id === masterId);
    if (!master) return null;

    const oldStatus = master.status;
    master.status = newStatus;
    master.updatedAt = new Date().toISOString();

    let updatedChildrenCount = 0;
    for (const g of this.grievances) {
      if (g.masterComplaintId === masterId) {
        g.status = newStatus;
        if (officerComment) g.officerComment = officerComment;
        g.updatedAt = new Date().toISOString();
        updatedChildrenCount++;
      }
    }

    // Append audit log
    this.statusLogs.push({
      id: `log-${Date.now()}`,
      masterComplaintId: masterId,
      officerName,
      oldStatus,
      newStatus,
      comment: officerComment || `Status updated to ${newStatus} (cascaded to ${updatedChildrenCount} complaints).`,
      proofImageUrl,
      createdAt: new Date().toISOString(),
    });

    return { master, updatedChildrenCount };
  }

  // Update individual grievance status
  public updateGrievanceStatus(
    grievanceId: string,
    newStatus: ComplaintStatus,
    officerComment?: string,
    officerName: string = 'Rohit Sharma (PWD)'
  ): Grievance | null {
    const g = this.grievances.find((item) => item.id === grievanceId);
    if (!g) return null;

    const oldStatus = g.status;
    g.status = newStatus;
    if (officerComment) g.officerComment = officerComment;
    g.updatedAt = new Date().toISOString();

    this.statusLogs.push({
      id: `log-${Date.now()}`,
      grievanceId,
      masterComplaintId: g.masterComplaintId || undefined,
      officerName,
      oldStatus,
      newStatus,
      comment: officerComment || `Status changed to ${newStatus}`,
      createdAt: new Date().toISOString(),
    });

    return g;
  }

  public getStatusLogs(targetId: string): StatusLog[] {
    return this.statusLogs.filter(
      (log) => log.masterComplaintId === targetId || log.grievanceId === targetId
    );
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();
