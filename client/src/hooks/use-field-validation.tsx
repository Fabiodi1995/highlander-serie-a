import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface ValidationResult {
  isValid: boolean;
  isChecking: boolean;
  message?: string;
}

export function useFieldValidation() {
  const [usernameValidation, setUsernameValidation] = useState<ValidationResult>({
    isValid: true,
    isChecking: false
  });
  
  const [emailValidation, setEmailValidation] = useState<ValidationResult>({
    isValid: true,
    isChecking: false
  });

  const validateUsername = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameValidation({
          isValid: false,
          isChecking: false,
          message: 'Username deve essere almeno 3 caratteri'
        });
        return;
      }

      setUsernameValidation({ isValid: true, isChecking: true });
      
      try {
        const response = await apiRequest('GET', `/api/validate/username/${encodeURIComponent(username)}`);
        const data = await response.json();
        
        setUsernameValidation({
          isValid: data.available,
          isChecking: false,
          message: data.available ? 'Username disponibile' : 'Username già utilizzato'
        });
      } catch (error) {
        setUsernameValidation({
          isValid: false,
          isChecking: false,
          message: 'Errore durante la validazione'
        });
      }
    }, 500),
    []
  );

  const validateEmail = useCallback(
    debounce(async (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!email || !emailRegex.test(email)) {
        setEmailValidation({
          isValid: false,
          isChecking: false,
          message: 'Email non valida'
        });
        return;
      }

      setEmailValidation({ isValid: true, isChecking: true });
      
      try {
        const response = await apiRequest('GET', `/api/validate/email/${encodeURIComponent(email)}`);
        const data = await response.json();
        
        setEmailValidation({
          isValid: data.available,
          isChecking: false,
          message: data.available ? 'Email disponibile' : 'Email già utilizzata'
        });
      } catch (error) {
        setEmailValidation({
          isValid: false,
          isChecking: false,
          message: 'Errore durante la validazione'
        });
      }
    }, 500),
    []
  );

  const resetValidation = useCallback(() => {
    setUsernameValidation({ isValid: true, isChecking: false });
    setEmailValidation({ isValid: true, isChecking: false });
  }, []);

  return {
    usernameValidation,
    emailValidation,
    validateUsername,
    validateEmail,
    resetValidation
  };
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}