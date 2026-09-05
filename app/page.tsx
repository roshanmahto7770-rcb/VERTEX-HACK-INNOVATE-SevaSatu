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

export default function CitizenPortalLandingPage() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const handleGrievanceSubmitted = (
    grievance: Grievance,
    masterTicket: MasterComplaint | null
  ) => {
    console.log('Grievance registered successfully:', grievance.ticketNumber);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
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

      {/* Interactive Complaint Submission Interface */}
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
