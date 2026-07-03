import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (isAuthenticated) {
        action?.();
      } else {
        setShowPrompt(true);
      }
    },
    [isAuthenticated],
  );

  return { requireAuth, showPrompt, setShowPrompt };
}
