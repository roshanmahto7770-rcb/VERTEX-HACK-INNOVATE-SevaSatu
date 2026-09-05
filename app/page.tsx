'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ImpactSection } from '@/components/landing/ImpactSection';
import { Footer } from '@/components/landing/Footer';
import { SubmitComplaintModal } from '@/components/landing/SubmitComplaintModal';
import { TrackComplaintModal } from '@/components/landing/TrackComplaintModal';
import { UserProfileModal, getSavedProfile, UserProfile } from '@/components/landing/UserProfileModal';
import { Grievance, MasterComplaint } from '@/lib/types';

export default function CitizenPortalLandingPage() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);

  // Load profile from localStorage on mount
  useEffect(() => {
    setSavedProfile(getSavedProfile());
  }, []);

  const handleGrievanceSubmitted = (
    grievance: Grievance,
    masterTicket: MasterComplaint | null
  ) => {
    console.log('Grievance registered successfully:', grievance.ticketNumber);
  };

  const handleProfileSaved = (profile: UserProfile) => {
    setSavedProfile(profile);
  };

  // Open profile modal and close submit modal momentarily so user can edit
  const handleOpenProfileFromComplaint = () => {
    setIsProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <Navbar
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        onTrackClick={() => setIsTrackModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        savedProfile={savedProfile}
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

      {/* User Profile Modal — save name, phone & home address once */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaved={handleProfileSaved}
      />

      {/* Interactive Complaint Submission Interface */}
      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={handleGrievanceSubmitted}
        onOpenProfileModal={handleOpenProfileFromComplaint}
      />

      {/* Interactive Citizen Tracking Modal */}
      <TrackComplaintModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </div>
  );
}
