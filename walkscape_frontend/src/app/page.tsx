'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import LandingPage from '@/components/LandingPage';
import RegistrationModal from '@/components/RegistrationModal';

export default function Home() {
  const { isConnected, isLoading, isRegistered, registrationState } = useWallet();
  const router = useRouter();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  // Handle redirect to dashboard - only once when conditions are met
  useEffect(() => {
    // Only redirect once we've completed registration check and user is registered
    if (!isLoading && isConnected && registrationState === 'registered' && !hasCheckedRedirect) {
      setHasCheckedRedirect(true);
      router.push('/dashboard');
    }
  }, [isConnected, registrationState, isLoading, hasCheckedRedirect, router]);

  // Reset redirect check when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasCheckedRedirect(false);
    }
  }, [isConnected]);

  // Show loading state while initial connection is being established
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not connected
  if (!isConnected) {
    return <LandingPage />;
  }

  // If connected and registered, show loading while redirecting
  if (isConnected && registrationState === 'registered') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If connected but explicitly unregistered (check complete), show registration modal
  if (isConnected && registrationState === 'unregistered') {
    return (
      <>
        <LandingPage />
        <RegistrationModal
          isOpen={true}
          onClose={() => { }}
        />
      </>
    );
  }

  // Fallback
  return <LandingPage />;
}
