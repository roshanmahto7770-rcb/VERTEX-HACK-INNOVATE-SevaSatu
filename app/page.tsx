'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ImpactSection } from '@/components/landing/ImpactSection';
import { Footer } from '@/components/landing/Footer';
import { SubmitComplaintModal } from '@/components/landing/SubmitComplaintModal';
import { TrackComplaintModal } from '@/components/landing/TrackComplaintModal';
import { Grievance, MasterComplaint } from '@/lib/types';
import { CheckCircle2, X, Search } from 'lucide-react';

export default function CitizenPortalLandingPage() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [lastSubmittedTicket, setLastSubmittedTicket] = useState<{
    ticketNumber: string;
    issueTitle: string;
    department: string;
  } | null>(null);

  const handleGrievanceSubmitted = (
    grievance: Grievance,
    masterTicket: MasterComplaint | null
  ) => {
    setLastSubmittedTicket({
      ticketNumber: grievance.ticketNumber,
      issueTitle: grievance.issueTitle,
      department: grievance.department,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Top Floating Success Alert Toast after Done */}
      {lastSubmittedTicket && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white p-4 sm:p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border-2 border-emerald-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base leading-tight">
                  🎉 Complaint Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-100 mt-1">
                  Ticket ID:{' '}
                  <span className="font-mono font-black text-white bg-emerald-700/80 px-2 py-0.5 rounded">
                    {lastSubmittedTicket.ticketNumber}
                  </span>{' '}
                  • Assigned to {lastSubmittedTicket.department}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsTrackModalOpen(true);
                  setLastSubmittedTicket(null);
                }}
                className="px-3.5 py-2 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Track Status
              </button>
              <button
                onClick={() => setLastSubmittedTicket(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        onTrackClick={() => setIsTrackModalOpen(true)}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onSubmitClick={() => setIsSubmitModalOpen(true)}
          onTrackClick={() => setIsTrackModalOpen(true)}
        />

        {/* 4-Step "How It Works" Section */}
        <HowItWorks />

        {/* "Impact at a Glance" Metrics Section */}
        <ImpactSection />
      </main>

      {/* Dark Footer */}
      <Footer
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        onTrackClick={() => setIsTrackModalOpen(true)}
      />

      {/* Interactive Complaint Submission Modal */}
      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={handleGrievanceSubmitted}
      />

      {/* Interactive Citizen Tracking Modal */}
      <TrackComplaintModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </div>
  );
}
