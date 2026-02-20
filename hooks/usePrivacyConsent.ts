import { useState, useEffect } from 'react';
import { PRIVACY_POLICY_VERSION } from '../components/privacy/privacyContent';
import { getPrivacyConsent, savePrivacyConsent, DEMO_USER_UID } from '../services/firebase';

export type ConsentStatus = 'loading' | 'required' | 'consented';

interface UsePrivacyConsentReturn {
  consentStatus: ConsentStatus;
  saveConsent: () => Promise<void>;
  isSaving: boolean;
}

export function usePrivacyConsent(userId: string | null): UsePrivacyConsentReturn {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('loading');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setConsentStatus('loading');
      return;
    }

    // デモユーザーは自動同意済み扱い
    if (userId === DEMO_USER_UID) {
      setConsentStatus('consented');
      return;
    }

    getPrivacyConsent(userId)
      .then((consent) => {
        if (consent && consent.privacyConsentVersion === PRIVACY_POLICY_VERSION) {
          setConsentStatus('consented');
        } else {
          setConsentStatus('required');
        }
      })
      .catch(() => {
        // エラー時は要同意として扱う（安全側に倒す）
        setConsentStatus('required');
      });
  }, [userId]);

  const saveConsent = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await savePrivacyConsent(userId, PRIVACY_POLICY_VERSION);
      setConsentStatus('consented');
    } finally {
      setIsSaving(false);
    }
  };

  return { consentStatus, saveConsent, isSaving };
}
