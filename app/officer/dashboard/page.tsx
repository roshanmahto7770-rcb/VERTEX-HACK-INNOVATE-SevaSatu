'use client';

import React, { useState, useEffect } from 'react';
import { OfficerSidebar } from '@/components/officer/OfficerSidebar';
import { OfficerHeader } from '@/components/officer/OfficerHeader';
import { StatCard } from '@/components/officer/StatCard';
import { ComplaintsChart } from '@/components/officer/ComplaintsChart';
import { CategoriesDonut } from '@/components/officer/CategoriesDonut';
import { ClusterAlertBanner } from '@/components/officer/ClusterAlertBanner';
import { RecentComplaintsTable } from '@/components/officer/RecentComplaintsTable';
import { PriorityDistribution } from '@/components/officer/PriorityDistribution';
import { ComplaintDetailModal } from '@/components/officer/ComplaintDetailModal';
import { ClusterVerificationModal } from '@/components/officer/ClusterVerificationModal';
import { Grievance, MasterComplaint } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function OfficerDashboardPage() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter states
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [sortBy, setSortBy] = useState('priority');

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Grievance[]>([]);
  const [masterComplaints, setMasterComplaints] = useState<MasterComplaint[]>([]);
  const [activeCluster, setActiveCluster] = useState<MasterComplaint | null>(null);

  // Selected item modals
  const [activeDetailComplaint, setActiveDetailComplaint] = useState<Grievance | null>(null);
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [inspectingCluster, setInspectingCluster] = useState<MasterComplaint | null>(null);

  // Fetch initial officer complaints and clusters
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/officer/grievances?department=${encodeURIComponent(selectedDept)}&sortBy=${sortBy}`
      );
      const data = await res.json();
      if (data.success) {
        setComplaints(data.grievances);
        setMasterComplaints(data.masterComplaints);

        // Find primary active cluster (e.g. MG Road 3 complaints)
        const topCluster = data.activeClusters?.[0] || data.masterComplaints?.[0] || null;
        setActiveCluster(topCluster);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDept, sortBy]);

  // Tab filtering
  const displayedComplaints = complaints.filter((item) => {
    if (currentTab === 'assigned') return item.status === 'Assigned';
    if (currentTab === 'in_progress') return item.status === 'In_Progress';
    if (currentTab === 'resolved') return item.status === 'Resolved';
    return true; // 'dashboard' or 'all'
  });

  // Handle status update callback
  const handleStatusUpdated = (updated: Grievance) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    // Refresh to capture cascading updates to children
    fetchDashboardData();
  };

  // Open cluster verification modal
  const handleOpenClusterModal = (cluster: MasterComplaint) => {
    setInspectingCluster(cluster);
    setIsClusterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar matching mockup */}
      <OfficerSidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <OfficerHeader
          onMenuToggle={() => setIsMobileSidebarOpen(true)}
          title={
            currentTab === 'dashboard'
              ? 'Dashboard'
              : currentTab === 'assigned'
              ? 'Assigned to Me'
              : currentTab === 'in_progress'
              ? 'In Progress Complaints'
              : currentTab === 'resolved'
              ? 'Resolved Complaints'
              : 'All Complaints'
          }
        />

        {/* Scrollable Dashboard Body */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              label="Total Complaints"
              value="1,248"
              change="12% this week"
              changeType="positive"
            />
            <StatCard
              label="Critical / High"
              value="156"
              change="8% this week"
              changeType="negative"
            />
            <StatCard
              label="In Progress"
              value="320"
              change="5% this week"
              changeType="neutral"
            />
            <StatCard
              label="Resolved"
              value="772"
              change="15% this week"
              changeType="positive"
            />
          </div>

          {/* Middle Row: Complaints Overview Chart & Top Categories Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <ComplaintsChart />
            </div>
            <div className="lg:col-span-5">
              <CategoriesDonut />
            </div>
          </div>

          {/* AI Cluster Detection Banner */}
          <ClusterAlertBanner
            cluster={activeCluster}
            onViewCluster={handleOpenClusterModal}
            onVerifyCluster={handleOpenClusterModal}
          />

          {/* Recent Complaints Table */}
          <RecentComplaintsTable
            complaints={displayedComplaints}
            onViewComplaint={(item) => setActiveDetailComplaint(item)}
            selectedDepartment={selectedDept}
            onSelectDepartment={setSelectedDept}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onViewAllClick={() => setCurrentTab('all')}
          />

          {/* Bottom Row: Priority Distribution & AI Insights */}
          <PriorityDistribution />
        </main>
      </div>

      {/* Slide-over Complaint Detail Modal (as shown in bottom right of mockup) */}
      <ComplaintDetailModal
        complaint={activeDetailComplaint}
        onClose={() => setActiveDetailComplaint(null)}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Cluster Verification & Merge Modal */}
      <ClusterVerificationModal
        cluster={inspectingCluster}
        linkedComplaints={
          inspectingCluster
            ? complaints.filter((c) =>
                inspectingCluster.linkedGrievanceIds.includes(c.id) ||
                c.masterComplaintId === inspectingCluster.id
              )
            : []
        }
        isOpen={isClusterModalOpen}
        onClose={() => setIsClusterModalOpen(false)}
        onClusterVerified={(verifiedMaster) => {
          fetchDashboardData();
        }}
        onUnlinkChild={(childId) => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
