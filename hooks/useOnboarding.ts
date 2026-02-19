import { useState } from 'react';

const STORAGE_KEY = 'caremanager_onboarding_completed';

export function useOnboarding() {
  const [showTour, setShowTour] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  });

  const completeTour = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  };

  const reopenTour = () => {
    setShowTour(true);
  };

  return { showTour, completeTour, reopenTour };
}
